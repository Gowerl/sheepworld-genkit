import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as fs from "fs";
import * as path from "path";

// Configure constants based on sheepworld GCP setup
const PROJECT_ID = "sheep-vertex-ai";
const LOCATION = "us";
const APP_ID = "4f81f7dc-1ac2-49e5-8316-4fc755c057f7";
const APP_VERSION = "projects/sheep-vertex-ai/locations/us/apps/4f81f7dc-1ac2-49e5-8316-4fc755c057f7/versions/333686b5-09c7-4090-9148-15bbcd6ef2b8";
const DEPLOYMENT = "projects/sheep-vertex-ai/locations/us/apps/4f81f7dc-1ac2-49e5-8316-4fc755c057f7/deployments/7ed542cb-8a37-4a4f-8bc3-95831144346c";

// Interface for search results internally
interface SearchResult {
  title: string;
  uri: string;
  snippet: string;
}

// Lazy loading helper for Google Auth to avoid slow top-level initialization
let authInstance: any = null;
async function getGoogleAuth() {
  if (!authInstance) {
    const { GoogleAuth } = await import("google-auth-library");
    authInstance = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });
  }
  return authInstance;
}

// Lazy loading helper for Firebase Admin to avoid slow initialization and handle DB/Storage operations
let adminInstance: any = null;
async function getFirebaseAdmin() {
  if (!adminInstance) {
    const adminModule = await import("firebase-admin");
    const admin = adminModule.default || adminModule;
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: PROJECT_ID,
        storageBucket: "sheep-vertex-ai.firebasestorage.app"
      });
    }
    adminInstance = admin;
  }
  return adminInstance;
}

// Lazy loading helper for Genkit to speed up deploy & start-up times
let aiInstance: any = null;
async function getGenkit() {
  if (!aiInstance) {
    const { genkit } = await import("genkit");
    const { vertexAI } = await import("@genkit-ai/google-genai");
    const { enableFirebaseTelemetry } = await import("@genkit-ai/firebase");

    // Enable Firebase Telemetry for Cloud tracing & monitoring in GCP/Emulator environments
    if (process.env.K_SERVICE || process.env.FUNCTIONS_EMULATOR) {
      enableFirebaseTelemetry();
    }

    aiInstance = genkit({
      plugins: [
        vertexAI({
          projectId: PROJECT_ID,
          location: "us-central1" // Flagship region for Gemini and Imagen models
        })
      ]
    });
  }
  return aiInstance;
}

// Helper to fetch a product page and extract its main Open Graph image URL
async function extractOgImage(url: string): Promise<string | null> {
  try {
    if (!url || !url.startsWith("http")) return null;
    
    logger.info(`Extracting og:image from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(3000)
    });
    
    if (!response.ok) {
      logger.warn(`Failed to fetch product page ${url}: Status ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    const ogImageRegex = /<meta\s+[^>]*property=["']og:image["']\s+[^>]*content=["']([^"']+)["']/i;
    const match1 = html.match(ogImageRegex);
    if (match1 && match1[1]) return match1[1];
    
    const ogImageRegex2 = /<meta\s+[^>]*content=["']([^"']+)["']\s+[^>]*property=["']og:image["']/i;
    const match2 = html.match(ogImageRegex2);
    if (match2 && match2[1]) return match2[1];
    
    return null;
  } catch (error) {
    logger.error(`Error extracting og:image from ${url}:`, error);
    return null;
  }
}

// Helper function to crawl a product page and extract both title and Open Graph image
async function fetchPageDetails(url: string): Promise<{ title: string; url: string; imageUrl: string | null } | null> {
  try {
    if (!url || !url.startsWith("http")) return null;
    
    logger.info(`Scraping product page details for URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(3000)
    });
    
    if (!response.ok) {
      logger.warn(`Failed to fetch page details for ${url}: Status ${response.status}`);
      return { title: "Onlineshop Produkt", url: url, imageUrl: null };
    }
    
    const html = await response.text();
    
    // 1. Extract Title (og:title or <title>)
    let title = "";
    const ogTitleRegex = /<meta\s+[^>]*property=["']og:title["']\s+[^>]*content=["']([^"']+)["']/i;
    const ogTitleRegex2 = /<meta\s+[^>]*content=["']([^"']+)["']\s+[^>]*property=["']og:title["']/i;
    const titleTagRegex = /<title[^>]*>([^<]+)<\/title>/i;
    
    const matchOg1 = html.match(ogTitleRegex);
    const matchOg2 = html.match(ogTitleRegex2);
    const matchTag = html.match(titleTagRegex);
    
    if (matchOg1 && matchOg1[1]) title = matchOg1[1];
    else if (matchOg2 && matchOg2[1]) title = matchOg2[1];
    else if (matchTag && matchTag[1]) title = matchTag[1];
    else {
      // Use slug as fallback title
      const slug = url.split("/").pop()?.replace(/-/g, " ") || "Onlineshop Produkt";
      title = slug.charAt(0).toUpperCase() + slug.slice(1);
    }
    
    // Clean up title
    title = title.replace(/\s*\|\s*sheepworld/i, "").trim();
    
    // 2. Extract Image
    let imageUrl: string | null = null;
    const ogImageRegex = /<meta\s+[^>]*property=["']og:image["']\s+[^>]*content=["']([^"']+)["']/i;
    const ogImageRegex2 = /<meta\s+[^>]*content=["']([^"']+)["']\s+[^>]*property=["']og:image["']/i;
    
    const matchImg1 = html.match(ogImageRegex);
    const matchImg2 = html.match(ogImageRegex2);
    if (matchImg1 && matchImg1[1]) imageUrl = matchImg1[1];
    else if (matchImg2 && matchImg2[1]) imageUrl = matchImg2[1];
    
    logger.info(`Successfully scraped title: "${title}" and image: "${imageUrl}" for URL ${url}`);
    return { title, url, imageUrl };
  } catch (error) {
    logger.error(`Error scraping page details for ${url}:`, error);
    return { title: "Onlineshop Produkt", url: url, imageUrl: null };
  }
}

// Helper function to log module usage to Firestore
async function logModuleUsage(moduleName: string, request: any) {
  try {
    const admin = await getFirebaseAdmin();
    const db = admin.firestore();

    const uid = request.auth?.uid || "anonym";
    const email = request.auth?.token?.email || "anonymer_benutzer@myc3.com";

    logger.info(`Audit Log: User ${email} (${uid}) accessed module: ${moduleName}`);

    await db.collection("audit_logs").add({
      uid: uid,
      email: email,
      module: moduleName,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    logger.error(`Failed to write audit log for module ${moduleName}:`, err);
  }
}

// Helper to search the Vertex AI Search Enterprise Engine (returns raw snippets)
async function searchVertexAISearch(query: string): Promise<SearchResult[]> {
  try {
    const auth = await getGoogleAuth();
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    const combinations = [
      { type: "dataStores", loc: "europe-west4", endpoint: "europe-west4-discoveryengine.googleapis.com", engine: "datastorage-sheepworld-de_1787649919596" },
      { type: "engines", loc: "europe-west4", endpoint: "europe-west4-discoveryengine.googleapis.com", engine: "sheepworld-enterprise_1787738222029" },
      { type: "engines", loc: "eu", endpoint: "eu-discoveryengine.googleapis.com", engine: "sheepworld-enterprise_1787738222029" },
      { type: "engines", loc: "us", endpoint: "us-discoveryengine.googleapis.com", engine: "sheepworld-enterprise_1787738222029" },
      { type: "engines", loc: "global", endpoint: "discoveryengine.googleapis.com", engine: "sheepworld-enterprise_1787738222029" },
      { type: "dataStores", loc: "eu", endpoint: "eu-discoveryengine.googleapis.com", engine: "datastorage-sheepworld-de_1787649919596" },
      { type: "dataStores", loc: "us", endpoint: "us-discoveryengine.googleapis.com", engine: "datastorage-sheepworld-de_1787649919596" },
      { type: "dataStores", loc: "global", endpoint: "discoveryengine.googleapis.com", engine: "datastorage-sheepworld-de_1787649919596" }
    ];

    let response: any = null;
    for (const comb of combinations) {
      const url = `https://${comb.endpoint}/v1/projects/${PROJECT_ID}/locations/${comb.loc}/collections/default_collection/${comb.type}/${comb.engine}/servingConfigs/default_search:search`;
      logger.info(`Trying Discovery Engine query at ${comb.loc} for ${comb.type} ${comb.engine}...`);
      
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-goog-user-project": PROJECT_ID,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query: query,
            pageSize: 4
          })
        });

        if (res.ok) {
          response = res;
          logger.info(`Successfully fetched results from engine ${comb.engine} in region ${comb.loc}!`);
          break;
        } else {
          logger.warn(`Endpoint failed with status ${res.status} for engine ${comb.engine} in region ${comb.loc}.`);
        }
      } catch (err) {
        logger.error(`Fetch error on endpoint ${url}:`, err);
      }
    }

    if (!response) {
      logger.error("All search Discovery Engine endpoints failed.");
      return [];
    }

    const data = await response.json() as any;
    const results = (data.results || []).map((res: any) => {
      const doc = res.document || {};
      const structData = doc.derivedStructData || {};
      
      let snippet = "";
      if (structData.snippets && structData.snippets.length > 0) {
        snippet = structData.snippets[0].snippet || "";
      } else {
        snippet = structData.htmlTitle || structData.title || "";
      }

      return {
        title: structData.title || "Webseite",
        uri: structData.link || "",
        snippet: snippet || ""
      };
    });
    return results;
  } catch (error) {
    logger.error("Error querying Discovery Engine for grounding:", error);
    return [];
  }
}

// Helper function to sanitize any generated markdown links inside SEO text using real RAG search results
function sanitizeMarkdownLinks(content: string, searchResults: SearchResult[]): string {
  if (!content || !searchResults || searchResults.length === 0) return content;

  // Regex to match markdown links: [Anchor](URL)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return content.replace(linkRegex, (match, anchor, url) => {
    logger.info(`Found markdown link in SEO content: [${anchor}](${url})`);

    // Check if the URL is already 100% correct and exists in search results
    const exactMatch = searchResults.find(r => r.uri === url);
    if (exactMatch) {
      logger.info(`Link is already 100% correct: ${url}`);
      return match;
    }

    // Attempt to match the link fuzzily based on the anchor text or the URL
    const anchorLower = anchor.toLowerCase();

    // 1. Try to match by title/anchor text
    let matchedDoc = searchResults.find(r => {
      const titleLower = r.title.toLowerCase();
      return titleLower.includes(anchorLower) || anchorLower.includes(titleLower) ||
             titleLower.replace(/[^a-z0-9]/g, "").includes(anchorLower.replace(/[^a-z0-9]/g, "")) ||
             anchorLower.replace(/[^a-z0-9]/g, "").includes(titleLower.replace(/[^a-z0-9]/g, ""));
    });

    // 2. If no title match, try to match fuzzily by URL slug/name
    if (!matchedDoc) {
      matchedDoc = searchResults.find(r => {
        if (!r.uri) return false;
        const rSlug = r.uri.split("/").pop()?.toLowerCase() || "";
        const uSlug = url.split("/").pop()?.toLowerCase() || "";
        return rSlug.includes(uSlug) || uSlug.includes(rSlug) ||
               (r.uri.includes("sheepworld.de") && url.includes("sheepworld.de") && r.uri.length > 25 && url.length > 25);
      });
    }

    if (matchedDoc && matchedDoc.uri) {
      logger.info(`Corrected markdown link to: [${anchor}](${matchedDoc.uri})`);
      return `[${anchor}](${matchedDoc.uri})`;
    }

    // Fallback: If it's a generic link, and we have real RAG results, replace with the first real result link!
    if ((url === "https://sheepworld.de" || url === "https://www.sheepworld.de" || !url.split("/").pop()?.match(/\d+$/)) && searchResults[0]?.uri) {
      logger.info(`Corrected generic/broken link fallback to first RAG result: [${anchor}](${searchResults[0].uri})`);
      return `[${anchor}](${searchResults[0].uri})`;
    }

    return match;
  });
}

// Helper to traverse and augment response payload structures with real image URLs
async function augmentPayloadWithRealImages(data: any) {
  if (!data || typeof data !== "object") return;

  if (Array.isArray(data.outputs)) {
    for (const output of data.outputs) {
      let payload = output.structData || output.payload || null;
      
      if (!payload) {
        const keys = Object.keys(output);
        const potentialKeys = keys.filter(k => !["text", "media", "turnCompleted", "turnIndex", "diagnosticInfo"].includes(k));
        for (const key of potentialKeys) {
          if (output[key] && typeof output[key] === "object") {
            payload = output[key];
            break;
          }
        }
      }

      if (payload && typeof payload === "object") {
        if (payload.type === "base_product_detail" || payload.uri) {
          if (payload.uri) {
            const realImg = await extractOgImage(payload.uri);
            if (realImg) {
              payload.imageUris = [realImg];
              logger.info(`Injected real og:image for ${payload.title || "product"}: ${realImg}`);
            } else {
              logger.warn(`Filtering out broken single product payload: ${payload.title} (${payload.uri})`);
              output.structData = null;
              output.payload = null;
              const keys = Object.keys(output);
              const potentialKeys = keys.filter(k => !["text", "media", "turnCompleted", "turnIndex", "diagnosticInfo"].includes(k));
              for (const key of potentialKeys) {
                output[key] = null;
              }
            }
          }
        }
        
        if (Array.isArray(payload.productDetails)) {
          const validProducts: any[] = [];
          
          await Promise.all(
            payload.productDetails.map(async (product: any) => {
              if (product.uri) {
                const realImg = await extractOgImage(product.uri);
                if (realImg) {
                  product.imageUris = [realImg];
                  validProducts.push(product);
                  logger.info(`Kept valid carousel product ${product.title || "product"}: ${realImg}`);
                } else {
                  logger.warn(`Filtered out broken carousel product: ${product.title} (${product.uri})`);
                }
              }
            })
          );

          payload.productDetails = validProducts;

          if (validProducts.length === 0) {
            logger.warn("Carousel is empty after filtering out 404s. Removing payload.");
            output.structData = null;
            output.payload = null;
            const keys = Object.keys(output);
            const potentialKeys = keys.filter(k => !["text", "media", "turnCompleted", "turnIndex", "diagnosticInfo"].includes(k));
            for (const key of potentialKeys) {
              output[key] = null;
            }
          }
        }
      }
    }
  }
}

// 1. Define the Chat/Conversation Proxy (onRequest / onCall)
export const runSession = onCall({ region: "europe-west4", cors: true }, async (request) => {
  try {
    await logModuleUsage("KI-Service (Chat)", request);
    const { message, sessionId } = request.data;
    if (!message) {
      throw new HttpsError("invalid-argument", "Missing field: message");
    }

    const activeSessionId = sessionId || "Oxgdzj7gjhlufn4";
    logger.info(`Processing message for session ${activeSessionId}`);

    const auth = await getGoogleAuth();
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new HttpsError("internal", "Failed to generate Google Cloud access token");
    }

    const apiUrl = `https://ces.googleapis.com/v1beta/projects/${PROJECT_ID}/locations/${LOCATION}/apps/${APP_ID}/sessions/${activeSessionId}:runSession`;

    const requestBody = {
      config: {
        session: `projects/${PROJECT_ID}/locations/${LOCATION}/apps/${APP_ID}/sessions/${activeSessionId}`,
        app_version: APP_VERSION,
        deployment: DEPLOYMENT
      },
      inputs: [
        {
          text: message
        }
      ]
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Error from Google CES API:", errorText);
      throw new HttpsError("internal", `Google CES API error: ${errorText}`);
    }

    const responseData = await response.json();
    await augmentPayloadWithRealImages(responseData);

    return responseData;
  } catch (error: any) {
    logger.error("Unhandled error in runSession proxy:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Internal Server Error: ${error.message}`);
  }
});

// 2. Export the Genkit SEO Content-Generator as a Callable Cloud Function
export const generateSEOContent = onCall({ region: "europe-west4", cors: true, timeoutSeconds: 300 }, async (request) => {
  try {
    await logModuleUsage("SEO/GEO-Generator", request);
    const { topic, bulletPoints, targetAudience, keywords, productUrl } = request.data;
    
    if (!topic || !bulletPoints) {
      throw new HttpsError("invalid-argument", "Missing fields: topic or bulletPoints");
    }

    logger.info(`Starting Genkit SEO content flow for topic: ${topic}`);

    // 1. Fetch grounding context from search datastore
    const searchResults = await searchVertexAISearch(topic);
    const contextText = searchResults
      .map((r, idx) => `[Quelle ${idx + 1}]: Titel: ${r.title}\nURL: ${r.uri}\nTextauszug: ${r.snippet}`)
      .join("\n\n");

    logger.info(`Found ${searchResults.length} grounding documents from Datastore.`);

    // 2. Build SEO/GEO instructions prompt
    const prompt = `Du bist ein hochkarätiger SEO- und GEO-Texter (Generative Engine Optimization) für den Onlineshop sheepworld.de.
Deine Aufgabe ist es, einen perfekt optimierten, conversion-starken und suchmaschinenoptimierten Werbe- oder Blogtext für das folgende Thema zu generieren:

Thema: ${topic}
${productUrl ? `Aktuelle Produkt-URL (Achtung: Beziehe dich inhaltlich auf diese Seite, aber verlinke sie auf KEINEN Fall im Text, da der User sich bereits auf dieser URL befindet): ${productUrl}` : ""}
Vorgegebene Stichpunkte/Inhalte (die zwingend einfließen müssen): ${bulletPoints}
Einzubindende SEO-Keywords: ${keywords || ""}
Zielgruppe: ${targetAudience || "Kunden von sheepworld"} (Nutze ein herzliches, freundschaftliches "Du" für Endkunden).

STRIKTE RICHTLINIEN FÜR DEN TEXT:
- Nutze die unten stehenden Hintergrundinformationen aus unserem Datenspeicher, um korrekte Fakten, Eigenschaften, Preise und Links zu verwenden.
- Strukturiere den Text lesefreundlich mit Zwischenüberschriften (Markdown H2, H3), kurzen Absätzen und Aufzählungspunkten (Bulletpoints).
- WICHTIG FÜR GEO (Generative Engine Optimization): Formuliere klare, faktenbasierte und strukturierte Sätze. Baue im Text Fragen und präzise direkte Antworten ein (z. B. "Aus welchem Material besteht die Bettwäsche? Die Bettwäsche besteht zu 100 % aus Baumwolle."), damit moderne KI-Suchmaschinen (wie Google Gemini, Perplexity) deine Inhalte leicht erfassen, aggregieren und direkt zitieren können!
- WICHTIGE INTERNE VERLINKUNG (Smarte Deeplinks):
  - Der Nutzer befindet sich bereits auf der Seite für das Hauptthema oder -produkt (${topic})${productUrl ? ` unter der URL ${productUrl}` : ""}. Es macht daher KEINEN Sinn, auf dieses Hauptprodukt selbst oder diese URL zu verlinken!
  - Durchsuche die Hintergrundinformationen stattdessen gezielt nach anderen, passenden Ergänzungsprodukten, weiteren Geschenkideen, Kollektionen oder Angeboten (z. B. wenn das Thema "Bettwäsche" ist, verlinke auf passende Tassen, Kissen, Karten oder die übergeordnete Serie aus den Hintergrunddaten).
  - Integriere 1 bis 2 dieser ergänzenden Deeplinks vollkommen natürlich als Markdown-Links im Fließtext (z. B. am Ende unter "Noch mehr Geschenkideen gesucht?" oder im Text eingebunden).
  - Verwende stets sprechende Anchor-Texte (z. B. '[unserer passenden Faultier-Kollektion](URL)' oder '[Stöbere auch in unseren Geschenk-Angeboten](URL)'), NIEMALS generische Worte wie "hier" oder "Link".
  - Absolute Pflicht: Nutze AUSSCHLIESSLICH die exakten, realen URLs aus den bereitgestellten Hintergrundinformationen. Erfinde niemals URLs oder Pfade!
- Der Text muss eine Länge von ca. 200 bis 350 Wörtern haben.

HINTERGRUNDINFORMATIONEN (Fakten-Daten aus deinem Datenspeicher):
${contextText || "Keine spezifischen Hintergrunddaten gefunden. Generiere basierend auf allgemeinen Informationen über sheepworld."}

Generiere eine strukturierte JSON-Antwort mit exakt folgenden Feldern:
- title: Ein fesselnder, SEO-optimierter H1-Titel (maximal 60 Zeichen).
- metaDescription: Eine ansprechende Meta-Beschreibung für Google (maximal 155 Zeichen).
- content: Der vollständige, ausführlich ausformulierte Text im Markdown-Format.`;

    // 3. Lazy-load Genkit dependencies
    const { z } = await import("genkit");
    const { vertexAI } = await import("@genkit-ai/google-genai");
    const ai = await getGenkit();

    // 4. Generate structured content using Gemini 2.5 Flash via Vertex AI plugin
    const response = await ai.generate({
      model: vertexAI.model("gemini-3.5-flash"),
      prompt: prompt,
      output: {
        schema: z.object({
          title: z.string(),
          metaDescription: z.string(),
          content: z.string()
        })
      }
    });

    const parsedOutput = response.output;
    if (parsedOutput) {
      const sanitizedContent = sanitizeMarkdownLinks(parsedOutput.content || "", searchResults);
      return {
        title: parsedOutput.title || `${topic} - sheepworld`,
        metaDescription: parsedOutput.metaDescription || `Entdecke tolle Geschenke zum Thema ${topic} bei sheepworld!`,
        content: sanitizedContent,
        sources: searchResults.map(r => ({ title: r.title, uri: r.uri }))
      };
    } else {
      logger.error("Failed to generate structured content from Gemini:", response.text);
      const sanitizedContent = sanitizeMarkdownLinks(response.text || "", searchResults);
      return {
        title: `${topic} - sheepworld`,
        metaDescription: `Entdecke tolle Geschenke zum Thema ${topic} bei sheepworld!`,
        content: sanitizedContent,
        sources: searchResults.map(r => ({ title: r.title, uri: r.uri }))
      };
    }
  } catch (error: any) {
    logger.error("Unhandled error in generateSEOContent flow:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Internal Server Error: ${error.message}`);
  }
});

// Helper to lazily load and cache style reference images from assets for Gemini 3 Pro multimodal generation
let cachedReferenceMedia: any[] | null = null;
function getReferenceMediaParts() {
  if (!cachedReferenceMedia) {
    try {
      const assetsDir = path.join(process.cwd(), "assets");
      const files = ["sheep1.png", "sheep2.png", "sheep3.png", "sheep4.png"];
      
      cachedReferenceMedia = files.map(file => {
        const filePath = path.join(assetsDir, file);
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          return {
            media: {
              url: `data:image/png;base64,${buffer.toString("base64")}`,
              contentType: "image/png"
            }
          };
        }
        return null;
      }).filter(Boolean);
      
      logger.info(`Loaded ${cachedReferenceMedia.length} style reference images for Gemini 3 Pro.`);
    } catch (err) {
      logger.error("Error loading style reference images:", err);
      cachedReferenceMedia = [];
    }
  }
  return cachedReferenceMedia;
}

// 3. Export the Greeting Card Generator as a Callable Cloud Function
export const generateGreetingCard = onCall({ region: "europe-west4", cors: true, timeoutSeconds: 300 }, async (request) => {
  try {
    await logModuleUsage("Postkarten-Atelier", request);
    const { empfaenger, absender, anlass, stimmung, insider, motifType: initialMotifType } = request.data;
    let motifType = initialMotifType || "official";

    if (!empfaenger || !anlass || !stimmung) {
      throw new HttpsError("invalid-argument", "Missing fields: empfaenger, anlass, or stimmung");
    }

    logger.info(`Starting Genkit Greeting Card generation. Recipient: ${empfaenger}, Sender: ${absender || "None"}, Occasion: ${anlass}, MotifType: ${motifType}`);

    // 1. Fetch grounding context/reference phrases from search datastore
    const searchResults = await searchVertexAISearch(`${anlass} ${stimmung}`);
    const referenzSprueche = searchResults
      .map((r, idx) => `Spruch ${idx + 1}: ${r.snippet}`)
      .join("\n");

    logger.info(`Found ${searchResults.length} grounding/reference documents for the card.`);

    // 2. Build instructions prompt for the text dichten
    const prompt = `Du bist der offizielle, kreative Kopf hinter den sheepworld-Sprüchen (berühmt für "Ohne Dich ist alles doof" und viele andere süße, humorvolle Motive).
Deine Aufgabe ist es, eine neue, einzigartige Grußkarte zu verfassen. 

Nutze diese echten Sprüche aus unserem Datenspeicher als Inspiration für den typischen schaf-haften, herzlichen und leicht humorvollen Tonfall:
${referenzSprueche || "Keine spezifischen Sprüche gefunden. Nutze den typischen süßen, leicht frechen und emotionalen sheepworld-Humor."}

KARTEN-DETAILS:
- Empfänger: ${empfaenger}
- Absender (falls vorhanden, nutze dies für einen persönlichen Abschiedsgruß am Ende des Textes): ${absender || "Keine Angabe"}
- Anlass: ${anlass}
- Stimmung: ${stimmung}
- Insider-Detail (integriere dies charmant und natürlich, falls vorhanden): ${insider || "Keine"}

Erstelle eine strukturierte JSON-Antwort mit exakt folgenden Feldern:
- titelSpruch: Ein kurzer, knackiger Hauptspruch (maximal 10 Wörter) für die Vorderseite der Karte, der typisch sheepworld-artig, süß, herzerwärmend oder leicht frech ist.
- innentext: Ein persönlicher, herzlicher Text (3-4 Sätze) für die Innenseite der Karte. 
  STRIKTE REGEL FÜR DIE STRUKTUR:
  1. Starte den Text direkt mit einer passenden, warmen Begrüßung (z.B. "Liebste Mama,", "Hallo Papa,", "Mein lieber Schatz,"), die auf dem Empfänger basiert.
  2. Schreibe dann den herzlichen Hauptteil (3-4 Sätze, flechte eventuelle Insider charmant ein).
  3. Beende den Text am Ende zwingend mit einem persönlichen Abschiedsgruß (z.B. "In Liebe, dein/e [Absender]", "Dein [Absender]"), basierend auf dem angegebenen Absender. Wenn kein Absender angegeben ist, nutze eine passende neutrale Form (z.B. "In Liebe,", "Dein Schaf-Freund").`;

    // 3. Lazy-load Genkit dependencies
    const { z } = await import("genkit");
    const { vertexAI } = await import("@genkit-ai/google-genai");
    const ai = await getGenkit();

    // 4. Generate structured text content using Gemini 2.5 Flash
    const textResponse = await ai.generate({
      model: vertexAI.model("gemini-3.5-flash"),
      prompt: prompt,
      output: {
        schema: z.object({
          titelSpruch: z.string(),
          innentext: z.string()
        })
      }
    });

    const parsedOutput = textResponse.output;
    if (!parsedOutput) {
      logger.error("Failed to generate structured greeting card text from Gemini:", textResponse.text);
      throw new HttpsError("internal", "Failed to generate structured greeting card text");
    }

    // 5. Handlung für Motiv-Einbindung (Option A: AI-Bilderzeugung oder Option B: RAG-Shopbild)
    let motifUrl: string | null = null;
    let shopUrl: string | null = null;
    let shopTitle: string | null = null;

    if (motifType === "official") {
      logger.info(`Option B: Searching for official shop product image matching: ${anlass} ${stimmung}`);
      if (searchResults && searchResults.length > 0) {
        for (const res of searchResults) {
          if (res.uri) {
            const img = await extractOgImage(res.uri);
            if (img) {
              motifUrl = img;
              shopUrl = res.uri;
              shopTitle = res.title;
              logger.info(`Successfully found official shop product image: ${img} for "${res.title}"`);
              break;
            }
          }
        }
      }

      // Falls kein echtes Bild gefunden wurde, weichen wir automatisch auf KI-Bilderzeugung aus, um ein Motiv zu garantieren!
      if (!motifUrl) {
        logger.info("No official product image found in search. Falling back to AI image generation (Gemini 3 Pro Image).");
        motifType = "ai";
      }
    }

    if (motifType === "ai") {
      logger.info(`Option A: Generating custom KI illustration via Gemini 3 Pro Image with multimodal style references for: ${anlass} (${stimmung})`);
      
      const referenceParts = getReferenceMediaParts();
      
      const textPrompt = `Generate a brand-new custom illustration of this exact sheep character.
The composition is a wide horizontal landscape format (aspect ratio 3:2), perfectly suited for a classic German horizontal postcard.
CRITICAL BRAND COMPLIANCE RULES:
- Absolutely DO NOT depict any eyes on the sheep. The face must remain empty, smooth, and faceless. There should be no dots, pupils, lashes, or realistic eyes.
- The sheep's body and hair must feature a heavily textured, curly, woolly pattern ("gekräuseltes Haar") and a distinct curly contour outline ("gekräuselter Umriss").
- The sheep must have tiny stick legs and exact character proportions matching the provided reference images.
- The sheep must represent the theme: "${anlass}" in a "${stimmung}" mood.
- The design should feature exactly ONE striking, vivid red element (such as a small red heart, a tiny red rose, or a small red balloon) as seen in the style guide.
- Maintain the exact same colors (black and white outlines only), contours, and artistic hand-drawn style.
- The background must be flat, pure, solid white. There should be absolutely no borders, gradients, or background shadows.`;

      // Try gemini-3-pro-image first with multimodal reference style guide!
      try {
        const imageResponse = await ai.generate({
          model: vertexAI.model("gemini-3-pro-image"),
          prompt: [
            ...referenceParts,
            { text: textPrompt }
          ],
          output: { format: "media" },
          config: {
            location: "global"
          }
        });

        if (imageResponse.media?.url) {
          motifUrl = imageResponse.media.url;
          logger.info("Successfully generated AI image via Gemini 3 Pro Image (gemini-3-pro-image) using style references.");
        }
      } catch (imgError: any) {
        logger.warn("Error with gemini-3-pro-image style guide generation. Trying standard backup...", imgError.message);

        // Fallback to imagen-3.0-generate-001 (using plain text prompt as backup)
        try {
          const fallbackTextPrompt = `An authentic, high-quality hand-drawn fine-liner ink sketch of the famous "sheepworld" cartoon character. A cute, fluffy white sheep with a round heavily curly-wool body ("gekräuseltes Haar") and a distinct curly contour outline ("gekräuselter Umriss").
CRITICAL BRAND COMPLIANCE RULES:
- Absolutely DO NOT depict any eyes on the sheep. The face must remain empty, smooth, and faceless (no dots, pupils, or circles for eyes).
- The sheep must have tiny, thin stick-legs and exact cartoon proportions as in the official sheepworld style.
- The entire illustration is a wide horizontal landscape composition (aspect ratio 3:2) on a solid, pure white background.
- There are absolutely no colors, except for exactly ONE striking, vivid red element (such as a small red heart, a tiny red flower, or a small red balloon) representing the theme: "${anlass}" in a "${stimmung}" mood.`;
          const imageResponse = await ai.generate({
            model: vertexAI.model("imagen-3.0-generate-001"),
            prompt: fallbackTextPrompt,
            output: { format: "media" },
            config: {
              aspectRatio: "3:2"
            }
          });

          if (imageResponse.media?.url) {
            motifUrl = imageResponse.media.url;
            logger.info("Successfully generated AI image via Backup Imagen-3.0-generate-001.");
          }
        } catch (threeError: any) {
          logger.error("All image generation models failed.", threeError);
        }
      }
    }

    // 6. Finaler defensiver Premium-Fallback auf das offizielle, hochauflösende Sheepworld-Logo, falls alle Stricke reißen
    if (!motifUrl) {
      logger.info("Both search and AI generation failed. Using official Sheepworld Logo SVG as premium fallback.");
      motifUrl = "https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg";
    }

    // 7. Save card to Firestore and upload AI generated image to Firebase Storage if applicable
    let cardId: string | null = null;
    try {
      const admin = await getFirebaseAdmin();
      const db = admin.firestore();
      
      // Calculate Year, Month, Day for folder structure
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, "0");
      const day = String(now.getUTCDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Generate a short unique ID (8 characters)
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let shortId = "";
      for (let i = 0; i < 8; i++) {
        shortId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      cardId = shortId;

      // If the motifUrl is a base64 string (i.e. AI generated), upload it to Firebase Storage (Folder structure cards/YYYY/MM/DD/id.png)
      if (motifUrl && motifUrl.startsWith("data:image/")) {
        logger.info(`Uploading AI generated image for card ${cardId} to Firebase Storage path cards/${year}/${month}/${day}/${cardId}.png ...`);
        const bucket = admin.storage().bucket();
        
        const matches = motifUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          
          const file = bucket.file(`cards/${year}/${month}/${day}/${cardId}.png`);
          await file.save(buffer, {
            metadata: {
              contentType: contentType,
              cacheControl: "public, max-age=31536000"
            },
            public: true
          });
          
          motifUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          logger.info(`AI image uploaded successfully. Storage URL: ${motifUrl}`);
        } else {
          logger.warn("AI motif URL is starting with data:image/ but has invalid base64 format.");
        }
      }

      logger.info(`Saving card ${cardId} to Firestore...`);
      await db.collection("greeting_cards").doc(cardId).set({
        id: cardId,
        empfaenger: empfaenger,
        absender: absender || "",
        anlass: anlass,
        stimmung: stimmung,
        insider: insider || "",
        titelSpruch: parsedOutput.titelSpruch,
        innentext: parsedOutput.innentext,
        motifUrl: motifUrl,
        shopUrl: shopUrl || "",
        shopTitle: shopTitle || "",
        motifTypeUsed: motifType,
        year: year,
        month: Number(month),
        day: Number(day),
        dateStr: dateStr,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info(`Card ${cardId} successfully saved to Firestore.`);

      // 8. Track generation statistics seamlessly
      try {
        const sanitizeKey = (str: string) => str.replace(/[\.\*\[\]\/\\ ]/g, "_");
        const safeAnlass = sanitizeKey(anlass);
        const safeStimmung = sanitizeKey(stimmung);
        const safeMotifType = sanitizeKey(motifType);
        
        const statsRef = db.collection("statistics").doc("cards_summary");
        const monthlyStatsRef = db.collection("statistics").doc(`cards_monthly_${year}_${month}`);
        
        const increment = admin.firestore.FieldValue.increment(1);
        
        await statsRef.set({
          totalGenerated: increment,
          [`occasions.${safeAnlass}`]: increment,
          [`moods.${safeStimmung}`]: increment,
          [`motifTypes.${safeMotifType}`]: increment,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await monthlyStatsRef.set({
          totalGenerated: increment,
          [`days.${day}.total`]: increment,
          [`days.${day}.occasions.${safeAnlass}`]: increment,
          [`days.${day}.moods.${safeStimmung}`]: increment,
          [`days.${day}.motifTypes.${safeMotifType}`]: increment,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        logger.info(`Statistics successfully updated for card ${cardId}.`);
      } catch (statsError) {
        logger.error("Error updating card statistics:", statsError);
      }

    } catch (saveError: any) {
      logger.error("Error uploading image or saving card to Firestore/Storage:", saveError);
      // Fallback: we do not crash the function so the card can still be rendered locally, but cardId remains null
    }

    return {
      cardId: cardId,
      titelSpruch: parsedOutput.titelSpruch,
      innentext: parsedOutput.innentext,
      motifUrl: motifUrl,
      shopUrl: shopUrl,
      shopTitle: shopTitle,
      motifTypeUsed: motifType
    };

  } catch (error: any) {
    logger.error("Unhandled error in generateGreetingCard flow:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Internal Server Error: ${error.message}`);
  }
});

// 4. Export the Smart Gift Finder (Bundle Builder) as a Callable Cloud Function
export const generateGiftBundle = onCall({ region: "europe-west4", cors: true, timeoutSeconds: 300 }, async (request) => {
  try {
    await logModuleUsage("Geschenkbox-Berater", request);
    const { relationship, interests, occasion, budget } = request.data;

    if (!relationship || !interests || !occasion || !budget) {
      throw new HttpsError("invalid-argument", "Missing fields: relationship, interests, occasion, or budget");
    }

    logger.info(`Starting Genkit generateGiftBundle. Relationship: ${relationship}, Interests: ${interests}, Occasion: ${occasion}, Budget: ${budget}`);

    // 1. Fetch grounding context/products from search datastore using a multi-layered query approach to guarantee real results
    let searchResults = await searchVertexAISearch(interests);
    if (!searchResults || searchResults.length === 0) {
      searchResults = await searchVertexAISearch(occasion);
    }
    if (!searchResults || searchResults.length === 0) {
      // Fallback to top general categories
      searchResults = await searchVertexAISearch("Tasse Kissen");
    }

    const contextText = searchResults
      .map((r, idx) => `Produkt ${idx + 1}: Titel: ${r.title}\nURL: ${r.uri}\nTextauszug: ${r.snippet}`)
      .join("\n\n");

    // 2. Build instructions prompt for the Bundle Builder
    const prompt = `Du bist der smarte sheepworld-Geschenk-Concierge. Deine Aufgabe ist es, für einen Mann ein perfekt kuratiertes Geschenk-Bundle ("Geschenkbox") für seine ${relationship} zusammenzustellen.
Der Anlass ist "${occasion}", das Budget liegt bei maximal ${budget} Euro. Seine ${relationship} hat folgende Interessen: "${interests}".

STRIKTE REGELN FÜR DAS BUNDLE:
- Erstelle ein liebevolles, harmonisches Bundle aus genau 2 bis 3 passenden sheepworld-Artikeln.
- WÄHLE AUSSCHLIESSLICH Produkte aus der unten bereitgestellten Liste der HINTERGRUND-PRODUKTE aus! Es ist strengstens verboten, Produkte zu erfinden oder Produkte außerhalb dieser Liste zu verwenden! (Da wir immer einen Tassen/Kissen Fallback-Sucherfolg garantieren, gibt es in der Liste immer reale Produkte).
- Jedes ausgewählte Produkt MUSS exakt die in der Liste angegebene "URL" (aus "Produkt X: ... URL: [LINK]") übernehmen. Erfinde niemals eigene Produkt-URLs!
- Weise jedem Produkt seinen realistischen Preis zu (z. B. Tassen: 12.95€ - 14.95€, Kissen: 19.95€ - 24.95€, Socken: 9.95€, Bettwäsche: 39.95€).
- Die Summe aller Produktpreise (totalPrice) DARF NICHT das angegebene Budget von ${budget} Euro überschreiten! Halte dich so nah wie möglich am Budget, ohne es zu überschreiten.
- Schreibe einen herzerwärmenden, überzeugenden und typisch schaf-haften Text ("pitch"), warum diese Geschenkbox das absolute Highlight ist.
- Setze "imageUrl" für alle Produkte zunächst auf leer oder null, da das Backend dieses Feld vollautomatisch in Echtzeit durch Abrufen des echten Produktbildes von der Produkt-URL befüllt. Erfinde NIEMALS eigene Bildpfade!

HINTERGRUND-PRODUKTE (aus dem Datenspeicher):
${contextText}

Generiere eine strukturierte JSON-Antwort mit exakt folgenden Feldern:
- bundleName: Ein kreativer, charmanter Name für das Bundle (z. B. "Das kuschelige Faultier-Verwöhnpaket", maximal 50 Zeichen).
- pitch: Eine süße, schaf-hafte und vertriebsstarke Begründung für die Box (3-4 Sätze).
- totalPrice: Die mathematische Summe der einzelnen produktpreise (Zahl).
- products: Ein Array aus 2-3 Produkten mit folgenden Feldern:
  - groundingIndex: Der 1-basierte Index des ausgewählten Produkts aus der Liste der HINTERGRUND-PRODUKTE (z. B. 1 für Produkt 1, 2 für Produkt 2, etc.).
  - title: Name des sheepworld-Artikels (z. B. "Kuschelkissen 'Ohne Dich ist alles doof'").
  - price: Preis des Produkts als Zahl (z. B. 19.95).
  - url: Die exakte, reale Shop-URL aus den Hintergrund-Produkten (MUSS exakt dem Link aus der Liste entsprechen!).
  - imageUrl: Lasse dies leer oder null.
  - reason: Eine kurze, liebevolle Erklärung, warum dieses Teil perfekt zur Frau und ihren Interessen passt (1 Satz).
- cardSuggestion: Empfohlene Parameter für eine dazu passende Grußkarte:
  - recipient: "meine geliebte Frau" (oder passend adaptiert).
  - occasion: Der vorgeschlagene Anlass für die Karte.
  - mood: Die vorgeschlagene Stimmung (z. B. "Süß & Herzerwärmend").`;

    // 3. Lazy-load Genkit dependencies
    const { z } = await import("genkit");
    const { vertexAI } = await import("@genkit-ai/google-genai");
    const ai = await getGenkit();

    // 4. Generate structured bundle using Gemini 2.5 Flash
    const response = await ai.generate({
      model: vertexAI.model("gemini-3.5-flash"),
      prompt: prompt,
      output: {
        schema: z.object({
          bundleName: z.string(),
          pitch: z.string(),
          totalPrice: z.number(),
          products: z.array(z.object({
            groundingIndex: z.number(),
            title: z.string(),
            price: z.number(),
            url: z.string(),
            imageUrl: z.string().optional(),
            reason: z.string()
          })),
          cardSuggestion: z.object({
            recipient: z.string(),
            occasion: z.string(),
            mood: z.string()
          })
        })
      }
    });

    const parsedOutput = response.output;
    if (!parsedOutput) {
      throw new HttpsError("internal", "Failed to generate structured gift bundle");
    }

    const validUris = searchResults
      .map(r => r.uri)
      .filter(u => u && u.startsWith("http") && u !== "https://sheepworld.de" && u !== "https://www.sheepworld.de");

    // Attempt to enrich any missing product images and sanitize URLs in parallel
    await Promise.all(
      parsedOutput.products.map(async (prod: any) => {
        const idx = (prod.groundingIndex || 1) - 1;
        const matchedSearchDoc = searchResults[idx];

        if (matchedSearchDoc && matchedSearchDoc.uri) {
          // Enforce the 100% authentic original URL from the search result!
          prod.url = matchedSearchDoc.uri;
          prod.title = matchedSearchDoc.title;
        } else {
          // Fuzzy search fallback
          const foundByTitle = searchResults.find(r => r.title.toLowerCase().includes(prod.title.toLowerCase()) || prod.title.toLowerCase().includes(r.title.toLowerCase()));
          if (foundByTitle && foundByTitle.uri) {
            prod.url = foundByTitle.uri;
          } else if (!prod.url || prod.url.startsWith("http") === false || prod.url.includes("sheepworld.de") === false) {
            prod.url = `https://www.sheepworld.de/search?sSearch=${encodeURIComponent(prod.title)}`;
          }
        }

        const isRealUri = validUris.includes(prod.url) || (matchedSearchDoc && matchedSearchDoc.uri === prod.url);

        const isHallucinatedImage = prod.imageUrl && (prod.imageUrl.includes("/media/image/") || prod.imageUrl.includes("sheepworld.de/media"));
        if (!prod.imageUrl || prod.imageUrl.startsWith("http") === false || isHallucinatedImage) {
          if (isRealUri && prod.url && prod.url !== "https://sheepworld.de" && prod.url !== "https://www.sheepworld.de") {
            const img = await extractOgImage(prod.url);
            prod.imageUrl = img || "https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg";
          } else {
            // Fallback static illustration images
            prod.imageUrl = "https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg";
          }
        }
      })
    );

    return parsedOutput;

  } catch (error: any) {
    logger.error("Unhandled error in generateGiftBundle flow:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Internal Server Error: ${error.message}`);
  }
});

// 5. Export the Sprüche-Tuner / Reim-Automat as a Callable Cloud Function
export const tunePhrase = onCall({ region: "europe-west4", cors: true, timeoutSeconds: 120 }, async (request) => {
  try {
    await logModuleUsage("Sprüche-Tuner", request);
    const { text } = request.data;
    if (!text) {
      throw new HttpsError("invalid-argument", "Missing field: text");
    }

    logger.info(`Starting Genkit tunePhrase for: ${text}`);

    const prompt = `Du bist ein genialer Kreativtexter für sheepworld. Deine Aufgabe ist es, eine langweilige Alltagsnachricht in einen zuckersüßen, leicht frechen und emotionalen Reim (2-4 Zeilen) im typischen schaf-haften Onlineshop-Stil zu verwandeln.

Vorgabe-Nachricht: "${text}"

STRIKTE REGELN FÜR DEN REIM:
- Erstelle einen wunderschönen, kurzen Reim (2 bis maximal 4 Zeilen).
- Nutze das typische schaf-hafte Wording (z. B. "Ohne dich...", "Schaf-Land", "Kuschelzeit", "doof", "Lieblingsmensch").
- Halte es herzlich, herzerwärmend oder witzig-neckisch.

Generiere eine strukturierte JSON-Antwort mit exakt folgenden Feldern:
- tunedText: Der veredelte, gereimte Spruch (z. B. "Ohne dich ist der Urlaub wie Sand ohne Strand, komm ganz schnell zurück in mein Kuschel-Schaf-Land!").
- explanation: Eine kurze, liebevolle Erklärung, warum die KI diesen Reim gewählt hat (1 Satz).`;

    // Lazy-load Genkit dependencies
    const { z } = await import("genkit");
    const { vertexAI } = await import("@genkit-ai/google-genai");
    const ai = await getGenkit();

    const response = await ai.generate({
      model: vertexAI.model("gemini-3.5-flash"),
      prompt: prompt,
      output: {
        schema: z.object({
          tunedText: z.string(),
          explanation: z.string()
        })
      }
    });

    const parsedOutput = response.output;
    if (!parsedOutput) {
      throw new HttpsError("internal", "Failed to generate structured rhyme");
    }

    return parsedOutput;

  } catch (error: any) {
    logger.error("Unhandled error in tunePhrase flow:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Internal Server Error: ${error.message}`);
  }
});

// 6. Export the Avatar-Verwandlung as a Callable Cloud Function
export const generateAvatar = onCall({ region: "europe-west4", cors: true, timeoutSeconds: 300 }, async (request) => {
  try {
    await logModuleUsage("KI-Schaf-Verwandlung", request);
    const { image } = request.data;
    if (!image) {
      throw new HttpsError("invalid-argument", "Missing field: image");
    }

    logger.info("Starting Genkit generateAvatar multimodal feature extraction...");

    // Lazy-load Genkit dependencies
    const { z } = await import("genkit");
    const { vertexAI } = await import("@genkit-ai/google-genai");
    const ai = await getGenkit();

    // 1. Extract base64 image data for multimodal analyzer
    const base64Matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!base64Matches) {
      throw new HttpsError("invalid-argument", "Invalid image format. Must be base64 data URI.");
    }
    const contentType = base64Matches[1];
    const base64Data = base64Matches[2];

    // 2. Query Gemini 2.5 Flash with the image to analyze human features
    const analyzerPrompt = `Analyze this person's portrait image and extract exactly 2-4 key recognizable visual features to represent as a cartoon character.
Key features to check: hair style/color (e.g. curly blond hair, short brown hair), glasses (e.g. round glasses), beard, clothing color (e.g. blue sweater), or distinct expression (e.g. large happy smile).
Keep descriptions very concise and cartoon-friendly (1-3 words per feature).

Return a structured JSON with:
- features: An array of strings representing these key cartoon-friendly details (e.g., ["glasses", "curly brown hair", "blue sweater"]).`;

    const analyzeResponse = await ai.generate({
      model: vertexAI.model("gemini-3.5-flash"),
      prompt: [
        {
          media: {
            url: `data:${contentType};base64,${base64Data}`,
            contentType: contentType
          }
        },
        { text: analyzerPrompt }
      ],
      output: {
        schema: z.object({
          features: z.array(z.string())
        })
      }
    });

    const featuresList = analyzeResponse.output?.features || [];
    logger.info(`Successfully extracted features for avatar: ${featuresList.join(", ")}`);

    // 3. Generate the customized sheepworld character based on the extracted features
    const referenceParts = getReferenceMediaParts();
    
    // Inject features beautifully into the drawing prompt!
    const featuresDescription = featuresList.length > 0 
      ? `The sheep must be customized with these exact features: ${featuresList.join(", ")}.`
      : "The sheep has no special clothing.";

    const drawingPrompt = `Generate a brand-new custom illustration of this exact sheep character.
The composition is a wide horizontal landscape format (aspect ratio 3:2), suitable for a postcard or mug.
The sheep must represent a customized sheep version of a person.
${featuresDescription} (For example, if hair is specified, draw the sheep with that cartoon hairstyle, if glasses are specified, draw cute round outlines of glasses, if sweater color is specified, draw the sheep wearing that colored cartoon sweater).

CRITICAL BRAND COMPLIANCE RULES:
- Absolutely DO NOT depict any eyes on the sheep. The face must remain empty, smooth, and faceless. There should be no dots, pupils, lashes, or realistic eyes.
- The sheep's body and main hair must feature a heavily textured, curly, woolly pattern ("gekräuseltes Haar") and a distinct curly contour outline ("gekräuselter Umriss").
- The sheep must have tiny stick legs and exact character proportions matching the provided reference images.
- The design should feature exactly ONE striking, vivid red element (such as a small red heart, a tiny red rose, or a small red balloon) as seen in the style guide.
- Maintain the exact same colors, outlines, and artistic hand-drawn style.
- The background must be flat, pure, solid white. There should be absolutely no borders, gradients, or background shadows.`;

    let avatarUrl: string | null = null;

    // Use Gemini 3 Pro Image with reference guidelines!
    try {
      const imageResponse = await ai.generate({
        model: vertexAI.model("gemini-3-pro-image"),
        prompt: [
          ...referenceParts,
          { text: drawingPrompt }
        ],
        output: { format: "media" },
        config: {
          location: "global"
        }
      });

      if (imageResponse.media?.url) {
        avatarUrl = imageResponse.media.url;
        logger.info("Successfully generated AI Avatar portrait via Gemini 3 Pro Image.");
      }
    } catch (imgError: any) {
      logger.warn("Error with Gemini 3 Pro avatar drawing. Trying fallback Imagen model...", imgError.message);

      try {
        const fallbackPrompt = `An authentic, high-quality hand-drawn fine-liner ink sketch of the famous "sheepworld" cartoon character. A cute, fluffy white sheep with a round heavily curly-wool body ("gekräuseltes Haar") and a distinct curly contour outline ("gekräuselter Umriss").
The sheep cartoon character is customized with: ${featuresList.join(", ")}.
CRITICAL BRAND COMPLIANCE RULES:
- Absolutely DO NOT depict any eyes on the sheep. The face must remain empty, smooth, and faceless (no dots, pupils, or circles for eyes).
- The sheep must have tiny, thin stick-legs and exact cartoon proportions as in the official sheepworld style.
- The entire illustration is a wide horizontal landscape composition (aspect ratio 3:2) on a solid, pure white background.
- There are absolutely no colors, except for exactly ONE striking, vivid red element (such as a small red heart, a tiny red flower, or a small red balloon) representing the character.`;

        const imageResponse = await ai.generate({
          model: vertexAI.model("imagen-3.0-generate-001"),
          prompt: fallbackPrompt,
          output: { format: "media" },
          config: {
            aspectRatio: "3:2"
          }
        });

        if (imageResponse.media?.url) {
          avatarUrl = imageResponse.media.url;
          logger.info("Successfully generated AI Avatar portrait via Backup Imagen-3.0.");
        }
      } catch (threeError: any) {
        logger.error("All avatar drawing models failed.", threeError);
      }
    }

    if (!avatarUrl) {
      throw new HttpsError("internal", "Failed to generate AI avatar image");
    }

    // Save AI generated avatar to Firebase Storage & return public URL
    const admin = await getFirebaseAdmin();
    const bucket = admin.storage().bucket();
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const avatarId = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (avatarUrl.startsWith("data:image/")) {
      const matches = avatarUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const fileContentType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        
        const file = bucket.file(`avatars/${year}/${month}/${day}/${avatarId}.png`);
        await file.save(buffer, {
          metadata: {
            contentType: fileContentType,
            cacheControl: "public, max-age=31536000"
          },
          public: true
        });
        
        avatarUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        logger.info(`AI Avatar portrait uploaded successfully: ${avatarUrl}`);
      }
    }

    return {
      avatarUrl: avatarUrl,
      featuresExtracted: featuresList
    };

  } catch (error: any) {
    logger.error("Unhandled error in generateAvatar flow:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Internal Server Error: ${error.message}`);
  }
});

// 9. Export the Guided Gift Recommendations as a Callable Cloud Function
export const generateGiftRecommendations = onCall({ region: "europe-west4", cors: true, timeoutSeconds: 300 }, async (request) => {
  try {
    await logModuleUsage("KI-Geschenkefinder", request);
    const { relationship, interests, occasion, budget } = request.data;

    if (!relationship || !interests || !occasion || !budget) {
      throw new HttpsError("invalid-argument", "Missing fields: relationship, interests, occasion, or budget");
    }

    logger.info(`Starting generateGiftRecommendations. Relationship: ${relationship}, Interests: ${interests}, Occasion: ${occasion}, Budget: ${budget}`);

    // 1. Fetch grounding context/products from search datastore using a multi-layered query approach to guarantee real results
    let searchResults = await searchVertexAISearch(interests);
    if (!searchResults || searchResults.length === 0) {
      searchResults = await searchVertexAISearch(occasion);
    }
    if (!searchResults || searchResults.length === 0) {
      // Fallback to top general categories
      searchResults = await searchVertexAISearch("Tasse Kissen");
    }

    const contextText = searchResults
      .map((r, idx) => `Produkt ${idx + 1}: Titel: ${r.title}\nURL: ${r.uri}\nTextauszug: ${r.snippet}`)
      .join("\n\n");

    // 2. Build instructions prompt
    const prompt = `Du bist der smarte sheepworld-Geschenk-Spezialist. Deine Aufgabe ist es, für eine beschenkte Person ("${relationship}") zum Anlass "${occasion}" genau drei (3) alternative, völlig unabhängige Geschenkideen aus unserem Sortiment vorzuschlagen.
Das maximale Budget für eine einzelne Idee liegt bei ${budget} Euro (nicht das Gesamtbudget, sondern das Budget pro Einzelgeschenk).
Die beschenkte Person hat folgende Interessen: "${interests}".

STRIKTE REGELN FÜR DIE RECOMMENDATIONS:
- Schlage exakt drei (3) voneinander unabhängige Einzel-Geschenkideen vor. Keine Sets/Bundles, sondern 3 alternative Einzeloptionen!
- WÄHLE AUSSCHLIESSLICH Produkte aus der unten bereitgestellten Liste der HINTERGRUND-PRODUKTE aus! Es ist strengstens verboten, Produkte zu erfinden oder Produkte außerhalb dieser Liste zu verwenden! (Da wir immer einen Tassen/Kissen Fallback-Sucherfolg garantieren, gibt es in der Liste immer reale Produkte).
- Jedes ausgewählte Produkt MUSS exakt die in der Liste angegebene "URL" (aus "Produkt X: ... URL: [LINK]") übernehmen. Erfinde niemals eigene Produkt-URLs!
- Weise jedem Produkt einen realistischen Preis zu (Zahl, z. B. Tasse: 12.95, Kissen: 19.95, Socken: 9.95, Bettwäsche: 39.95).
- Jedes einzelne Produkt darf ${budget} Euro NICHT überschreiten!
- Schreibe für jede Geschenkidee eine extrem liebevolle, schaf-hafte Begründung ("reason"), warum genau dieses Einzelprodukt perfekt passt (1-2 Sätze).
- Setze "imageUrl" für alle Produkte zunächst auf leer oder null, da das Backend dieses Feld vollautomatisch in Echtzeit durch Abrufen des echten Produktbildes von der Produkt-URL befüllt. Erfinde NIEMALS eigene Bildpfade!

HINTERGRUND-PRODUKTE (aus dem Datenspeicher):
${contextText}

Generiere eine strukturierte JSON-Antwort mit exakt folgenden Feldern:
- recommendations: Ein Array aus genau 3 Produkten mit folgenden Feldern:
  - groundingIndex: Der 1-basierte Index des ausgewählten Produkts aus der Liste der HINTERGRUND-PRODUKTE (z. B. 1 für Produkt 1, 2 für Produkt 2, etc.).
  - title: Name des sheepworld-Artikels (z. B. "Premium Tasse 'Lieblingsmensch'").
  - price: Preis des Produkts als Zahl (z. B. 12.95).
  - url: Die exakte, reale Shop-URL aus den Hintergrund-Produkten (MUSS exakt dem Link aus der Liste entsprechen!).
  - imageUrl: Lasse dies leer oder null.
  - reason: Eine kurze, vertriebsstarke und herzerwärmende Begründung, warum genau dieses Produkt super passt (1-2 Sätze).`;

    // 3. Lazy-load Genkit dependencies
    const { z } = await import("genkit");
    const { vertexAI } = await import("@genkit-ai/google-genai");
    const ai = await getGenkit();

    // 4. Generate structured recommendations using Gemini 2.5 Flash
    const response = await ai.generate({
      model: vertexAI.model("gemini-3.5-flash"),
      prompt: prompt,
      output: {
        schema: z.object({
          recommendations: z.array(z.object({
            groundingIndex: z.number(),
            title: z.string(),
            price: z.number(),
            url: z.string(),
            imageUrl: z.string().optional(),
            reason: z.string()
          }))
        })
      }
    });

    const parsedOutput = response.output;
    if (!parsedOutput) {
      throw new HttpsError("internal", "Failed to generate structured gift recommendations");
    }

    const validUris = searchResults
      .map(r => r.uri)
      .filter(u => u && u.startsWith("http") && u !== "https://sheepworld.de" && u !== "https://www.sheepworld.de");

    // Attempt to enrich any missing product images and sanitize URLs in parallel
    await Promise.all(
      parsedOutput.recommendations.map(async (prod: any) => {
        const idx = (prod.groundingIndex || 1) - 1;
        const matchedSearchDoc = searchResults[idx];

        if (matchedSearchDoc && matchedSearchDoc.uri) {
          // Enforce the 100% authentic original URL from the search result!
          prod.url = matchedSearchDoc.uri;
          prod.title = matchedSearchDoc.title;
        } else {
          // Fuzzy search fallback
          const foundByTitle = searchResults.find(r => r.title.toLowerCase().includes(prod.title.toLowerCase()) || prod.title.toLowerCase().includes(r.title.toLowerCase()));
          if (foundByTitle && foundByTitle.uri) {
            prod.url = foundByTitle.uri;
          } else if (!prod.url || prod.url.startsWith("http") === false || prod.url.includes("sheepworld.de") === false) {
            prod.url = `https://www.sheepworld.de/search?sSearch=${encodeURIComponent(prod.title)}`;
          }
        }

        const isRealUri = validUris.includes(prod.url) || (matchedSearchDoc && matchedSearchDoc.uri === prod.url);

        const isHallucinatedImage = prod.imageUrl && (prod.imageUrl.includes("/media/image/") || prod.imageUrl.includes("sheepworld.de/media"));
        if (!prod.imageUrl || prod.imageUrl.startsWith("http") === false || isHallucinatedImage) {
          if (isRealUri && prod.url && prod.url !== "https://sheepworld.de" && prod.url !== "https://www.sheepworld.de") {
            const img = await extractOgImage(prod.url);
            prod.imageUrl = img || "https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg";
          } else {
            prod.imageUrl = "https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg";
          }
        }
      })
    );

    return parsedOutput;

  } catch (error: any) {
    logger.error("Unhandled error in generateGiftRecommendations flow:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Internal Server Error: ${error.message}`);
  }
});

// 10. Export the Blog-Artikel-Texter as a Callable Cloud Function
export const generateBlogArticle = onCall({ region: "europe-west4", cors: true, timeoutSeconds: 300 }, async (request) => {
  try {
    await logModuleUsage("BLOG-Artikel-Texter", request);
    const { topic, targetProducts, productUrls, keywords } = request.data;
    
    if (!topic) {
      throw new HttpsError("invalid-argument", "Missing field: topic");
    }

    logger.info(`Starting Genkit Blog Article generation for topic: ${topic}. Product URLs: ${JSON.stringify(productUrls)}, Keywords: ${keywords}`);

    // 1. Fetch grounding context from search datastore using topic + targetProducts to get real links
    const searchQuery = topic + (targetProducts ? ` ${targetProducts}` : "");
    let searchResults = await searchVertexAISearch(searchQuery);
    if (!searchResults || searchResults.length === 0) {
      searchResults = await searchVertexAISearch("Tasse Kissen Bettwäsche");
    }

    // 2. Fetch specific target product URL details if provided
    const scrapedProducts: any[] = [];
    if (productUrls && Array.isArray(productUrls) && productUrls.length > 0) {
      await Promise.all(
        productUrls.map(async (url: string) => {
          if (url && url.startsWith("http")) {
            const details = await fetchPageDetails(url);
            if (details) {
              scrapedProducts.push(details);
            }
          }
        })
      );
    }

    // Inject manual product URLs as valid grounding search results so they survive sanitizeMarkdownLinks
    for (const p of scrapedProducts) {
      const alreadyExists = searchResults.some(r => r.uri === p.url);
      if (!alreadyExists) {
        searchResults.push({
          title: p.title,
          uri: p.url,
          snippet: `Manuell hinzugefügtes Produkt für den Artikel.`
        });
      }
    }

    // Build the grounding context text representing general search results
    let contextText = searchResults
      .map((r, idx) => `[Produkt ${idx + 1}]: Titel: ${r.title}\nURL: ${r.uri}\nTextauszug: ${r.snippet}`)
      .join("\n\n");

    // Build the strict target product list text
    let targetProductPromptText = "";
    if (scrapedProducts.length > 0) {
      targetProductPromptText = `\nZWINGENDE PRODUKTVERLINKUNGEN:\nDu MUSST die folgenden konkreten Produkte zwingend prominent im Text erwähnen, beschreiben und exakt verlinken (nutze unbedingt ihre originalen Titel und exakten URLs!):\n` +
        scrapedProducts.map(p => `- Produkt: "${p.title}" | URL: ${p.url}`).join("\n");
    }

    logger.info(`Found ${searchResults.length} total grounding documents (including manual URLs).`);

    // 3. Build Blog Article instructions prompt
    const prompt = `Du bist ein leidenschaftlicher, kreativer Blog-Autor für den sheepworld.de-Onlineshop (bekannt für "Ohne Dich ist alles doof" und viele herzerwärmende Charaktere).
Schreibe einen super sympathischen, emotionalen und packenden Blog-Artikel über das Thema: "${topic}".

Der Blog-Artikel soll einen Umfang von ca. 1000 Zeichen bis 1500 Zeichen haben und im typisch schaf-haften, herzlichen Tonfall verfasst sein (Nutze das freundschaftliche "Du" für unsere Leser).

STRIKTE RICHTLINIEN FÜR DEN BLOG-ARTIKEL:
- Schreibe einen fesselnden H1-Titel (z. B. "Auszeit für die Seele: Wie Du es Dir an verregneten Sonntagen gemütlich machst").
- Strukturiere den Text lesefreundlich mit H2-Zwischenüberschriften, kurzen Absätzen und Aufzählungspunkten.
- Verknüpfe das Thema "${topic}" mit unseren echten Produkten aus den Hintergrundinformationen.
${targetProducts ? `- Versuche besonders die gewünschten Produkte/Begriffe "${targetProducts}" natürlich in die Geschichte einzuweben.` : ""}
${targetProductPromptText}
${keywords ? `- SEO-KEYWORDS: Integriere die folgenden Keywords flüssig und vollkommen natürlich mindestens 1-mal im Text: ${keywords}.` : ""}

WICHTIGE PRODUKTVERLINKUNGEN:
- Integriere insgesamt 2 bis 3 Produkte natürlich als Markdown-Links im Fließtext (z. B. '[unserer XL-Tasse Relax](URL)'). Falls oben konkrete ZWINGENDE Produkte angegeben sind, verwende diese bevorzugt!
- Nutze für die Links AUSSCHLIESSLICH die exakten URLs aus den Hintergrunddaten! Erfinde niemals eigene Pfade oder Links!
- Verwende stets sprechende Anchor-Texte, niemals Wörter wie "hier" oder "Link".

HINTERGRUNDINFORMATIONEN (Echte Produkte & URLs aus dem Datenspeicher):
${contextText}

Generiere eine strukturierte JSON-Antwort mit exakt folgenden Feldern:
- title: Ein charmanter, klickstarker H1-Titel für den Blog (maximal 80 Zeichen).
- content: Der vollständige, ausführlich ausformulierte Blog-Artikel im Markdown-Format (ca. 1000 bis 1500 Zeichen).`;

    // 4. Lazy-load Genkit dependencies
    const { z } = await import("genkit");
    const { vertexAI } = await import("@genkit-ai/google-genai");
    const ai = await getGenkit();

    // 5. Generate structured blog content using Gemini 2.5 Flash
    const response = await ai.generate({
      model: vertexAI.model("gemini-3.5-flash"),
      prompt: prompt,
      output: {
        schema: z.object({
          title: z.string(),
          content: z.string()
        })
      }
    });

    const parsedOutput = response.output;
    if (parsedOutput) {
      const sanitizedContent = sanitizeMarkdownLinks(parsedOutput.content || "", searchResults);
      return {
        title: parsedOutput.title || `${topic} - sheepworld Blog`,
        content: sanitizedContent,
        sources: searchResults.map(r => ({ title: r.title, uri: r.uri }))
      };
    } else {
      logger.error("Failed to generate structured blog content from Gemini:", response.text);
      const sanitizedContent = sanitizeMarkdownLinks(response.text || "", searchResults);
      return {
        title: `${topic} - sheepworld Blog`,
        content: sanitizedContent,
        sources: searchResults.map(r => ({ title: r.title, uri: r.uri }))
      };
    }
  } catch (error: any) {
    logger.error("Unhandled error in generateBlogArticle flow:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", `Internal Server Error: ${error.message}`);
  }
});

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

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
          location: "us-central1" // Vertex AI endpoint region (standard)
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

// Helper to search the Vertex AI Search Enterprise Engine (returns raw snippets)
async function searchVertexAISearch(query: string): Promise<SearchResult[]> {
  try {
    const auth = await getGoogleAuth();
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    const url = `https://eu-discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}/locations/eu/collections/default_collection/engines/sheepworld-enterprise_1787738222029/servingConfigs/default_search:search`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-goog-user-project": PROJECT_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        pageSize: 4 // Fetch top 4 documents for grounding
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Discovery Engine returned status ${response.status}: ${errorText}`);
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
export const generateSEOContent = onCall({ region: "europe-west4", cors: true }, async (request) => {
  try {
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
      model: vertexAI.model("gemini-2.5-flash"),
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
      return {
        title: parsedOutput.title || `${topic} - sheepworld`,
        metaDescription: parsedOutput.metaDescription || `Entdecke tolle Geschenke zum Thema ${topic} bei sheepworld!`,
        content: parsedOutput.content || "",
        sources: searchResults.map(r => ({ title: r.title, uri: r.uri }))
      };
    } else {
      logger.error("Failed to generate structured content from Gemini:", response.text);
      return {
        title: `${topic} - sheepworld`,
        metaDescription: `Entdecke tolle Geschenke zum Thema ${topic} bei sheepworld!`,
        content: response.text || "",
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

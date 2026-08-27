import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleAuth } from "google-auth-library";

// Configure constants based on sheepworld GCP setup
const PROJECT_ID = "sheep-vertex-ai";
const LOCATION = "us";
const APP_ID = "4f81f7dc-1ac2-49e5-8316-4fc755c057f7";
const APP_VERSION = "projects/sheep-vertex-ai/locations/us/apps/4f81f7dc-1ac2-49e5-8316-4fc755c057f7/versions/333686b5-09c7-4090-9148-15bbcd6ef2b8";
const DEPLOYMENT = "projects/sheep-vertex-ai/locations/us/apps/4f81f7dc-1ac2-49e5-8316-4fc755c057f7/deployments/7ed542cb-8a37-4a4f-8bc3-95831144346c";

// Google Auth library instance to get Bearer tokens
const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"]
});

// Helper to fetch a product page and extract its main Open Graph image URL
async function extractOgImage(url: string): Promise<string | null> {
  try {
    if (!url || !url.startsWith("http")) return null;
    
    logger.info(`Extracting og:image from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(3000) // 3 seconds timeout to prevent hanging the function
    });
    
    if (!response.ok) {
      logger.warn(`Failed to fetch product page ${url}: Status ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Match <meta property="og:image" content="URL"> or similar
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

// Helper to traverse and augment response payload structures with real image URLs
// AND filter out any products that return a 404 (broken/offline pages)
async function augmentPayloadWithRealImages(data: any) {
  if (!data || typeof data !== "object") return;

  // Search inside 'outputs' array if present
  if (Array.isArray(data.outputs)) {
    for (const output of data.outputs) {
      // Look for any payload nested in the output
      let payload = output.structData || output.payload || null;
      
      // Fallback: search for custom nested objects containing 'type' and 'productDetails' / 'imageUris'
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
        // Option 1: base_product_detail / product_details
        if (payload.type === "base_product_detail" || payload.uri) {
          if (payload.uri) {
            const realImg = await extractOgImage(payload.uri);
            if (realImg) {
              payload.imageUris = [realImg];
              logger.info(`Injected real og:image for ${payload.title || "product"}: ${realImg}`);
            } else {
              // If the single product detail is broken (404), remove the payload entirely from the output
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
        
        // Option 2: product_detail_carousel / product_carousel
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

          // Overwrite the carousel with only active, online products
          payload.productDetails = validProducts;

          // If the carousel is now completely empty, hide the payload entirely from the output
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

export const runSession = onCall({ region: "europe-west4", cors: true }, async (request) => {
  try {
    const { message, sessionId } = request.data;
    if (!message) {
      throw new HttpsError("invalid-argument", "Missing field: message");
    }

    // Default to the user's provided session ID if none is supplied
    const activeSessionId = sessionId || "Oxgdzj7gjhlufn4";

    logger.info(`Processing message for session ${activeSessionId}`);

    // Generate credentials
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

    // Forward the request to Google CES API
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
    
    // Automatically extract and inject real product images via Open Graph before returning to client
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

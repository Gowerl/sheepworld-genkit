import { genkit, z } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { onCallGenkit } from 'firebase-functions/https';

const projectId = process.env.GCLOUD_PROJECT || 'sheep-vertex-ai';

// 1. Initialize Genkit with the Vertex AI Plugin
const ai = genkit({
  plugins: [
    vertexAI({
      projectId: projectId,
      location: 'us-central1', // Vertex AI plugin location
    }),
  ],
});

// Helper to resolve the datastore ID
const getDatastoreId = (inputDatastoreId?: string) => {
  return (
    inputDatastoreId ||
    process.env.VERTEX_AI_DATASTORE_ID ||
    'datastorage-sheepworld-de_1787649919596'
  );
};

// 2. Define the Search Flow
// This flow uses Vertex AI Search Grounding to find information and returns both the summary and the source metadata
const searchFlow = ai.defineFlow(
  {
    name: 'searchFlow',
    inputSchema: z.object({
      query: z.string(),
      dataStoreId: z.string().optional(),
      location: z.string().optional(),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const dataStoreId = getDatastoreId(input.dataStoreId);
    const datastoreLocation = input.location || 'global'; // Datastores are typically in 'global' region

    // Call Gemini 1.5 Flash grounded with the Vertex AI Search Datastore
    const response = await ai.generate({
      model: 'vertexai/gemini-1.5-flash',
      prompt: input.query,
      config: {
        vertexRetrieval: {
          datastore: {
            projectId: projectId,
            location: datastoreLocation,
            dataStoreId: dataStoreId,
          },
          disableAttribution: false,
        },
      },
    });

    // Access the grounding metadata containing citations, snippets, and URIs
    const candidate = (response as any).candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata || {};

    // Extract search results from grounding chunks
    const results = (groundingMetadata.groundingChunks || []).map((chunk: any) => ({
      title: chunk.web?.title || 'Web Result',
      uri: chunk.web?.uri || '',
      snippet: chunk.sourceText || '',
    }));

    return {
      summary: response.text,
      results: results,
    };
  }
);

// 3. Define the Chat Flow (RAG)
// This flow maintains a conversational history and grounds responses using Vertex AI Search
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      query: z.string(),
      history: z
        .array(
          z.object({
            role: z.enum(['user', 'model', 'system']),
            content: z.array(
              z.object({
                text: z.string(),
              })
            ),
          })
        )
        .optional(),
      dataStoreId: z.string().optional(),
      location: z.string().optional(),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const dataStoreId = getDatastoreId(input.dataStoreId);
    const datastoreLocation = input.location || 'global';

    const history = input.history || [];

    // Call Gemini with the conversational history and the new user message, grounded with Vertex AI Search
    const response = await ai.generate({
      model: 'vertexai/gemini-1.5-flash',
      messages: [
        ...history,
        { role: 'user', content: [{ text: input.query }] },
      ],
      config: {
        vertexRetrieval: {
          datastore: {
            projectId: projectId,
            location: datastoreLocation,
            dataStoreId: dataStoreId,
          },
          disableAttribution: false,
        },
      },
    });

    const candidate = (response as any).candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata || {};

    const citations = (groundingMetadata.groundingChunks || []).map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || '',
    }));

    return {
      text: response.text,
      citations: citations,
    };
  }
);

// 4. Export as Firebase Cloud Functions (Callable via Firebase SDK)
export const search = onCallGenkit(
  {
    enforceAppCheck: false, // Set to true in production once App Check is configured
  },
  searchFlow
);

export const chat = onCallGenkit(
  {
    enforceAppCheck: false, // Set to true in production once App Check is configured
  },
  chatFlow
);

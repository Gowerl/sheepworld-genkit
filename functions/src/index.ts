import { genkit, z } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { onCallGenkit } from 'firebase-functions/https';
import { GoogleAuth } from 'google-auth-library';

const projectId = process.env.GCLOUD_PROJECT || 'sheep-vertex-ai';

// 1. Initialize Genkit with the Vertex AI Plugin
const ai = genkit({
  plugins: [
    vertexAI({
      projectId: projectId,
      location: 'europe-west4', // Vertex AI plugin location (Eemshaven)
    }),
  ],
});

// Interface for search results internally
interface SearchResult {
  title: string;
  uri: string;
  snippet: string;
}

// Helper to search the Vertex AI Search Enterprise Engine
async function searchVertexAISearch(query: string): Promise<SearchResult[]> {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    const url = `https://eu-discoveryengine.googleapis.com/v1/projects/${projectId}/locations/eu/collections/default_collection/engines/sheepworld-enterprise_1787738222029/servingConfigs/default_search:search`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        pageSize: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vertex AI Search API returned status ${response.status}: ${errorText}`);
      return [];
    }

    const data = await response.json() as any;
    const results = (data.results || []).map((res: any) => {
      const doc = res.document || {};
      const structData = doc.derivedStructData || {};
      
      // Extract clean snippets
      let snippet = '';
      if (structData.snippets && structData.snippets.length > 0) {
        snippet = structData.snippets[0].snippet || '';
      } else {
        snippet = structData.htmlTitle || structData.title || '';
      }

      return {
        title: structData.title || 'Web Result',
        uri: structData.link || '',
        snippet: snippet || '',
      };
    });
    return results;
  } catch (error) {
    console.error('Error querying Vertex AI Search:', error);
    return [];
  }
}

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
    // 1. Retrieve context from Vertex AI Search
    const results = await searchVertexAISearch(input.query);

    // 2. Build the grounded prompt for Gemini
    let promptText = input.query;
    if (results.length > 0) {
      const contextText = results
        .map((r, idx) => `[Source ${idx + 1}]: Title: ${r.title}\nURL: ${r.uri}\nSnippet: ${r.snippet}`)
        .join('\n\n');
      
      promptText = `You are a helpful assistant for Sheepworld. Answer the user's query using the provided context from our website sheepworld.de. If the context does not contain the answer, you can use your general knowledge but clearly state that the information was not found on the official website. Always cite the Source numbers (e.g. [Source 1]) when you use information from them.\n\nContext:\n${contextText}\n\nUser Query: ${input.query}`;
    }

    // 3. Call Gemini 2.5 Flash to generate the response
    const response = await ai.generate({
      model: 'vertexai/gemini-2.5-flash',
      prompt: promptText,
    });

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
    const history = input.history || [];

    // 1. Retrieve context from Vertex AI Search
    const results = await searchVertexAISearch(input.query);

    // 2. Build grounded instructions for Gemini
    let systemInstruction = "You are a helpful assistant for Sheepworld. Answer the user's queries.";
    if (results.length > 0) {
      const contextText = results
        .map((r, idx) => `[Source ${idx + 1}]: Title: ${r.title}\nURL: ${r.uri}\nSnippet: ${r.snippet}`)
        .join('\n\n');
      
      systemInstruction = `You are a helpful assistant for Sheepworld. Answer the user's query using the provided context from our website sheepworld.de. If the context does not contain the answer, you can use your general knowledge but clearly state that the information was not found on the official website. Always cite the Source numbers (e.g. [Source 1]) when you use information from them.\n\nContext:\n${contextText}`;
    }

    // 3. Call Gemini with conversational history
    const response = await ai.generate({
      model: 'vertexai/gemini-2.5-flash',
      messages: [
        { role: 'system', content: [{ text: systemInstruction }] },
        ...history,
        { role: 'user', content: [{ text: input.query }] },
      ],
    });

    const citations = results.map((r) => ({
      title: r.title,
      uri: r.uri,
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
    region: 'europe-west4',
    enforceAppCheck: false, // Set to true in production once App Check is configured
  },
  searchFlow
);

export const chat = onCallGenkit(
  {
    region: 'europe-west4',
    enforceAppCheck: false, // Set to true in production once App Check is configured
  },
  chatFlow
);

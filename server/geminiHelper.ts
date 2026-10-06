import { GoogleGenAI } from '@google/genai';

// Models in priority order, falling back to lighter/alternative models if quota exhausted
const MODELS_IN_PRIORITY = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

/**
 * Returns a configured GoogleGenAI instance with the standard User-Agent header.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Safely calls Gemini API trying fallback models if 429 quota exhaustion occurs.
 * If all quotas are exhausted, cleanly returns null so deterministic domain agents
 * can generate the architecture seamlessly without crashing or cluttering logs.
 */
export async function callGeminiSafe(
  ai: GoogleGenAI,
  contents: string
): Promise<string | null> {
  for (const model of MODELS_IN_PRIORITY) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isQuota =
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota') ||
        msg.includes('Quota exceeded');

      if (isQuota) {
        // Silently try next fallback model in list
        continue;
      }

      // If other transient error, try next model
      continue;
    }
  }

  // Quota completely exhausted for all models or offline
  return null;
}


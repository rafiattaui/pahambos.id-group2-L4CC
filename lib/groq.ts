import { createGroq } from '@ai-sdk/groq';

// Type-safe global augmentation
declare global {
  var __groqInstance: ReturnType<typeof createGroq> | undefined;
}

// Singleton pattern with proper global caching (avoids hot-reload re-initialization)
const groq =
  globalThis.__groqInstance ??
  createGroq({
    apiKey: process.env.GROQ_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__groqInstance = groq;
}

// Pre-configured model ready to use
const model = groq('llama-3.1-8b-instant');

export { groq, model };

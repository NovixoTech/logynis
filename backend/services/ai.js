import { NovixoAI } from "novixo-ai";

const ai = new NovixoAI({
  keys: {
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  },
  providers: ["gemini", "groq"],
  models: {
    groq: "llama-3.3-70b-versatile",
    gemini: "gemini-2.0-flash",
  },
  maxTokens: 2048,
  temperature: 0.7,
  cache: true,
  cacheTTL: 3 * 60 * 1000,
});

export default ai;

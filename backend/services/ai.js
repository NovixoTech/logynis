import crypto from "crypto";

const cacheStore = new Map();
const CACHE_TTL = 3 * 60 * 1000;

function getCacheKey(messages, systemPrompt) {
  const raw = JSON.stringify({ messages, systemPrompt });
  return crypto.createHash("md5").update(raw).digest("hex");
}

function getFromCache(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  cacheStore.set(key, { value, time: Date.now() });
}

async function callCerebras(messages, systemPrompt) {
  const body = {
    model: "gpt-oss-120b",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 2048,
    temperature: 0.7,
  };

  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`cerebras failed: ${data.error?.message || res.statusText}`);

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("cerebras failed: empty response");

  return text;
}

async function callGroq(messages, systemPrompt) {
  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    max_tokens: 2048,
    temperature: 0.7,
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`groq failed: ${data.error?.message || res.statusText}`);

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("groq failed: empty response");

  return text;
}

async function callGemini(messages, systemPrompt) {
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`gemini failed: ${data.error?.message || res.statusText}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("gemini failed: empty response");

  return text;
}

async function chat(messages, { systemPrompt, providers = ["cerebras", "groq", "gemini"] }) {
  const cacheKey = getCacheKey(messages, systemPrompt);
  const cached = getFromCache(cacheKey);
  if (cached) return { text: cached.text, provider: cached.provider, cached: true };

  const errors = [];

  for (const provider of providers) {
    try {
      let text;
      if (provider === "cerebras") {
        text = await callCerebras(messages, systemPrompt);
      } else if (provider === "groq") {
        text = await callGroq(messages, systemPrompt);
      } else if (provider === "gemini") {
        text = await callGemini(messages, systemPrompt);
      } else {
        continue;
      }
      setCache(cacheKey, { text, provider });
      return { text, provider, cached: false, errors };
    } catch (err) {
      console.error(`[AI_PROVIDER_ERROR] ${provider}:`, err.message);
      errors.push({ provider, message: err.message });
    }
  }

  throw new Error(`All providers failed: ${errors.map(e => `${e.provider}: ${e.message}`).join(" | ")}`);
}

const ai = { chat };
export default ai;

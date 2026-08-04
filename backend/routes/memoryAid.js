import { Router } from "express";
import ai from "../services/ai.js";
import { buildMemoryAidPrompt } from "../services/memoryAidPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /api/memory-aid
// NOTE: path is root "/" (not "/generate") to match what MemoryAid.jsx
// actually calls: authFetch("/api/memory-aid", { method: "POST", ... })
router.post("/", authMiddleware, requireActiveSubscription, async (req, res, next) => {
  try {
    const { topic, format } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildMemoryAidPrompt(user, topic, format);

    const response = await ai.chat(
      [{ role: "user", content: `Create a memory aid for: ${topic}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({
      text: response.text,
      provider: response.provider,
      topic,
      format: format || "auto",
    });
  } catch (err) {
    console.error("[memory-aid-error]", err.message);
    next(err);
  }
});

export default router;

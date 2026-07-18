// Draft route for Common Mistakes Digest
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildCommonMistakesPrompt } from "./commonMistakesPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/common-mistakes
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { topic } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildCommonMistakesPrompt(user, topic);

    const response = await ai.chat(
      [{ role: "user", content: `What are common mistakes on: ${topic}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let mistakes;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      mistakes = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[common-mistakes-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate valid results, please try again" });
    }

    res.json({ mistakes, provider: response.provider, topic });
  } catch (err) {
    console.error("[common-mistakes-error]", err.message);
    next(err);
  }
});

export default router;

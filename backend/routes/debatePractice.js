// Draft route for Debate/Argument Practice
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildDebatePracticePrompt } from "../services/debatePracticePrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/debate-practice
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { topic, studentPosition, messages } = req.body;

    if (!topic || !studentPosition) {
      return res.status(400).json({ error: "topic and studentPosition are required" });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const conversationHistory = messages.slice(0, -1);
    const systemPrompt = buildDebatePracticePrompt(user, topic, studentPosition, conversationHistory);

    const response = await ai.chat(messages, {
      systemPrompt,
      providers: ["cerebras", "groq", "gemini"],
    });

    res.json({
      text: response.text,
      provider: response.provider,
    });
  } catch (err) {
    console.error("[debate-practice-error]", err.message);
    next(err);
  }
});

export default router;

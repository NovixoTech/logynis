// Draft route for Rapid-Fire Recall Quiz
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildRapidRecallPrompt } from "./rapidRecallPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/rapid-recall
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { topic, questionCount } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildRapidRecallPrompt(user, topic, questionCount || 15);

    const response = await ai.chat(
      [{ role: "user", content: `Generate a rapid recall quiz for: ${topic}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let questions;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[rapid-recall-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate valid quiz questions, please try again" });
    }

    res.json({ questions, provider: response.provider, topic });
  } catch (err) {
    console.error("[rapid-recall-error]", err.message);
    next(err);
  }
});

export default router;

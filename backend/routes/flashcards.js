import { Router } from "express";
import ai from "../services/ai.js";
import { buildFlashcardsPrompt } from "../services/flashcardsPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /flashcards
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { topic, count } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildFlashcardsPrompt(user, topic, count || 8);

    const response = await ai.chat(
      [{ role: "user", content: `Generate flashcards for: ${topic}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let cards;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      cards = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[flashcards-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate valid flashcards, please try again" });
    }

    res.json({ cards, provider: response.provider, topic });
  } catch (err) {
    console.error("[flashcards-error]", err.message);
    next(err);
  }
});
export default router;

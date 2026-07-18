// Draft route for Homework Difficulty Rating
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildDifficultyRatingPrompt } from "./difficultyRatingPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/difficulty-rating
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { homeworkQuestion, conversationId } = req.body;

    if (!homeworkQuestion || !homeworkQuestion.trim()) {
      return res.status(400).json({ error: "homeworkQuestion is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildDifficultyRatingPrompt(user, homeworkQuestion);

    const response = await ai.chat(
      [{ role: "user", content: "Rate this question's difficulty." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let rating;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      rating = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[difficulty-rating-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate a valid rating, please try again" });
    }

    // Optionally attach rating to the conversation record if one exists, for later reference
    if (conversationId) {
      await supabase
        .from("conversations")
        .update({ difficultyrating: rating.difficultyRating })
        .eq("id", conversationId)
        .eq("userid", req.user.id);
    }

    res.json({ rating });
  } catch (err) {
    console.error("[difficulty-rating-error]", err.message);
    next(err);
  }
});

export default router;

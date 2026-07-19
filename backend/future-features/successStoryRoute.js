// Draft route for Success Story Sharing
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildSuccessStoryPrompt } from "./successStoryPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/success-story
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { currentStruggle } = req.body;

    if (!currentStruggle || !currentStruggle.trim()) {
      return res.status(400).json({ error: "currentStruggle is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildSuccessStoryPrompt(user, currentStruggle);

    const response = await ai.chat(
      [{ role: "user", content: "Can you share a story that might help?" }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({ text: response.text, provider: response.provider });
  } catch (err) {
    console.error("[success-story-error]", err.message);
    next(err);
  }
});

export default router;

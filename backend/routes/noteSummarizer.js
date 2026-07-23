// Draft route for Note Summarizer
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildNoteSummarizerPrompt } from "./noteSummarizerPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/note-summarizer
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { rawNotes } = req.body;

    if (!rawNotes || !rawNotes.trim()) {
      return res.status(400).json({ error: "rawNotes is required" });
    }

    if (rawNotes.length > 8000) {
      return res.status(400).json({ error: "Notes are too long, please shorten and try again" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildNoteSummarizerPrompt(user, rawNotes);

    const response = await ai.chat(
      [{ role: "user", content: "Please clean up and organize my notes." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({
      text: response.text,
      provider: response.provider,
    });
  } catch (err) {
    console.error("[note-summarizer-error]", err.message);
    next(err);
  }
});

export default router;

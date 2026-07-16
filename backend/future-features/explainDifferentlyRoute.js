// Draft route for "Explain This Differently"
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildExplainDifferentlyPrompt } from "./explainDifferentlyPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/explain-differently
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { originalQuestion, originalAnswer, attemptNumber } = req.body;

    if (!originalQuestion || !originalAnswer) {
      return res.status(400).json({ error: "originalQuestion and originalAnswer are required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildExplainDifferentlyPrompt(user, originalQuestion, originalAnswer, attemptNumber || 1);

    const response = await ai.chat(
      [{ role: "user", content: "Please explain this differently." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({
      text: response.text,
      provider: response.provider,
    });
  } catch (err) {
    console.error("[explain-differently-error]", err.message);
    next(err);
  }
});

export default router;

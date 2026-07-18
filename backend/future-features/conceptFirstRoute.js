// Draft route for "Show Me the Concept First"
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildConceptFirstPrompt } from "./conceptFirstPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/concept-first
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { homeworkQuestion } = req.body;

    if (!homeworkQuestion || !homeworkQuestion.trim()) {
      return res.status(400).json({ error: "homeworkQuestion is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildConceptFirstPrompt(user, homeworkQuestion);

    const response = await ai.chat(
      [{ role: "user", content: "Please explain the concept I need before we solve this." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({ text: response.text, provider: response.provider });
  } catch (err) {
    console.error("[concept-first-error]", err.message);
    next(err);
  }
});

export default router;

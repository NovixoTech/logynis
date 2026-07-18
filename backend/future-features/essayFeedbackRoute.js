// Draft route for Essay/Answer Feedback Tool
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildEssayFeedbackPrompt } from "./essayFeedbackPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/essay-feedback
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { subject, studentAnswer, questionContext } = req.body;

    if (!subject || !studentAnswer || !studentAnswer.trim()) {
      return res.status(400).json({ error: "subject and studentAnswer are required" });
    }

    if (studentAnswer.length > 6000) {
      return res.status(400).json({ error: "Answer is too long, please shorten and try again" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildEssayFeedbackPrompt(user, subject, studentAnswer, questionContext);

    const response = await ai.chat(
      [{ role: "user", content: "Please give me feedback on my answer." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let feedback;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      feedback = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[essay-feedback-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate valid feedback, please try again" });
    }

    res.json({ feedback, provider: response.provider });
  } catch (err) {
    console.error("[essay-feedback-error]", err.message);
    next(err);
  }
});

export default router;

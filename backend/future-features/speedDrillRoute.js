// Draft route for Speed Drill Mode
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildSpeedDrillPrompt } from "./speedDrillPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/speed-drill
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { subject, questionCount } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "subject is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildSpeedDrillPrompt(user, subject, questionCount || 15);

    const response = await ai.chat(
      [{ role: "user", content: `Generate a speed drill for: ${subject}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let questions;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[speed-drill-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate valid drill questions, please try again" });
    }

    res.json({ questions, provider: response.provider, subject });
  } catch (err) {
    console.error("[speed-drill-error]", err.message);
    next(err);
  }
});

export default router;

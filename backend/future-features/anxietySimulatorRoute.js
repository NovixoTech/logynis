// Draft route for Exam Anxiety Simulator
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildAnxietySimulatorPrompt } from "./anxietySimulatorPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/anxiety-simulator/generate
router.post("/generate", authMiddleware, async (req, res, next) => {
  try {
    const { subject, questionCount, durationMinutes } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "subject is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildAnxietySimulatorPrompt(user, subject, questionCount || 10);

    const response = await ai.chat(
      [{ role: "user", content: `Generate exam simulation questions for: ${subject}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let questions;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[anxiety-sim-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate valid questions, please try again" });
    }

    const sessionId = `sim_${req.user.id}_${Date.now()}`;

    // Store answers server-side temporarily (in-memory cache would work too, but Supabase keeps it simple and consistent with rest of app)
    const { error: sessionErr } = await supabase.from("mock_exam_sessions").insert({
      userid: req.user.id,
      subject: `[ANXIETY SIM] ${subject}`,
      questions,
      durationminutes: durationMinutes || 15,
      status: "in_progress",
    });

    if (sessionErr) throw sessionErr;

    const questionsForStudent = questions.map(({ correctAnswer, ...rest }) => rest);

    res.json({
      sessionId,
      questions: questionsForStudent,
      durationMinutes: durationMinutes || 15,
      noBacktrackAllowed: true,
    });
  } catch (err) {
    console.error("[anxiety-sim-generate-error]", err.message);
    next(err);
  }
});

export default router;

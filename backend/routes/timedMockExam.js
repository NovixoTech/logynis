import { Router } from "express";
import ai from "../services/ai.js";
import { buildTimedMockExamPrompt } from "../services/timedMockExamPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import supabase from "../services/supabase.js";
import { getRecentQuestions, logQuestions } from "../services/examHistory.js";

const router = Router();

// POST /api/timed-mock-exam/generate
router.post("/generate", authMiddleware, requireActiveSubscription, async (req, res, next) => {
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

    const recentQuestions = await getRecentQuestions(req.user.id, subject);

    const systemPrompt = buildTimedMockExamPrompt(user, subject, questionCount || 10, recentQuestions);

    const response = await ai.chat(
      [{ role: "user", content: `Generate a timed mock exam for: ${subject}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let questions;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[mock-exam-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate valid exam questions, please try again" });
    }
    
    const { data: session, error: sessionErr } = await supabase
      .from("mock_exam_sessions")
      .insert({
        userid: req.user.id,
        subject,
        questions,
        durationminutes: durationMinutes || 20,
        status: "in_progress",
      })
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    await logQuestions(req.user.id, subject, questions);

    const questionsForStudent = questions.map(({ correctAnswer, ...rest }) => rest);

    res.json({
      sessionId: session.id,
      questions: questionsForStudent,
      durationMinutes: durationMinutes || 20,
    });
  } catch (err) {
    console.error("[timed-mock-exam-generate-error]", err.message);
    next(err);
  }
});

// POST /api/timed-mock-exam/submit
router.post("/submit", authMiddleware, async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({ error: "sessionId and answers are required" });
    }

    const { data: session, error: sessionErr } = await supabase
      .from("mock_exam_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("userid", req.user.id)
      .single();

    if (sessionErr || !session) return res.status(404).json({ error: "Session not found" });

    let correctCount = 0;
    const results = session.questions.map((q, i) => {
      const studentAnswer = answers[i];
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        studentAnswer: studentAnswer || null,
        isCorrect,
      };
    });

    const score = Math.round((correctCount / session.questions.length) * 100);

    await supabase
      .from("mock_exam_sessions")
      .update({ status: "completed", score, results })
      .eq("id", sessionId);

    res.json({ score, correctCount, total: session.questions.length, results });
  } catch (err) {
    console.error("[timed-mock-exam-submit-error]", err.message);
    next(err);
  }
});


export default router;

import { Router } from "express";
import ai from "../services/ai.js";
import { buildTimedMockExamPrompt } from "../services/timedMockExamPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";
import { recordTopicAttempt } from "../routes/weakTopic.js"; // ← CHANGE 1: new import (fix path/filename to match yours)

const router = Router();

// ... your /generate route stays exactly as it was, no changes there ...

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

    // ← CHANGE 2: new block, tags each question's topic and updates topic_performance
    await Promise.allSettled(
      results.map(r => recordTopicAttempt(req.user.id, session.subject, r.question, r.isCorrect))
    );

    res.json({ score, correctCount, total: session.questions.length, results });
  } catch (err) {
    console.error("[timed-mock-exam-submit-error]", err.message);
    next(err);
  }
});

export default router;

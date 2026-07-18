// Draft route for Subject Readiness Score
// NOT registered in index.js yet - standalone for future integration
// This feature reads from the same topic_performance table used by Weak Topic Tracker

import { Router } from "express";
import ai from "../services/ai.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

const MIN_ATTEMPTS_FOR_SCORE = 5; // don't score a subject until there's enough data to be meaningful

// GET /future/readiness-score?subject=Biology
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { subject } = req.query;

    if (!subject) {
      return res.status(400).json({ error: "subject is required" });
    }

    const { data: topics, error } = await supabase
      .from("topic_performance")
      .select("*")
      .eq("userid", req.user.id)
      .eq("subject", subject);

    if (error) throw error;

    if (!topics || topics.length === 0) {
      return res.json({
        hasEnoughData: false,
        message: `No practice data yet for ${subject}. Complete some practice questions or mock exams to get your readiness score.`,
      });
    }

    const totalQuestions = topics.reduce((sum, t) => sum + t.totalcount, 0);

    if (totalQuestions < MIN_ATTEMPTS_FOR_SCORE) {
      return res.json({
        hasEnoughData: false,
        message: `Not enough practice yet for a reliable readiness score (${totalQuestions}/${MIN_ATTEMPTS_FOR_SCORE} questions attempted). Keep practicing!`,
      });
    }

    const totalCorrect = topics.reduce((sum, t) => sum + t.correctcount, 0);
    const overallAccuracy = Math.round((totalCorrect / totalQuestions) * 100);

    // Weight recent performance slightly more than old performance for a fairer "current" readiness picture
    const now = Date.now();
    const weightedScores = topics.map(t => {
      const daysSinceLastPractice = (now - new Date(t.lastpracticedat).getTime()) / (1000 * 60 * 60 * 24);
      const recencyWeight = daysSinceLastPractice < 7 ? 1.2 : daysSinceLastPractice < 30 ? 1.0 : 0.8;
      const topicAccuracy = (t.correctcount / t.totalcount) * 100;
      return { topic: t.topic, accuracy: Math.round(topicAccuracy), weight: recencyWeight };
    });

    const readinessScore = Math.round(
      weightedScores.reduce((sum, t) => sum + t.accuracy * t.weight, 0) /
      weightedScores.reduce((sum, t) => sum + t.weight, 0)
    );

    let readinessLabel;
    if (readinessScore >= 80) readinessLabel = "Well Prepared";
    else if (readinessScore >= 60) readinessLabel = "Good Progress";
    else if (readinessScore >= 40) readinessLabel = "Needs More Practice";
    else readinessLabel = "Early Stage";

    res.json({
      hasEnoughData: true,
      subject,
      readinessScore,
      readinessLabel,
      overallAccuracy,
      totalQuestionsAttempted: totalQuestions,
      topicBreakdown: weightedScores,
    });
  } catch (err) {
    console.error("[readiness-score-error]", err.message);
    next(err);
  }
});

// POST /future/readiness-score/insight
// Optional AI-generated encouraging note about the score, separate from the raw calculation above
router.post("/insight", authMiddleware, async (req, res, next) => {
  try {
    const { subject, readinessScore, readinessLabel, topicBreakdown } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const weakest = [...topicBreakdown].sort((a, b) => a.accuracy - b.accuracy).slice(0, 2);

    const systemPrompt = `You are Logynis, giving a brief, honest, encouraging note about a student's exam readiness.

Subject: ${subject}
Readiness Score: ${readinessScore}% (${readinessLabel})
Weakest areas: ${weakest.map(t => `${t.topic} (${t.accuracy}%)`).join(", ")}

Give a short (3-4 sentence), honest, encouraging note about where they stand and one concrete next step. Do not sugarcoat a low score, but frame it constructively.`;

    const response = await ai.chat(
      [{ role: "user", content: "How am I doing?" }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({ text: response.text });
  } catch (err) {
    console.error("[readiness-insight-error]", err.message);
    next(err);
  }
});

export default router;

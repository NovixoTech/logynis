import { Router } from "express";
import ai from "../services/ai.js";
import { buildDailyChallengePrompt } from "../services/dailyChallengePrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import supabase from "../services/supabase.js";

const router = Router();

function todayDateString() {
  return new Date().toISOString().split("T")[0];
}

// GET /api/daily-challenge
router.get("/", authMiddleware, requireActiveSubscription, async (req, res, next) => {
  try {
    const today = todayDateString();

    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("userid", req.user.id)
      .eq("challengedate", today)
      .maybeSingle();

    if (existing) {
      const alreadyAnswered = !!existing.answeredat;
      return res.json({
        challenge: {
          question: existing.question,
          subject: existing.subject,
          options: existing.options,
          ...(alreadyAnswered ? { correctAnswer: existing.correctanswer, userAnswer: existing.useranswer, isCorrect: existing.iscorrect } : {}),
        },
        answered: alreadyAnswered,
      });
    }
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildDailyChallengePrompt(user);

    const response = await ai.chat(
      [{ role: "user", content: "Generate today's challenge question." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let challengeData;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      challengeData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[daily-challenge-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate today's challenge, please try again" });
    }

    const { data: saved, error: saveErr } = await supabase
      .from("daily_challenges")
      .insert({
        userid: req.user.id,
        challengedate: today,
        subject: challengeData.subject,
        question: challengeData.question,
        correctanswer: challengeData.correctAnswer,
      })
      .select()
      .single();

    if (saveErr) throw saveErr;

    res.json({
      challenge: {
        question: challengeData.question,
        subject: challengeData.subject,
        options: challengeData.options,
      },
      answered: false,
      _funFact: challengeData.funFact, // sent now so frontend can show it after they answer, without a second request
    });
  } catch (err) {
    console.error("[daily-challenge-get-error]", err.message);
    next(err);
  }
});

// POST /api/daily-challenge/answer
router.post("/answer", authMiddleware, async (req, res, next) => {
  try {
    const { answer } = req.body;
    const today = todayDateString();

    if (!answer) {
      return res.status(400).json({ error: "answer is required" });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("daily_challenges")
      .select("*")
      .eq("userid", req.user.id)
      .eq("challengedate", today)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: "No challenge found for today" });

    if (existing.answeredat) {
      return res.status(400).json({ error: "Already answered today's challenge" });
    }

    const isCorrect = answer === existing.correctanswer;

    const { data: updated, error: updateErr } = await supabase
      .from("daily_challenges")
      .update({ useranswer: answer, iscorrect: isCorrect, answeredat: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ isCorrect, correctAnswer: existing.correctanswer });
  } catch (err) {
    console.error("[daily-challenge-answer-error]", err.message);
    next(err);
  }
});

export default router;

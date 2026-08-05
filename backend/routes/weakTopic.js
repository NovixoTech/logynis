import { Router } from "express";
import ai from "../services/ai.js";
import { buildTopicTaggingPrompt, buildWeakTopicRecommendationPrompt } from "../services/weakTopicPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import supabase from "../services/supabase.js";

const router = Router();

const WEAK_THRESHOLD = 60;
const MIN_ATTEMPTS = 3;

export async function recordTopicAttempt(userId, subject, question, wasCorrect) {
  try {
    const taggingPrompt = buildTopicTaggingPrompt(subject, question);
    const tagResponse = await ai.chat(
      [{ role: "user", content: question }],
      { systemPrompt: taggingPrompt, providers: ["cerebras", "groq", "gemini"] }
    );
    const topic = tagResponse.text.trim();

    const { data: existing } = await supabase
      .from("topic_performance")
      .select("*")
      .eq("userid", userId)
      .eq("subject", subject)
      .eq("topic", topic)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("topic_performance")
        .update({
          correctcount: existing.correctcount + (wasCorrect ? 1 : 0),
          totalcount: existing.totalcount + 1,
          lastpracticedat: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("topic_performance").insert({
        userid: userId,
        subject,
        topic,
        correctcount: wasCorrect ? 1 : 0,
        totalcount: 1,
      });
    }
  } catch (err) {
    console.error("[record-topic-attempt-error]", err.message);
  }
}

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { data: topics, error } = await supabase
      .from("topic_performance")
      .select("*")
      .eq("userid", req.user.id)
      .gte("totalcount", MIN_ATTEMPTS)
      .order("lastpracticedat", { ascending: false });

    if (error) throw error;

    const withAccuracy = (topics || []).map(t => ({
      ...t,
      accuracy: Math.round((t.correctcount / t.totalcount) * 100),
    }));

    const weakTopics = withAccuracy.filter(t => t.accuracy < WEAK_THRESHOLD);
    const strongTopics = withAccuracy.filter(t => t.accuracy >= WEAK_THRESHOLD);

    res.json({ weakTopics, strongTopics });
  } catch (err) {
    console.error("[weak-topics-list-error]", err.message);
    next(err);
  }
});

router.post("/recommendations", authMiddleware, requireActiveSubscription, async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const { data: topics, error } = await supabase
      .from("topic_performance")
      .select("*")
      .eq("userid", req.user.id)
      .gte("totalcount", MIN_ATTEMPTS);

    if (error) throw error;

    const withAccuracy = (topics || []).map(t => ({
      ...t,
      accuracy: Math.round((t.correctcount / t.totalcount) * 100),
    }));

    const weakTopics = withAccuracy.filter(t => t.accuracy < WEAK_THRESHOLD);

    if (weakTopics.length === 0) {
      return res.json({ text: "No weak topics found yet - keep practicing to build up your performance data, or great job if you're consistently scoring well!" });
    }

    const systemPrompt = buildWeakTopicRecommendationPrompt(user, weakTopics);
    const response = await ai.chat(
      [{ role: "user", content: "What should I focus on?" }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({ text: response.text, weakTopics });
  } catch (err) {
    console.error("[weak-topics-recommendations-error]", err.message);
    next(err);
  }
});

export default router;

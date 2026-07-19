// Draft route for Mood Check-In Tracker
// NOT registered in index.js yet - standalone for future integration
// CRITICAL SAFETY NOTE: this feature must never attempt to diagnose or label
// a student's mental state. It only reflects patterns gently and, when a
// concerning pattern appears, encourages talking to a trusted real person.

import { Router } from "express";
import ai from "../services/ai.js";
import { buildMoodPatternPrompt } from "./moodCheckinPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

const VALID_MOODS = ["great", "good", "okay", "stressed", "overwhelmed", "sad", "tired"];

// POST /future/mood-checkin
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { mood, note } = req.body;

    if (!mood || !VALID_MOODS.includes(mood)) {
      return res.status(400).json({ error: `mood must be one of: ${VALID_MOODS.join(", ")}` });
    }

    const { data, error } = await supabase
      .from("mood_checkins")
      .insert({ userid: req.user.id, mood, note: note || null })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ checkin: data });
  } catch (err) {
    console.error("[mood-checkin-error]", err.message);
    next(err);
  }
});

// GET /future/mood-checkin/history?days=14
router.get("/history", authMiddleware, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from("mood_checkins")
      .select("*")
      .eq("userid", req.user.id)
      .gte("createdat", since.toISOString())
      .order("createdat", { ascending: false });

    if (error) throw error;

    res.json({ checkins: data || [] });
  } catch (err) {
    console.error("[mood-checkin-history-error]", err.message);
    next(err);
  }
});

// GET /future/mood-checkin/insight
// Only generates a gentle pattern note if there's enough recent data to be meaningful
router.get("/insight", authMiddleware, async (req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 14);

    const { data: recentMoods, error } = await supabase
      .from("mood_checkins")
      .select("*")
      .eq("userid", req.user.id)
      .gte("createdat", since.toISOString())
      .order("createdat", { ascending: false });

    if (error) throw error;

    if (!recentMoods || recentMoods.length < 3) {
      return res.json({ hasEnoughData: false, message: "Check in a few more times to see gentle patterns here." });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildMoodPatternPrompt(user, recentMoods);

    const response = await ai.chat(
      [{ role: "user", content: "What do you notice?" }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({ hasEnoughData: true, text: response.text });
  } catch (err) {
    console.error("[mood-checkin-insight-error]", err.message);
    next(err);
  }
});

export default router;

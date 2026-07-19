// Draft route for Auto-Generated Revision Timetable
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildRevisionTimetablePrompt } from "./revisionTimetablePrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/revision-timetable/generate
router.post("/generate", authMiddleware, async (req, res, next) => {
  try {
    const { subjects, daysPerWeek, hoursPerSession } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "subjects array is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildRevisionTimetablePrompt(
      user,
      subjects,
      daysPerWeek || 6,
      hoursPerSession || 1
    );

    const response = await ai.chat(
      [{ role: "user", content: "Create my revision timetable." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let timetable;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      timetable = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[revision-timetable-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate a valid timetable, please try again" });
    }

    const { data: saved, error: saveErr } = await supabase
      .from("revision_timetables")
      .insert({
        userid: req.user.id,
        subjects,
        timetabledata: timetable,
      })
      .select()
      .single();

    if (saveErr) throw saveErr;

    res.json({ timetable, timetableId: saved.id });
  } catch (err) {
    console.error("[revision-timetable-error]", err.message);
    next(err);
  }
});

// GET /future/revision-timetable/latest
router.get("/latest", authMiddleware, async (req, res, next) => {
  try {
    const { data: timetable, error } = await supabase
      .from("revision_timetables")
      .select("*")
      .eq("userid", req.user.id)
      .order("createdat", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!timetable) return res.json({ hasTimetable: false });

    res.json({ hasTimetable: true, timetable: timetable.timetabledata });
  } catch (err) {
    console.error("[revision-timetable-latest-error]", err.message);
    next(err);
  }
});

export default router;

// Draft route for Real Past Questions Database
// NOT registered in index.js yet - standalone for future integration
// IMPORTANT: This route only WORKS once real questions exist in the past_questions table.
// It does not generate questions - it retrieves real ones that must be manually added first.

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// GET /future/past-questions?examBoard=WAEC&subject=Biology&year=2023
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { examBoard, subject, year, limit } = req.query;

    if (!examBoard || !subject) {
      return res.status(400).json({ error: "examBoard and subject are required" });
    }

    let query = supabase
      .from("past_questions")
      .select("*")
      .eq("examboard", examBoard)
      .eq("subject", subject)
      .eq("verifiedaccurate", true);

    if (year) query = query.eq("year", parseInt(year));

    query = query.limit(limit ? parseInt(limit) : 20);

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({
        questions: [],
        message: `No verified past questions available yet for ${examBoard} ${subject}${year ? ` (${year})` : ""}. This section grows as real questions are added.`,
      });
    }

    // Strip correct answers if this is meant as a practice attempt, not a review
    const questionsOnly = data.map(({ correctanswer, explanation, ...rest }) => rest);

    res.json({ questions: questionsOnly, totalAvailable: data.length });
  } catch (err) {
    console.error("[past-questions-fetch-error]", err.message);
    next(err);
  }
});

// GET /future/past-questions/subjects-available
// Helper route so the frontend can show only exam boards/subjects that actually have real data
router.get("/subjects-available", authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("past_questions")
      .select("examboard, subject, year")
      .eq("verifiedaccurate", true);

    if (error) throw error;

    // Deduplicate into a clean list of what's actually available
    const available = {};
    (data || []).forEach(row => {
      if (!available[row.examboard]) available[row.examboard] = {};
      if (!available[row.examboard][row.subject]) available[row.examboard][row.subject] = new Set();
      available[row.examboard][row.subject].add(row.year);
    });

    const formatted = Object.entries(available).map(([board, subjects]) => ({
      examBoard: board,
      subjects: Object.entries(subjects).map(([subj, years]) => ({
        subject: subj,
        years: Array.from(years).sort(),
      })),
    }));

    res.json({ available: formatted });
  } catch (err) {
    console.error("[past-questions-available-error]", err.message);
    next(err);
  }
});

export default router;

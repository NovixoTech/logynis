// Draft route for Spaced Repetition Reminders
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import { calculateNextReview } from "./spacedRepetitionLogic.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/spaced-repetition/add
// Called when a student finishes learning/revising a topic for the first time, to start tracking it
router.post("/add", authMiddleware, async (req, res, next) => {
  try {
    const { topic, subject } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic is required" });
    }

    const nextReviewAt = calculateNextReview(0);

    const { data, error } = await supabase
      .from("spaced_repetition_items")
      .insert({
        userid: req.user.id,
        topic,
        subject: subject || null,
        nextreviewat: nextReviewAt,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ item: data });
  } catch (err) {
    console.error("[spaced-repetition-add-error]", err.message);
    next(err);
  }
});

// GET /future/spaced-repetition/due
// Returns topics that are due for review right now
router.get("/due", authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("spaced_repetition_items")
      .select("*")
      .eq("userid", req.user.id)
      .eq("status", "active")
      .lte("nextreviewat", new Date().toISOString())
      .order("nextreviewat", { ascending: true });

    if (error) throw error;

    res.json({ dueItems: data || [] });
  } catch (err) {
    console.error("[spaced-repetition-due-error]", err.message);
    next(err);
  }
});

// GET /future/spaced-repetition/upcoming
// Returns topics coming up soon (not due yet), for a preview view
router.get("/upcoming", authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("spaced_repetition_items")
      .select("*")
      .eq("userid", req.user.id)
      .eq("status", "active")
      .gt("nextreviewat", new Date().toISOString())
      .order("nextreviewat", { ascending: true })
      .limit(10);

    if (error) throw error;

    res.json({ upcomingItems: data || [] });
  } catch (err) {
    console.error("[spaced-repetition-upcoming-error]", err.message);
    next(err);
  }
});

// POST /future/spaced-repetition/:id/complete
// Called when a student completes a review, schedules the next one automatically
router.post("/:id/complete", authMiddleware, async (req, res, next) => {
  try {
    const { data: item, error: fetchErr } = await supabase
      .from("spaced_repetition_items")
      .select("*")
      .eq("id", req.params.id)
      .eq("userid", req.user.id)
      .single();

    if (fetchErr || !item) return res.status(404).json({ error: "Item not found" });

    const newReviewCount = item.reviewcount + 1;
    const nextReviewAt = calculateNextReview(newReviewCount);

    const { data: updated, error: updateErr } = await supabase
      .from("spaced_repetition_items")
      .update({
        reviewcount: newReviewCount,
        lastreviewedat: new Date().toISOString(),
        nextreviewat: nextReviewAt,
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ item: updated });
  } catch (err) {
    console.error("[spaced-repetition-complete-error]", err.message);
    next(err);
  }
});

// DELETE /future/spaced-repetition/:id
// Stop tracking a topic (mastered it, or no longer relevant)
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("spaced_repetition_items")
      .update({ status: "archived" })
      .eq("id", req.params.id)
      .eq("userid", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("[spaced-repetition-delete-error]", err.message);
    next(err);
  }
});

export default router;

import { Router } from "express";
import supabase from "../services/supabase.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// GET /user/profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT /user/update
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { name, country, educationLevel, subLevel, examType, subjects, courseField, courseName, currentClass } = req.body;

    const updatePayload = {
      name,
      country,
      educationlevel: educationLevel,
      sublevel: subLevel,
      examtype: examType,
      subjects,
      coursefield: courseField,
      coursename: courseName,
    };

    if (currentClass !== undefined) {
      updatePayload.currentclass = currentClass;
      updatePayload.classupdatedat = new Date().toISOString();
    }

    const { data: user, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error("[user-update]", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// DELETE /user/delete-account
// Permanently deletes the user and all associated data.
// Tables with ON DELETE CASCADE (conversations, mock_exam_sessions, topic_performance,
// study_plans, revision_timetables, spaced_repetition_items, reflections, mood_checkins,
// glossary_terms, daily_challenges) are cleaned up automatically by Postgres once the
// users row is deleted. Everything below is deleted manually first because those tables
// have NO ACTION and would block the final delete otherwise.
router.delete("/delete-account", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const nonCascadeTables = [
      "notifications",
      "chats",
      "study_sessions",
      "exam_timetable",
      "study_feed",
      "feed_likes",
      "goals",
      "study_planner",
    ];

    for (const table of nonCascadeTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("userid", userId);

      if (error) {
        console.error(`[delete-account] failed clearing ${table}:`, error.message);
        throw new Error(`Failed while clearing ${table}`);
      }
    }

    const { error: userDeleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (userDeleteError) throw userDeleteError;

    res.json({ success: true });
  } catch (err) {
    console.error("[delete-account-error]", err.message);
    res.status(500).json({ error: "Failed to delete account. Please try again or contact support." });
  }
});

export default router;

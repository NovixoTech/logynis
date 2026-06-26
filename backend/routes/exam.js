import { Router } from "express";
import supabase from "../services/supabase.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// POST /exam/add
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { subject, examDate, examTime, notes } = req.body;

    if (!subject || !examDate) {
      return res.status(400).json({ error: "Subject and exam date are required" });
    }

    const { data, error } = await supabase
      .from("exam_timetable")
      .insert({ userId: req.user.id, subject, examDate, examTime, notes })
      .select()
      .single();

    if (error) throw error;

    // Award +10 points
    const { data: user } = await supabase
      .from("users")
      .select("points")
      .eq("id", req.user.id)
      .single();

    await supabase
      .from("users")
      .update({ points: (user?.points || 0) + 10 })
      .eq("id", req.user.id);

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to add exam" });
  }
});

// GET /exam/list
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("exam_timetable")
      .select("*")
      .eq("userId", req.user.id)
      .order("examDate", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch exams" });
  }
});

// DELETE /exam/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from("exam_timetable")
      .delete()
      .eq("id", req.params.id)
      .eq("userId", req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete exam" });
  }
});

export default router;

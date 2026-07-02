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
    const { name, country, educationLevel, subLevel, examType, subjects, courseField, courseName, goal, currentClass } = req.body;

    const updatePayload = {
      name,
      country,
      educationlevel: educationLevel,
      sublevel: subLevel,
      examtype: examType,
      subjects,
      coursefield: courseField,
      coursename: courseName,
      goal,
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

export default router;

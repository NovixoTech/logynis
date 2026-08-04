// Draft route for Parent/Guardian Dashboard - linking flow
// NOT registered in index.js yet - standalone for future integration
// PRIVACY NOTE: parents only ever see activity metadata (streaks, time spent, subjects covered)
// NEVER actual chat content or messages - that stays private to the student

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";
import crypto from "crypto";

const router = Router();

function generateLinkCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

// POST /future/parent-link/generate
// Student generates a code to share with their parent
router.post("/generate", authMiddleware, async (req, res, next) => {
  try {
    const { parentEmail, parentName } = req.body;

    if (!parentEmail) {
      return res.status(400).json({ error: "parentEmail is required" });
    }

    const linkCode = generateLinkCode();

    const { data, error } = await supabase
      .from("parent_links")
      .insert({
        studentid: req.user.id,
        parentemail: parentEmail,
        parentname: parentName || null,
        linkcode: linkCode,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ linkCode: data.linkcode });
  } catch (err) {
    console.error("[parent-link-generate-error]", err.message);
    next(err);
  }
});

// GET /future/parent-link/status
// Student checks if their parent has confirmed the link yet
router.get("/status", authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("parent_links")
      .select("*")
      .eq("studentid", req.user.id)
      .order("createdat", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.json({ link: data || null });
  } catch (err) {
    console.error("[parent-link-status-error]", err.message);
    next(err);
  }
});

export default router;

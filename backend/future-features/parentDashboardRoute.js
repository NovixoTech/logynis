// Draft route for Parent/Guardian Dashboard - the actual dashboard view
// NOT registered in index.js yet - standalone for future integration
// This uses a SEPARATE auth check since parents log in differently than students

import { Router } from "express";
import supabase from "../services/supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

function parentAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "parent") return res.status(403).json({ error: "Invalid token type" });
    req.parentId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// POST /future/parent-dashboard/redeem-code
// Parent enters the code the student shared to link accounts
router.post("/redeem-code", parentAuthMiddleware, async (req, res, next) => {
  try {
    const { linkCode } = req.body;

    if (!linkCode) return res.status(400).json({ error: "linkCode is required" });

    const { data: link, error } = await supabase
      .from("parent_links")
      .select("*")
      .eq("linkcode", linkCode.toUpperCase())
      .eq("status", "pending")
      .maybeSingle();

    if (error || !link) return res.status(404).json({ error: "Invalid or already-used code" });

    await supabase
      .from("parent_links")
      .update({ status: "confirmed", confirmedat: new Date().toISOString() })
      .eq("id", link.id);

    res.json({ success: true, studentId: link.studentid });
  } catch (err) {
    console.error("[parent-redeem-error]", err.message);
    next(err);
  }
});

// GET /future/parent-dashboard/:studentId/summary
// Returns ONLY activity metadata - never actual chat content
router.get("/:studentId/summary", parentAuthMiddleware, async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Verify this parent is actually linked to this student before showing anything
    const { data: link } = await supabase
      .from("parent_links")
      .select("*")
      .eq("studentid", studentId)
      .eq("status", "confirmed")
      .maybeSingle();

    if (!link) return res.status(403).json({ error: "Not authorized to view this student" });

    const { data: student } = await supabase
      .from("users")
      .select("name, streak, points, educationlevel, currentclass")
      .eq("id", studentId)
      .single();

    // Count sessions per mode in the last 30 days - metadata only, no content
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: conversations } = await supabase
      .from("conversations")
      .select("mode, createdat")
      .eq("userid", studentId)
      .gte("createdat", since.toISOString());

    const modeBreakdown = {};
    (conversations || []).forEach(c => {
      modeBreakdown[c.mode] = (modeBreakdown[c.mode] || 0) + 1;
    });

    res.json({
      studentName: student?.name,
      streak: student?.streak || 0,
      points: student?.points || 0,
      educationLevel: student?.educationlevel,
      currentClass: student?.currentclass,
      last30DaysSessions: (conversations || []).length,
      modeBreakdown,
    });
  } catch (err) {
    console.error("[parent-dashboard-summary-error]", err.message);
    next(err);
  }
});

export default router;

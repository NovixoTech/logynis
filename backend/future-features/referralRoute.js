// Draft route for Referral Rewards Program
// NOT registered in index.js yet - standalone for future integration
// NOTE: This mostly READS data your live auth.js already writes (referralcode, points, invitecount)
// No new AI logic needed - this is a surfacing/display feature

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// GET /future/referral/summary
router.get("/summary", authMiddleware, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("referralcode, points, invitecount, name")
      .eq("id", req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: "User not found" });

    // Find who used this user's referral code, for a small "who you invited" list
    const { data: referredUsers } = await supabase
      .from("users")
      .select("name, createdat")
      .eq("referredby", user.referralcode);

    res.json({
      referralCode: user.referralcode,
      points: user.points || 0,
      inviteCount: user.invitecount || 0,
      referredUsers: (referredUsers || []).map(u => ({ name: u.name, joinedAt: u.createdat })),
      pointsPerReferral: 10, // matches the existing hardcoded value in auth.js signup logic
    });
  } catch (err) {
    console.error("[referral-summary-error]", err.message);
    next(err);
  }
});

export default router;

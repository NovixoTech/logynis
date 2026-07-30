// Route for Referral Rewards Program
// NOTE: This mostly READS data your live auth.js already writes (referralcode, points, invitecount)

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// GET /api/referral/summary
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

    const pointsPerReferral = 10; // matches the existing hardcoded value in auth.js signup logic

    res.json({
      referralCode: user.referralcode,
      points: user.points || 0,
      referralPointsEarned: (user.invitecount || 0) * pointsPerReferral,
      inviteCount: user.invitecount || 0,
      referredUsers: (referredUsers || []).map(u => ({ name: u.name, joinedAt: u.createdat })),
      pointsPerReferral,
    });
  } catch (err) {
    console.error("[referral-summary-error]", err.message);
    next(err);
  }
});

export default router;

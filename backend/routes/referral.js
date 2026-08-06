// Route for Referral Rewards Program
// NOTE: Reads data auth.js writes at signup (referralcode, points, invitecount)
// plus referraldaysearned / referralrewarded, which chat.js's streak logic
// writes once a referred friend hits a 3-day streak.

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// GET /api/referral/summary
router.get("/summary", authMiddleware, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("referralcode, points, invitecount, referraldaysearned, name")
      .eq("id", req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: "User not found" });

    // Find who used this user's referral code, for a "who you invited" list.
    // referralrewarded tells us whether that friend has already triggered
    // the reward (hit a 3-day streak) or is still building toward it.
    const { data: referredUsers } = await supabase
      .from("users")
      .select("name, created_at, referralrewarded")
      .eq("referredby", user.referralcode);

    res.json({
      referralCode: user.referralcode,
      inviteCount: user.invitecount || 0,
      daysEarned: user.referraldaysearned || 0,
      // Kept for backward compatibility / curiosity, but no longer the
      // headline reward - the real one is daysEarned above.
      points: user.points || 0,
      referredUsers: (referredUsers || []).map(u => ({
        name: u.name,
        joinedAt: u.created_at,
        rewarded: !!u.referralrewarded,
      })),
    });
  } catch (err) {
    console.error("[referral-summary-error]", err.message);
    next(err);
  }
});

export default router;

// Draft route for Cross-Subject Connections
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildCrossSubjectPrompt } from "../services/crossSubjectPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/cross-subject
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { subjectA, subjectB } = req.body;

    if (!subjectA || !subjectB) {
      return res.status(400).json({ error: "subjectA and subjectB are required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildCrossSubjectPrompt(user, subjectA, subjectB);

    const response = await ai.chat(
      [{ role: "user", content: `How does ${subjectA} connect to ${subjectB}?` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({
      text: response.text,
      provider: response.provider,
      subjectA,
      subjectB,
    });
  } catch (err) {
    console.error("[cross-subject-error]", err.message);
    next(err);
  }
});

export default router;

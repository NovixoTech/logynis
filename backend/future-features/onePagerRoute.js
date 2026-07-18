// Draft route for One-Pager Generator
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildOnePagerPrompt } from "./onePagerPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/one-pager
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { topic } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "topic is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildOnePagerPrompt(user, topic);

    const response = await ai.chat(
      [{ role: "user", content: `Create a one-pager for: ${topic}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let page;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      page = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[one-pager-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate a valid one-pager, please try again" });
    }

    res.json({ page, provider: response.provider });
  } catch (err) {
    console.error("[one-pager-error]", err.message);
    next(err);
  }
});

export default router;

// Draft route for Concept Map
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildConceptMapPrompt } from "./conceptMapPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/concept-map
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

    const systemPrompt = buildConceptMapPrompt(user, topic);

    const response = await ai.chat(
      [{ role: "user", content: `Build a concept map for: ${topic}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let map;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      map = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[concept-map-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate a valid concept map, please try again" });
    }

    res.json({
      map,
      provider: response.provider,
      topic,
    });
  } catch (err) {
    console.error("[concept-map-error]", err.message);
    next(err);
  }
});

export default router; 

// Draft route for Gratitude/Reflection Prompt
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildReflectionPrompt } from "./reflectionPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// GET /future/reflection/prompt
// Generates a fresh reflection question
router.get("/prompt", authMiddleware, async (req, res, next) => {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildReflectionPrompt(user);

    const response = await ai.chat(
      [{ role: "user", content: "Give me a reflection question." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    res.json({ question: response.text });
  } catch (err) {
    console.error("[reflection-prompt-error]", err.message);
    next(err);
  }
});

// POST /future/reflection/respond
// Student answers the reflection question, gets a warm acknowledgment back
router.post("/respond", authMiddleware, async (req, res, next) => {
  try {
    const { reflection } = req.body;

    if (!reflection || !reflection.trim()) {
      return res.status(400).json({ error: "reflection is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildReflectionPrompt(user, reflection);

    const response = await ai.chat(
      [{ role: "user", content: reflection }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    // Optionally save the reflection for the student to look back on later
    await supabase.from("reflections").insert({
      userid: req.user.id,
      reflectiontext: reflection,
    });

    res.json({ text: response.text });
  } catch (err) {
    console.error("[reflection-respond-error]", err.message);
    next(err);
  }
});

export default router; 

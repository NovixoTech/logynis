// Draft route modification for Multi-Subject Session
// NOT registered in index.js yet - standalone for future integration
// This shows how the EXISTING homework chat route would need to change,
// rather than being a fully separate route

import { Router } from "express";
import ai from "../services/ai.js";
import { buildSystemPrompt } from "../services/prompts.js";
import { buildMultiSubjectAddendum } from "./multiSubjectPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/homework-multi-subject
// Draft version of the homework chat endpoint with subject-tracking support
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { messages, activeSubject, previousSubjects, conversationId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    let systemPrompt = buildSystemPrompt(user, "homework");

    if (activeSubject) {
      systemPrompt += buildMultiSubjectAddendum(activeSubject, previousSubjects || []);
    }

    const response = await ai.chat(messages, {
      systemPrompt,
      providers: ["cerebras", "groq", "gemini"],
    });

    res.json({
      text: response.text,
      provider: response.provider,
      activeSubject,
    });
  } catch (err) {
    console.error("[homework-multi-subject-error]", err.message);
    next(err);
  }
});

export default router;

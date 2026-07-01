import { Router } from "express";
import ai from "../services/ai.js";
import { buildSystemPrompt, getAIProvider } from "../services/prompts.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";
import { AgentLogger } from "novixo-agent-logger";

const router = Router();
const logger = new AgentLogger({ label: "StudySphere" });

const VALID_MODES = ["study", "exam", "homework", "revision", "motivation"];

// POST /api/chat
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { mode = "study", messages, subject } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: `Invalid mode` });
    }

    // Get user profile for personalized prompt
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildSystemPrompt(user);
    const preferredProvider = getAIProvider(mode);

    logger.log({ action: "chat_request", mode, subject, userId: req.user.id });

    const start = Date.now();

    let response;
    try {
      response = await ai.chat(messages, {
        systemPrompt,
        providers: [preferredProvider, preferredProvider === "groq" ? "gemini" : "groq"],
      });
    } catch (aiErr) {
      console.error("[AI_ERROR]", aiErr.message, aiErr.stack);
      throw aiErr;
    }

    console.log("[AI_DEBUG] provider used:", response.provider, "| errors:", response.errors || "none");

    // Save chat to Supabase
    await supabase.from("chats").insert({
      userId: req.user.id,
      message: messages[messages.length - 1]?.content,
      response: response.text,
      mode,
      subject: subject || null,
    });

    // Award +5 points
    await supabase
      .from("users")
      .update({ points: (user?.points || 0) + 5 })
      .eq("id", req.user.id);

    // Update streak
    await updateStreak(req.user.id, user);

    logger.log({
      action: "chat_response",
      provider: response.provider,
      durationMs: Date.now() - start,
    });

    res.json({
      text: response.text,
      provider: response.provider,
      mode,
      cached: response.cached,
    });
  } catch (err) {
    logger.log({ action: "chat_error", error: err.message });
    next(err);
  }
});

// Update streak logic
async function updateStreak(userId, user) {
  try {
    const today = new Date().toDateString();
    const lastDate = user?.lastStudyDate
      ? new Date(user.lastStudyDate).toDateString()
      : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newStreak = user?.streak || 0;

    if (lastDate === today) {
      return; // Already studied today
    } else if (lastDate === yesterday) {
      newStreak += 1; // Keep streak going
    } else {
      newStreak = 1; // Reset
    }

    await supabase
      .from("users")
      .update({ streak: newStreak, lastStudyDate: new Date().toISOString().split("T")[0] })
      .eq("id", userId);
  } catch (err) {
    console.error("[streak]", err.message);
  }
}

// GET /api/chat/modes
router.get("/modes", (req, res) => {
  res.json({
    modes: [
      { id: "study", label: "Study", description: "Explain concepts and topics" },
      { id: "exam", label: "Exam Prep", description: "Practice questions and model answers" },
      { id: "homework", label: "Homework", description: "Step-by-step homework help" },
      { id: "revision", label: "Revision", description: "Summaries and revision notes" },
      { id: "motivation", label: "Motivation", description: "Study tips and encouragement" },
    ],
  });
});

export default router;

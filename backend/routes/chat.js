import { Router } from "express";
import ai from "../services/ai.js";
import { getPrompt } from "../services/prompts.js";

const router = Router();

const VALID_MODES = ["study", "exam", "homework", "revision", "motivation"];

// POST /api/chat
// Body: { mode, messages: [{ role, content }] }
router.post("/", async (req, res, next) => {
  try {
    const { mode = "study", messages } = req.body;

    // Validate
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({
        error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}`,
      });
    }

    const systemPrompt = getPrompt(mode);

    const response = await ai.chat(messages, { systemPrompt });

    res.json({
      text: response.text,
      provider: response.provider,
      mode,
      cached: response.cached,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/modes — returns available modes
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

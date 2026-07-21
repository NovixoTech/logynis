import { Router } from "express";
import ai from "../services/ai.js";
import { buildSystemPrompt } from "../services/prompts.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";
import { AgentLogger } from "novixo-agent-logger";

const router = Router();
const logger = new AgentLogger({ label: "Logynis" });

const VALID_MODES = ["study", "exam", "homework", "revision", "motivation"];

function makeTitle(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 50 ? clean.slice(0, 50) + "..." : clean;
}

// POST /api/chat
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { mode = "study", messages, subject, conversationId } = req.body;

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

    const systemPrompt = buildSystemPrompt(user, mode);

    logger.log({ action: "chat_request", mode, subject, userId: req.user.id });

    const start = Date.now();

    let response;
    try {
      response = await ai.chat(messages, {
        systemPrompt,
        providers: ["cerebras", "groq", "gemini"],
      });
    } catch (aiErr) {
      console.error("[AI_ERROR]", aiErr.message, aiErr.stack);
      throw aiErr;
    }

    console.log("[AI_DEBUG] provider used:", response.provider, "| errors:", response.errors || "none");

    let finalText = response.text;
    let imageUrl = null;

    // Image generation temporarily disabled - strip any leftover [GENERATE_IMAGE:] tag so it doesn't show as raw text
    finalText = finalText.replace(/\[GENERATE_IMAGE:\s*(.+?)\]/g, "").trim();

    const lastUserMessage = messages[messages.length - 1]?.content;
    // Create a new conversation if one wasn't passed in
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const { data: newConvo, error: convoErr } = await supabase
        .from("conversations")
        .insert({
          userid: req.user.id,
          mode,
          title: makeTitle(lastUserMessage),
        })
        .select()
        .single();

      if (convoErr) throw convoErr;
      activeConversationId = newConvo.id;
    } else {
      // Touch updatedat so it bubbles to top of recent chats
      await supabase
        .from("conversations")
        .update({ updatedat: new Date().toISOString() })
        .eq("id", activeConversationId)
        .eq("userid", req.user.id);
    }

    // Save chat to Supabase, linked to the conversation
    const { error: chatInsertError } = await supabase.from("chats").insert({
      userid: req.user.id,
      conversationid: activeConversationId,
      message: lastUserMessage,
      response: finalText,
      mode,
      subject: subject || null,
      imageurl: imageUrl,
    });

    if (chatInsertError) {
      console.error("[CHAT_INSERT_ERROR]", chatInsertError.message);
    }

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
      text: finalText,
      imageUrl: imageUrl,
      provider: response.provider,
      mode,
      cached: response.cached,
      conversationId: activeConversationId,
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
      return;
    } else if (lastDate === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
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

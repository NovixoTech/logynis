import { Router } from "express";
import ai from "../services/ai.js";
import { buildSystemPrompt } from "../services/prompts.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
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
router.post("/", authMiddleware, requireActiveSubscription, async (req, res, next) => {
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

    // NOTE: Chat no longer awards points directly. For now, points come only
    // from referrals (see routes/auth.js signup logic), to keep the points
    // system simple and honest while the "unlock features with points"
    // system is being built. A capped, spam-resistant chat-points system can
    // be reintroduced later once that's ready.

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

// Update streak logic, plus one-time referral reward: once a referred
// user proves they're a real, engaged student (3-day streak) rather than
// a throwaway signup, their referrer gets +1 day of access. Guarded by
// referralrewarded so this can only ever fire once per referred user.
async function updateStreak(userId, user) {
  try {
    const today = new Date().toDateString();
    const lastDate = user?.laststudydate
      ? new Date(user.laststudydate).toDateString()
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
      .update({ streak: newStreak, laststudydate: new Date().toISOString().split("T")[0] })
      .eq("id", userId);

    if (newStreak >= 3 && user?.referredby && !user?.referralrewarded) {
      await rewardReferrer(userId, user.referredby);
    }
  } catch (err) {
    console.error("[streak]", err.message);
  }
}

// Grants the referrer +1 day of access, and marks this user as already
// having triggered their reward so it can never fire a second time (e.g.
// if streak logic re-runs, or the user's streak resets and climbs back to
// 3 again later).
async function rewardReferrer(referredUserId, referrerCode) {
  try {
    const { data: referrer, error: referrerErr } = await supabase
      .from("users")
      .select("id, subscriptionstatus, subscriptionexpiry")
      .eq("referralcode", referrerCode)
      .maybeSingle();

    if (referrerErr || !referrer) {
      console.error("[referral-reward] referrer not found for code", referrerCode);
      return;
    }

    const now = new Date();
    const currentExpiry =
      referrer.subscriptionstatus === "active" && referrer.subscriptionexpiry
        ? new Date(referrer.subscriptionexpiry)
        : now;

    // If their current access already extends past today, add the day on
    // top of that. If they're expired/on trial, the extra day starts now.
    const base = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(base.getTime() + 24 * 60 * 60 * 1000);

    await supabase
      .from("users")
      .update({
        subscriptionstatus: "active",
        subscriptionexpiry: newExpiry.toISOString(),
      })
      .eq("id", referrer.id);

    await supabase
      .from("users")
      .update({ referralrewarded: true })
      .eq("id", referredUserId);
  } catch (err) {
    console.error("[referral-reward-error]", err.message);
  }
}
    await supabase
      .from("users")
      .update({ streak: newStreak, laststudydate: new Date().toISOString().split("T")[0] })
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

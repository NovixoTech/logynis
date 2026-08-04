import { Router } from "express";
import supabase from "../services/supabase.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

function makeTitle(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 50 ? clean.slice(0, 50) + "..." : clean;
}

// GET /conversations?mode=study
// This just reads past conversations - it does not call the AI, so it stays
// ungated. A student whose trial/subscription has lapsed should still be
// able to see and manage their conversation history.
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { mode } = req.query;
    if (!mode) return res.status(400).json({ error: "mode is required" });

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("userid", req.user.id)
      .eq("mode", mode)
      .order("updatedat", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("[conversations-list]", err.message);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// GET /conversations/:id/messages
router.get("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { data: convo, error: convoErr } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", req.params.id)
      .eq("userid", req.user.id)
      .single();

    if (convoErr || !convo) return res.status(404).json({ error: "Conversation not found" });

    const { data: messages, error } = await supabase
      .from("chats")
      .select("*")
      .eq("conversationid", req.params.id)
      .order("createdat", { ascending: true });

    if (error) throw error;
    res.json({ conversation: convo, messages });
  } catch (err) {
    console.error("[conversation-messages]", err.message);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// POST /conversations - create a new conversation
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { mode, firstMessage } = req.body;
    if (!mode || !firstMessage) return res.status(400).json({ error: "mode and firstMessage are required" });

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        userid: req.user.id,
        mode,
        title: makeTitle(firstMessage),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("[conversation-create]", err.message);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// DELETE /conversations/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", req.params.id)
      .eq("userid", req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("[conversation-delete]", err.message);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;

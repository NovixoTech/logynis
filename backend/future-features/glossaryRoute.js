// Draft route for Definition/Glossary Builder
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildManualTermPrompt } from "./glossaryPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

// POST /future/glossary/add
// Manually add a term (student types a word they want defined and saved)
router.post("/add", authMiddleware, async (req, res, next) => {
  try {
    const { term, context, subject, sourceMode } = req.body;

    if (!term || !term.trim()) {
      return res.status(400).json({ error: "term is required" });
    }

    const systemPrompt = buildManualTermPrompt(term, context);

    const response = await ai.chat(
      [{ role: "user", content: `Define: ${term}` }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    const { data, error } = await supabase
      .from("glossary_terms")
      .upsert(
        {
          userid: req.user.id,
          term: term.trim(),
          definition: response.text,
          subject: subject || null,
          sourcemode: sourceMode || null,
        },
        { onConflict: "userid,term" }
      )
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ entry: data });
  } catch (err) {
    console.error("[glossary-add-error]", err.message);
    next(err);
  }
});

// GET /future/glossary?subject=Biology&search=cell
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { subject, search } = req.query;

    let query = supabase
      .from("glossary_terms")
      .select("*")
      .eq("userid", req.user.id)
      .order("term", { ascending: true });

    if (subject) query = query.eq("subject", subject);
    if (search) query = query.ilike("term", `%${search}%`);

    const { data, error } = await query;

    if (error) throw error;

    res.json({ terms: data || [] });
  } catch (err) {
    console.error("[glossary-list-error]", err.message);
    next(err);
  }
});

// DELETE /future/glossary/:id
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("glossary_terms")
      .delete()
      .eq("id", req.params.id)
      .eq("userid", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("[glossary-delete-error]", err.message);
    next(err);
  }
});

export default router;

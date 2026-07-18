// Draft route for Exam Countdown + Study Plan
// NOT registered in index.js yet - standalone for future integration

import { Router } from "express";
import ai from "../services/ai.js";
import { buildStudyPlanPrompt } from "./studyPlanPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

function daysBetween(dateStr) {
  const examDate = new Date(dateStr);
  const today = new Date();
  const diffTime = examDate.getTime() - today.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// POST /future/study-plan/generate
router.post("/generate", authMiddleware, async (req, res, next) => {
  try {
    const { examDate, subjects } = req.body;

    if (!examDate || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "examDate and subjects array are required" });
    }

    const daysUntilExam = daysBetween(examDate);

    if (daysUntilExam < 1) {
      return res.status(400).json({ error: "Exam date must be in the future" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    // Pull real weak topic data if it exists, to make the plan genuinely personalized
    const { data: topicData } = await supabase
      .from("topic_performance")
      .select("*")
      .eq("userid", req.user.id)
      .in("subject", subjects);

    const weakTopicsBySubject = {};
    (topicData || []).forEach(t => {
      const accuracy = (t.correctcount / t.totalcount) * 100;
      if (t.totalcount >= 3 && accuracy < 60) {
        if (!weakTopicsBySubject[t.subject]) weakTopicsBySubject[t.subject] = [];
        weakTopicsBySubject[t.subject].push(t.topic);
      }
    });

    const systemPrompt = buildStudyPlanPrompt(user, subjects, daysUntilExam, weakTopicsBySubject);

    const response = await ai.chat(
      [{ role: "user", content: "Create my study plan." }],
      { systemPrompt, providers: ["cerebras", "groq", "gemini"] }
    );

    let plan;
    try {
      const cleaned = response.text.replace(/```json|```/g, "").trim();
      plan = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[study-plan-parse-error]", parseErr.message, response.text);
      return res.status(500).json({ error: "Failed to generate a valid study plan, please try again" });
    }

    // Save the plan and the exam date on the user's profile
    await supabase.from("users").update({ examdate: examDate }).eq("id", req.user.id);

    const { data: savedPlan, error: saveErr } = await supabase
      .from("study_plans")
      .insert({ userid: req.user.id, examdate: examDate, subjects, plandata: plan })
      .select()
      .single();

    if (saveErr) throw saveErr;

    res.json({ plan, daysUntilExam, planId: savedPlan.id });
  } catch (err) {
    console.error("[study-plan-generate-error]", err.message);
    next(err);
  }
});

// GET /future/study-plan/latest
router.get("/latest", authMiddleware, async (req, res, next) => {
  try {
    const { data: plan, error } = await supabase
      .from("study_plans")
      .select("*")
      .eq("userid", req.user.id)
      .order("createdat", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!plan) return res.json({ hasPlan: false });

    const daysUntilExam = daysBetween(plan.examdate);

    res.json({ hasPlan: true, plan: plan.plandata, examDate: plan.examdate, daysUntilExam });
  } catch (err) {
    console.error("[study-plan-latest-error]", err.message);
    next(err);
  }
});

export default router;

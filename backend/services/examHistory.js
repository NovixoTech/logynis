import supabase from "./supabase.js";

// Fetch the student's most recent questions for a subject, to avoid AI repeating them
export async function getRecentQuestions(userId, subject, limit = 20) {
  const { data, error } = await supabase
    .from("examquestionhistory")
    .select("questiontext")
    .eq("userid", userId)
    .eq("subject", subject)
    .order("createdat", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[exam-history-fetch-error]", error.message);
    return [];
  }

  return (data || []).map(row => row.questiontext);
}

// Log newly generated questions so future generations can avoid repeating them
export async function logQuestions(userId, subject, questions) {
  if (!Array.isArray(questions) || questions.length === 0) return;

  const rows = questions.map(q => ({
    userid: userId,
    subject,
    questiontext: q.question || q.questiontext || String(q),
  }));

  const { error } = await supabase.from("examquestionhistory").insert(rows);

  if (error) {
    console.error("[exam-history-insert-error]", error.message);
  }
}

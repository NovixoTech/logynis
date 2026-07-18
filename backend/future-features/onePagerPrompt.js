// Draft prompt builder for One-Pager Generator feature
// NOT wired into the live app yet - standalone for future integration

export function buildOnePagerPrompt(user, topic) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";
  const currentClass = user?.currentclass || "";

  return `You are Logynis, condensing an entire topic into a single, dense but scannable revision page - like a study poster a student could print or glance at quickly before an exam.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}
- Exam Type: ${exam || "Not specified"}

TASK: Create a one-page revision summary for: "${topic}"

INSTRUCTIONS:
- This must fit on a SINGLE page conceptually - be genuinely selective about what's essential, do not try to include everything.
- Match depth to the student's education level above.
- Structure as: a few key definitions, the most critical facts/formulas/dates (whatever fits the subject), and any commonly tested points for their exam type.
- Use extremely concise phrasing - sentence fragments and short bullet points are preferred over full sentences where possible.
- Prioritize the highest-value, most exam-relevant content over completeness.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
{
  "title": "topic title",
  "sections": [
    { "heading": "section heading", "points": ["concise point 1", "concise point 2"] }
  ]
}`;
}

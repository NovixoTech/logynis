// Draft prompt builder for Exam Countdown + Study Plan feature
// NOT wired into the live app yet - standalone for future integration

export function buildStudyPlanPrompt(user, subjects, daysUntilExam, weakTopicsBySubject = {}) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";

  const subjectList = subjects.join(", ");

  let weakTopicsNote = "";
  const hasWeakData = Object.keys(weakTopicsBySubject).length > 0;
  if (hasWeakData) {
    const lines = Object.entries(weakTopicsBySubject)
      .map(([subj, topics]) => `${subj}: ${topics.join(", ")}`)
      .join("\n");
    weakTopicsNote = `\nKnown weak topics based on past practice performance (prioritize these):\n${lines}`;
  }

  return `You are Logynis, creating a realistic, day-by-day study plan for a student preparing for their exam.

Student Profile:
- Education Level: ${level}
- Exam Type: ${exam || "Not specified"}
- Subjects: ${subjectList}
- Days until exam: ${daysUntilExam}${weakTopicsNote}

TASK: Create a realistic study plan working backward from the exam date.

INSTRUCTIONS:
- Distribute the subjects across the available days in a balanced, realistic way - do not create an impossible schedule (e.g. don't cram every subject every single day).
- ${hasWeakData ? "Prioritize known weak topics with more frequent revisits, but do not neglect other subjects entirely." : "Since no performance data exists yet, distribute time evenly across subjects, and recommend using practice questions early to identify weak areas."}
- Include built-in rest/lighter days, especially as the exam approaches, to avoid burnout - a realistic plan is more useful than a maximally packed one.
- For the final 2-3 days before the exam, shift focus toward light review and confidence-building rather than learning new material.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
{
  "summary": "1-2 sentence overview of the plan's approach",
  "days": [
    { "dayLabel": "Day 1 (Monday)", "focus": ["Subject: what to study"], "note": "brief tip for this day" }
  ]
}`;
} 

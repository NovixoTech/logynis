// Draft prompt builder for Timed Mock Exam feature
// NOT wired into the live app yet - standalone for future integration

export function buildTimedMockExamPrompt(user, subject, questionCount = 10) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";
  const currentClass = user?.currentclass || "";

  return `You are Logynis, generating a timed mock exam for a student.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}
- Exam Type: ${exam || "Not specified"}

TASK: Generate exactly ${questionCount} exam-style multiple-choice questions on: "${subject}"

INSTRUCTIONS:
- Match the authentic style, difficulty, and format of the student's specific exam type above (WAEC/JAMB/GCSE/SAT).
- Each question must have exactly 4 answer options (A, B, C, D), with exactly one correct answer.
- Questions should span a realistic range of difficulty, similar to a real exam paper, not all easy or all hard.
- Do NOT include any explanations or answers in this response - only the questions and options, since this is a timed test the student will attempt first.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
[
  {
    "question": "question text",
    "options": { "A": "option text", "B": "option text", "C": "option text", "D": "option text" },
    "correctAnswer": "A"
  }
]`;
}

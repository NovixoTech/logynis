// Draft prompt builder for Rapid-Fire Recall Quiz feature
// NOT wired into the live app yet - standalone for future integration

export function buildRapidRecallPrompt(user, topic, questionCount = 15) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";

  return `You are Logynis, generating a rapid true/false or one-word-answer quiz for last-minute revision cramming.

Student Profile:
- Education Level: ${level}
- Exam Type: ${exam || "Not specified"}

TASK: Generate exactly ${questionCount} rapid recall questions on: "${topic}"

INSTRUCTIONS:
- Mix true/false statements and short fill-in-the-blank/one-word questions.
- These must be genuinely quick to answer - no full sentences required, just true/false or a single word/number/term.
- Focus on the most commonly tested, high-value facts for this topic, not obscure details.
- Match difficulty to the student's education level above.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
[
  { "type": "truefalse", "statement": "statement text", "answer": true },
  { "type": "shortanswer", "question": "question text", "answer": "expected short answer" }
]`;
  }

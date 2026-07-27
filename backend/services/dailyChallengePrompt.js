// Draft prompt builder for Daily Challenge Question feature
// NOT wired into the live app yet - standalone for future integration

export function buildDailyChallengePrompt(user) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";
  const subjects = Array.isArray(user?.subjects) ? user.subjects.join(", ") : (user?.subjects || "General knowledge");

  return `You are Logynis, generating a single daily challenge question to encourage a student to open the app and engage briefly every day.

Student Profile:
- Education Level: ${level}
- Exam Type: ${exam || "Not specified"}
- Subjects: ${subjects}

TASK: Generate ONE engaging, appropriately challenging question from one of the student's subjects.

INSTRUCTIONS:
- Pick a genuinely interesting question - not too easy (boring) or too hard (discouraging) for their level.
- Rotate which subject you draw from naturally if multiple are listed - don't always default to the first one.
- Make it a multiple-choice question with exactly 4 options.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
{
  "subject": "subject this question is from",
  "question": "question text",
  "options": { "A": "option text", "B": "option text", "C": "option text", "D": "option text" },
  "correctAnswer": "A",
  "funFact": "1 sentence interesting fact related to the answer, shown after they respond"
}`;
}

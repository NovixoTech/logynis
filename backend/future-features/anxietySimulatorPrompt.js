// Draft prompt builder for Exam Anxiety Simulator feature
// NOT wired into the live app yet - standalone for future integration

export function buildAnxietySimulatorPrompt(user, subject, questionCount = 10) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";

  return `You are Logynis, generating exam questions specifically for a high-pressure exam simulation designed to build resilience under real exam conditions.

Student Profile:
- Education Level: ${level}
- Exam Type: ${exam || "Not specified"}

TASK: Generate exactly ${questionCount} multiple-choice questions on: "${subject}", suitable for a strict, no-going-back timed simulation.

INSTRUCTIONS:
- Match authentic exam difficulty and style for the student's exam type above.
- Each question must have exactly 4 answer options (A, B, C, D), with exactly one correct answer.
- Include a mix of straightforward and genuinely challenging questions, similar to real exam pressure - do not make this artificially easier than a real exam.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
[
  {
    "question": "question text",
    "options": { "A": "option text", "B": "option text", "C": "option text", "D": "option text" },
    "correctAnswer": "A"
  }
]`;
}

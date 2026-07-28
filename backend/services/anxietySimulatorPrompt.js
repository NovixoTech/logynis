// Prompt builder for Exam Anxiety Simulator feature

export function buildAnxietySimulatorPrompt(user, subject, questionCount = 10, recentQuestions = []) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";

  const avoidRepeatsBlock = recentQuestions.length > 0
    ? `\nAVOID REPEATING these questions the student has already been asked on this subject recently:\n${recentQuestions.map(q => `- ${q}`).join("\n")}\nGenerate genuinely different questions covering different specific facts, angles, or sub-topics than the ones listed above, even if the general subject overlaps.`
    : "";

  return `You are Logynis, generating exam questions specifically for a high-pressure exam simulation designed to build resilience under real exam conditions.

Student Profile:
- Education Level: ${level}
- Exam Type: ${exam || "Not specified"}

TASK: Generate exactly ${questionCount} multiple-choice questions on: "${subject}", suitable for a strict, no-going-back timed simulation.
${avoidRepeatsBlock}

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

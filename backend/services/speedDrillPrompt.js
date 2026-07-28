// Prompt builder for Speed Drill Mode feature

export function buildSpeedDrillPrompt(user, subject, questionCount = 15, recentQuestions = []) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";

  const avoidRepeatsBlock = recentQuestions.length > 0
    ? `\nAVOID REPEATING these questions the student has already been asked on this subject recently:\n${recentQuestions.map(q => `- ${q}`).join("\n")}\nGenerate genuinely different questions covering different specific facts, angles, or sub-topics than the ones listed above, even if the general subject overlaps.`
    : "";

  return `You are Logynis, generating rapid-fire short-answer questions for a speed drill practice session.

Student Profile:
- Education Level: ${level}
- Exam Type: ${exam || "Not specified"}

TASK: Generate exactly ${questionCount} quick-fire questions on: "${subject}"
${avoidRepeatsBlock}

INSTRUCTIONS:
- Questions must be answerable in a single word, short phrase, or number - NOT full sentences or explanations. This is for speed and quick recall, not deep reasoning.
- Focus on foundational facts, definitions, key terms, and quick recall items appropriate to the student's level.
- Vary the question types slightly (definitions, "what is called...", quick calculations, fill-in-the-blank style) to keep it engaging.
- Keep questions short and unambiguous - there should be one clear correct answer.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
[
  { "question": "short question text", "answer": "short expected answer" }
]`;
}

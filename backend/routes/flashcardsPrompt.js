// Draft prompt builder for Flashcards feature
// NOT wired into the live app yet - standalone for future integration

export function buildFlashcardsPrompt(user, topic, count = 8) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const currentClass = user?.currentclass || "";

  return `You are Logynis, generating flashcards to help a student practice active recall on a specific topic.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}

TASK: Generate exactly ${count} flashcards on: "${topic}"

INSTRUCTIONS:
- Match difficulty and depth to the student's education level above.
- Each flashcard must have a clear, specific question on the front and a concise, accurate answer on the back.
- Cover a range of angles on the topic: definitions, key facts, cause-and-effect, comparisons, and application, not just repetitive fact recall.
- Keep answers concise (1-3 sentences) - flashcards are for quick recall, not full explanations.
- Order cards from foundational to slightly more challenging.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
[
  { "front": "question text", "back": "answer text" },
  { "front": "question text", "back": "answer text" }
]`;
}

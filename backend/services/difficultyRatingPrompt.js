// Draft prompt builder for Homework Difficulty Rating feature
// NOT wired into the live app yet - standalone for future integration

export function buildDifficultyRatingPrompt(user, homeworkQuestion) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const currentClass = user?.currentclass || "";

  return `You are Logynis, assessing the difficulty of a homework question relative to a student's education level.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}

The homework question: "${homeworkQuestion}"

TASK: Rate how difficult this question is RELATIVE to what is typically expected at the student's stated level above - not difficulty in an absolute sense.

INSTRUCTIONS:
- Consider whether this question matches, exceeds, or falls below typical expectations for their class/level.
- Be honest - if a question is genuinely above their current level (e.g. testing content not usually covered until later), say so clearly, since this is useful information for the student or a parent/teacher reviewing this.
- Keep your reasoning brief and specific to what makes this question easy, appropriate, or challenging for their level.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
{
  "difficultyRating": "Below Level | At Level | Above Level | Significantly Above Level",
  "score": 1-10,
  "reasoning": "1-3 sentences explaining the rating"
}`;
}

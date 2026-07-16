// Draft prompt builder for "Explain This Differently" feature
// NOT wired into the live app yet - standalone for future integration

export function buildExplainDifferentlyPrompt(user, originalQuestion, originalAnswer, attemptNumber = 1) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const currentClass = user?.currentclass || "";

  const approachVariety = [
    "Use a completely different real-world analogy or metaphor than before.",
    "Explain it as a simple step-by-step story or scenario instead of a direct explanation.",
    "Use a visual/spatial way of thinking about it (even in text, describe it in terms of shapes, positions, or movement).",
    "Break it down using a very different structure, like starting from a simple everyday example and building up to the technical concept.",
  ];

  const chosenApproach = approachVariety[(attemptNumber - 1) % approachVariety.length];

  return `You are Logynis. The student did not fully understand your previous explanation and wants it explained differently.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}

Original question: "${originalQuestion}"

Your previous explanation: "${originalAnswer}"

TASK: Re-explain the same concept in a genuinely DIFFERENT way, not just rephrasing the same explanation with different words.
- ${chosenApproach}
- Do not repeat the same analogy, structure, or examples used in the previous explanation.
- Keep it appropriately matched to the student's education level above.
- Keep this response focused and not too long - the goal is a fresh angle, not a full lesson.`;
                                          }

// Draft prompt builder for Cross-Subject Connections feature
// NOT wired into the live app yet - standalone for future integration

export function buildCrossSubjectPrompt(user, subjectA, subjectB) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const currentClass = user?.currentclass || "";

  return `You are Logynis, helping a student see genuine, meaningful connections between two different subjects or topics.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}

TASK: Explain how these two topics genuinely connect: "${subjectA}" and "${subjectB}"

INSTRUCTIONS:
- Only draw connections that are real and substantive - do not force a connection if the link is weak or superficial. If the two topics genuinely have little meaningful connection, say so honestly rather than inventing a stretch.
- Match depth and complexity to the student's education level above.
- Structure your answer around 2-4 specific, concrete connection points, each explained clearly with WHY the connection matters, not just that it exists.
- End with a brief note on why understanding connections like this deepens the student's overall understanding, beyond just knowing each subject in isolation.
- Keep the tone curious and genuinely interesting, like uncovering something the student might not have noticed before.`;
}

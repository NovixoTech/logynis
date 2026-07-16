// Draft prompt builder for Concept Map feature
// NOT wired into the live app yet - standalone for future integration

export function buildConceptMapPrompt(user, topic) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const currentClass = user?.currentclass || "";

  return `You are Logynis, generating a concept map to help a student see how ideas within a topic connect to each other.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}

TASK: Build a concept map for: "${topic}"

INSTRUCTIONS:
- Match depth and complexity to the student's education level above.
- Identify the central concept, then break it down into 4-7 key sub-concepts or related ideas.
- For each sub-concept, briefly explain HOW it connects to the central concept and to other sub-concepts where relevant (not just isolated definitions).
- Focus specifically on relationships and connections, not standalone facts - this is the whole point of a concept map versus a normal explanation.
- End with 1-2 sentences on why seeing these connections matters for genuinely understanding the topic (not just memorizing it).

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
{
  "central": "the main topic/concept",
  "nodes": [
    { "label": "sub-concept name", "connection": "brief explanation of how this connects to the central concept and/or other nodes" }
  ],
  "insight": "1-2 sentences on why these connections matter"
}`;
}

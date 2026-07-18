// Draft prompt builder for Weak Topic Tracker feature
// NOT wired into the live app yet - standalone for future integration

export function buildTopicTaggingPrompt(subject, question) {
  return `You are categorizing an exam question for performance tracking purposes.

Subject: "${subject}"
Question: "${question}"

TASK: Identify the single most specific topic (not the whole subject) that this question tests. For example, if the subject is "Biology" and the question is about the Krebs cycle, the topic should be "Krebs Cycle" or "Cellular Respiration", not "Biology".

CRITICAL: Respond ONLY with the topic name as plain text, nothing else. Keep it short (2-5 words).`;
}

export function buildWeakTopicRecommendationPrompt(user, weakTopics) {
  const level = user?.educationlevel || user?.educationLevel || "General";

  const topicList = weakTopics.map(t => `- ${t.topic} (${t.subject}): ${t.accuracy}% accuracy over ${t.totalcount} questions`).join("\n");

  return `You are Logynis, giving a student honest, encouraging feedback on which topics they should focus on based on their real practice performance.

Student Profile:
- Education Level: ${level}

Their weakest topics based on actual practice data:
${topicList}

INSTRUCTIONS:
- Briefly explain what these results suggest, in an encouraging, non-judgmental tone - struggling with a topic is normal and useful information, not a failure.
- For each weak topic, give one concrete, actionable suggestion for how to improve (e.g. specific sub-concepts to revisit, or which Logynis mode/feature could help).
- Keep the response focused and practical - this is a coaching note, not a full lesson.
- End with genuine encouragement about their overall practice effort, not just the weak spots.`;
}

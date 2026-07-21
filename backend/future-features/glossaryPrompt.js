// Draft prompt builder for Definition/Glossary Builder feature
// NOT wired into the live app yet - standalone for future integration

export function buildTermExtractionPrompt(conversationText) {
  return `You are extracting key academic terms from a study conversation to build a student's personal glossary.

Conversation excerpt:
"""
${conversationText}
"""

TASK: Identify up to 5 genuinely important academic terms or concepts discussed in this conversation that would be worth saving to a glossary.

INSTRUCTIONS:
- Only extract genuine academic/technical terms, not common everyday words.
- For each term, provide a clean, concise definition (1-2 sentences) based on how it was actually discussed in the conversation.
- If no genuinely notable terms appear, return an empty array - do not force terms that aren't really there.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
[
  { "term": "term name", "definition": "concise definition" }
]`;
}

export function buildManualTermPrompt(term, context) {
  return `You are Logynis, providing a clean, concise definition for a student's personal glossary.

TASK: Define this term clearly: "${term}"
${context ? `Context: ${context}` : ""}

INSTRUCTIONS:
- Give a clear, concise definition (1-3 sentences) - this is for a glossary entry, not a full explanation.
- If the term is ambiguous or has multiple meanings across subjects, ask for clarification on which subject/context, rather than guessing.

Respond with ONLY the definition text (or a brief clarifying question if genuinely ambiguous), nothing else.`;
}

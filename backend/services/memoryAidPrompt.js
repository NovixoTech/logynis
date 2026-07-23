// Draft prompt builder for the Memory Aid Generator feature
// NOT wired into the live app yet - standalone for future integration

export function buildMemoryAidPrompt(user, topic, format = "auto") {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const currentClass = user?.currentclass || "";

  const formatInstruction = {
    mnemonic: "Create a memorable acronym or mnemonic phrase where each letter/word represents a key part of the topic.",
    rhyme: "Create a short rhyme or poem that captures the key points of the topic in a way that's easy to remember.",
    song: "Create short, simple song-style lyrics (like a jingle) that a student could sing to remember the topic. Keep it to a simple, catchy verse or two.",
    story: "Create a short memory-palace style story or narrative that links the key points of the topic together in a memorable sequence.",
    auto: "Choose whichever format (acronym, rhyme, song, or story) would work best for this specific topic, and briefly explain why you chose it.",
  };

  const chosenFormat = formatInstruction[format] || formatInstruction.auto;

  return `You are Logynis, generating a memory aid to help a student remember a specific topic.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}

TASK: The student wants to memorize: "${topic}"

INSTRUCTIONS:
- ${chosenFormat}
- Keep the language and complexity appropriate for the student's education level above.
- After the memory aid itself, briefly explain (2-3 sentences) how each part of it maps back to the actual academic content, so the student understands what they're memorizing, not just reciting something meaningless.
- Keep the entire response focused and concise - this is a memory tool, not a full lesson.
- Make it genuinely memorable: use rhythm, repetition, vivid imagery, or humor where appropriate.`;
    }

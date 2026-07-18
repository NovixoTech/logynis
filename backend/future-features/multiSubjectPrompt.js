// Draft prompt builder addition for Multi-Subject Session
// NOT wired into the live app yet - standalone for future integration
// This is a small addition layered onto the existing Homework prompt, not a standalone prompt

export function buildMultiSubjectAddendum(activeSubject, previousSubjects = []) {
  if (previousSubjects.length === 0) {
    return "";
  }

  return `\n\nIMPORTANT CONTEXT: This is a multi-subject homework session. The student has already worked on: ${previousSubjects.join(", ")} earlier in this conversation. They are now asking about: ${activeSubject}. Treat this as a genuinely fresh subject switch - do not carry over assumptions, terminology, or context from the previous subject(s) unless the student explicitly connects them. Briefly acknowledge the switch (e.g. "Switching to ${activeSubject} now") before helping with the new question.`;
}

// Draft prompt builder for Auto-Generated Revision Timetable feature
// NOT wired into the live app yet - standalone for future integration

export function buildRevisionTimetablePrompt(user, subjects, daysPerWeek, hoursPerSession) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const exam = user?.examtype || user?.examType || "";

  return `You are Logynis, creating a realistic, recurring weekly revision timetable.

Student Profile:
- Education Level: ${level}
- Exam Type: ${exam || "Not specified"}
- Subjects: ${subjects.join(", ")}
- Days available per week: ${daysPerWeek}
- Hours per revision session: ${hoursPerSession}

TASK: Create a realistic, recurring WEEKLY revision timetable (not tied to a specific exam date, just an ongoing routine).

INSTRUCTIONS:
- Distribute all subjects fairly across the available days - avoid cramming every subject into one day.
- Rotate subjects across the week so each gets revisited more than once if the schedule allows, rather than one single session per subject per week.
- Keep session lengths realistic and matched to what was specified.
- Build in at least one rest day if the days available allow for it, to avoid burnout in an ongoing routine.

CRITICAL: Respond ONLY with valid JSON in this exact format, no other text before or after:
{
  "schedule": [
    { "day": "Monday", "sessions": [{ "subject": "subject name", "duration": "e.g. 1 hour" }] }
  ],
  "tip": "1-2 sentence tip for sticking to this routine consistently"
}`;
    }

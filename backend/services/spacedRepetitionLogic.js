// Draft core scheduling logic for Spaced Repetition Reminders
// NOT wired into the live app yet - standalone for future integration
// Based on standard spaced repetition intervals (simplified version, not full SM-2 algorithm)

const INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

export function calculateNextReview(reviewCount) {
  const intervalIndex = Math.min(reviewCount, INTERVALS_DAYS.length - 1);
  const daysToAdd = INTERVALS_DAYS[intervalIndex];

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate.toISOString();
}

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import examRouter from "./routes/exam.js";
import feedRouter from "./routes/feed.js";
import conversationsRouter from "./routes/conversations.js";
import photoHomeworkRouter from "./routes/photoHomework.js";
import flashcardsRouter from "./routes/flashcards.js";
import memoryAidRouter from "./routes/memoryAid.js";
import explainDifferentlyRouter from "./routes/explainDifferently.js";
import conceptMapRouter from "./routes/conceptMap.js";
import noteSummarizerRouter from "./routes/noteSummarizer.js";
import crossSubjectRouter from "./routes/crossSubject.js";
import debatePracticeRouter from "./routes/debatePractice.js";
import anxietySimulatorRouter from "./routes/anxietySimulator.js";
import commonMistakesRouter from "./routes/commonMistakes.js";
import conceptFirstRouter from "./routes/conceptFirst.js";
import difficultyRatingRouter from "./routes/difficultyRating.js";
import essayFeedbackRouter from "./routes/essayFeedback.js";
import moodCheckinRouter from "./routes/moodCheckin.js";
import multiSubjectRouter from "./routes/multiSubject.js";
import onePagerRouter from "./routes/onePager.js";
import rapidRecallRouter from "./routes/rapidRecall.js";
import readinessScoreRouter from "./routes/readinessScore.js";
import reflectionRouter from "./routes/reflection.js";
import revisionTimetableRouter from "./routes/revisionTimetable.js";
import spacedRepetitionRouter from "./routes/spacedRepetition.js";
import speedDrillRouter from "./routes/speedDrill.js";
import studyPlanRouter from "./routes/studyPlan.js";
import successStoryRouter from "./routes/successStory.js";
import timedMockExamRouter from "./routes/timedMockExam.js";
import weakTopicRouter from "./routes/weakTopic.js";
import dailyChallengeRouter from "./routes/dailyChallenge.js";
import glossaryRouter from "./routes/glossary.js";
import referralRouter from "./routes/referral.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/exam", examRouter);
app.use("/feed", feedRouter);
app.use("/conversations", conversationsRouter);
app.use("/photo-homework", photoHomeworkRouter);
app.use("/api/flashcards", flashcardsRouter);
app.use("/api/memory-aid", memoryAidRouter);
app.use("/api/explain-differently", explainDifferentlyRouter);
app.use("/api/concept-map", conceptMapRouter);
app.use("/api/note-summarizer", noteSummarizerRouter);
app.use("/api/cross-subject", crossSubjectRouter);
app.use("/api/debate-practice", debatePracticeRouter);
app.use("/api/anxiety-simulator", anxietySimulatorRouter);
app.use("/api/common-mistakes", commonMistakesRouter);
app.use("/api/concept-first", conceptFirstRouter);
app.use("/api/difficulty-rating", difficultyRatingRouter);
app.use("/api/essay-feedback", essayFeedbackRouter);
app.use("/api/mood-checkin", moodCheckinRouter);
app.use("/api/multi-subject", multiSubjectRouter);
app.use("/api/one-pager", onePagerRouter);
app.use("/api/rapid-recall", rapidRecallRouter);
app.use("/api/readiness-score", readinessScoreRouter);
app.use("/api/reflection", reflectionRouter);
app.use("/api/revision-timetable", revisionTimetableRouter);
app.use("/api/spaced-repetition", spacedRepetitionRouter);
app.use("/api/speed-drill", speedDrillRouter);
app.use("/api/study-plan", studyPlanRouter);
app.use("/api/success-story", successStoryRouter);
app.use("/api/timed-mock-exam", timedMockExamRouter);
app.use("/api/weak-topics", weakTopicRouter);
app.use("/api/daily-challenge", dailyChallengeRouter);
app.use("/api/glossary", glossaryRouter);
app.use("/api/referral", referralRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Logynis API running on port ${PORT}`);
});

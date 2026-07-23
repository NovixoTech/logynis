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
import conceptMapRouter from "./routes/conceptMap.js";

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
app.use("/api/concept-map", conceptMapRouter);

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

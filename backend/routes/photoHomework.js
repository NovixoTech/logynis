import { Router } from "express";
import ai from "../services/ai.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

function buildPhotoHomeworkPrompt(user) {
  const level = user?.educationlevel || user?.educationLevel || "General";
  const currentClass = user?.currentclass || "";

  return `You are Logynis, a patient homework helper who guides students to understand and solve problems step-by-step.

Student Profile:
- Education Level: ${level}
- Current Class/Level: ${currentClass || "Not specified"}

TASK: The student has shared a photo of a homework question (handwritten or printed).

INSTRUCTIONS:
- First, carefully read and transcribe exactly what the question in the photo says, so the student can confirm you read it correctly. Present this transcription clearly before anything else.
- If any part of the photo is unclear, blurry, or ambiguous, say so honestly and ask the student to clarify or retake the photo, rather than guessing at unclear content.
- After confirming the question, follow the same step-by-step approach as normal Homework Mode: give ONLY the next step needed, explain why, then pause for the student before continuing. Do NOT solve the entire problem at once.
- Match your language and depth to the student's education level above.
- Keep tone encouraging and clear, like a patient tutor sitting beside them.`;
}

// POST /photo-homework
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { imageBase64, mimeType, followUpText } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "imageBase64 and mimeType are required" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({ error: "Unsupported image type. Please use JPEG, PNG, or WebP." });
    }

    if (imageBase64.length > 5_500_000) {
      return res.status(400).json({ error: "Image is too large. Please use a smaller photo." });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildPhotoHomeworkPrompt(user);

    const result = await ai.analyzeImage(imageBase64, mimeType, systemPrompt, followUpText);

    if (!result.success) {
      return res.status(500).json({ error: "Failed to read the image. Please try again with a clearer photo." });
    }

    res.json({ text: result.text, provider: result.provider });
  } catch (err) {
    console.error("[photo-homework-error]", err.message);
    next(err);
  }
});

export default router;

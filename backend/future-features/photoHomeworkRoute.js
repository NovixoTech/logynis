// Draft route for Photo-to-Homework
// NOT registered in index.js yet - standalone for future integration
// IMPORTANT: This route calls Gemini directly for vision, bypassing the normal
// cerebras -> groq -> gemini chain, since only Gemini supports image input for free.

import { Router } from "express";
import { buildPhotoHomeworkPrompt } from "./photoHomeworkPrompt.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../services/supabase.js";

const router = Router();

async function callGeminiVision(imageBase64, mimeType, systemPrompt, userText) {
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: userText || "Please help me with this homework question." },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`gemini vision failed: ${data.error?.message || res.statusText}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("gemini vision failed: empty response");

  return text;
}

// POST /future/photo-homework
// Expects: { imageBase64: "...", mimeType: "image/jpeg", followUpText: "optional student message" }
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

    // Rough size check - base64 is ~33% larger than original, cap around 4MB original
    if (imageBase64.length > 5_500_000) {
      return res.status(400).json({ error: "Image is too large. Please use a smaller photo." });
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const systemPrompt = buildPhotoHomeworkPrompt(user);

    let text;
    try {
      text = await callGeminiVision(imageBase64, mimeType, systemPrompt, followUpText);
    } catch (visionErr) {
      console.error("[photo-homework-vision-error]", visionErr.message);
      return res.status(500).json({ error: "Failed to read the image. Please try again with a clearer photo." });
    }

    res.json({ text });
  } catch (err) {
    console.error("[photo-homework-error]", err.message);
    next(err);
  }
});

export default router;

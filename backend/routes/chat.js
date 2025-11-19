// chat.js
import express from "express";
import ollama from "ollama";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log("📥 User message:", userMessage);

    const response = await ollama.chat({
      model: "gemma3:1b", // CPU-friendly model
      messages: [
        {
          role: "system",
          content: `You are StressGPT, a friendly and helpful student stress management assistant. 
          Always respond politely to greetings (like "hello", "hi") with a friendly message. 
          Provide stress management advice when asked. Keep responses simple and easy to read. 
          If the question is not about stress, respond politely to general questions too.`
        },
        { role: "user", content: userMessage }
      ],
      max_tokens: 200
    });

    const botReply =
      response.message?.content ||
      response.messages?.[0]?.content ||
      "Sorry, I cannot answer that right now.";

    console.log("🤖 Bot reply:", botReply);
    res.json({ reply: botReply });

  } catch (err) {
    console.error("❌ Chatbot error:", err);
    res.status(500).json({ error: "Chatbot error" });
  }
});

export default router;

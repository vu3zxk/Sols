import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Standard top-level payload deserialization middleware (must be mounted before routes)
app.use(express.json({ limit: "5mb" }));

// Initialize Gemini API client lazily or safely with fallback
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. API calls will fail until configured in AI Studio secrets.");
    }
    genAIClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

// Helper to execute generateContent with full fallback recovery
async function generateContentWithFallback(
  contents: any,
  systemInstruction?: string,
  temperature: number = 0.7
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature,
        },
      });

      const responseText = response.text || "";
      if (responseText) {
        return { text: responseText, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Failed with model ${model}:`, err?.message || err);
      lastError = err;
      // Recoverable error conditions -> continue down ladder
      const statusCode = err?.status || err?.statusCode || 0;
      if ([404, 429, 500, 503].includes(statusCode) || err?.message?.includes("not found") || err?.message?.includes("quota")) {
        continue;
      }
    }
  }

  throw lastError || new Error("Failed to generate content with all fallback models in the ladder.");
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Multi-turn Reflection / Conversation Endpoint
app.post("/api/gemini/reflect", async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { messages = [], mode = "reflect", reflectionContext = "" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Missing or invalid 'messages' array in request payload." });
      return;
    }

    // Adaptive, intelligent system instruction that dynamically analyzes context
    let systemInstruction = `You are Sols, an intuitive, empathetic, and mindful reflective journaling companion powered by Gemini.
Your mission is to dynamically analyze the user's input, dialogue, and journal context, and adaptively provide whatever response best serves them in the moment:
- Deep Reflection & Emotional Resonance: Validate feelings, reflect back nuances, and illuminate underlying themes.
- Synthesis & Clarity: When thoughts are swirling or complex, organize key patterns and provide gentle distillations.
- Brainstorming & Actionable Ideas: When the user is exploring options or facing challenges, offer creative angles, perspectives, and gentle experiments.
- Mindful Inquiry: Weave in 1-2 thoughtful, open-ended questions that invite deeper introspection.

Tone & Style:
1. Speak with genuine warmth, curiosity, and psychological safety.
2. Avoid generic platitudes, robotic advice, or unsolicited lecturing.
3. Keep responses engaging, concise, and structured (use natural prose, occasional bullet points, or bold emphasis where it enhances readability).
4. Ground every insight directly in what the user expressed.`;

    if (reflectionContext && typeof reflectionContext === "string") {
      systemInstruction += `\n\nExisting Journal Context:\n"""\n${reflectionContext.slice(0, 4000)}\n"""`;
    }

    // Convert messages to Gemini contents structure
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content || m.text || "") }],
    }));

    const result = await generateContentWithFallback(contents, systemInstruction);

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API /api/gemini/reflect] Error:", error);
    res.status(500).json({
      error: error?.message || "Internal server error occurred while processing reflection.",
    });
  }
});

// Quick AI Summary & Insights Endpoint
app.post("/api/gemini/summarize", async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { title = "", content = "", entries = [] } = body;

    const fullText = [
      title ? `Title: ${title}` : "",
      content ? `Content:\n${content}` : "",
      Array.isArray(entries) && entries.length > 0
        ? `Dialogue:\n` + entries.map((e: any) => `${e.role}: ${e.content}`).join("\n")
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (!fullText.trim()) {
      res.status(400).json({ error: "No content provided to summarize." });
      return;
    }

    const prompt = `Please analyze this journal reflection entry and provide:
1. **Essence**: A clear, 1-2 sentence distillation of the main theme or core emotional state.
2. **Key Insights**: 2-3 bullet points identifying underlying patterns, breakthroughs, or key observations.
3. **Suggested Next Step**: 1 gentle, actionable thought or reflection exercise.
4. **Key Themes / Tags**: 3-5 concise one-word or two-word lowercase tags separated by commas.

Entry:
"""
${fullText.slice(0, 8000)}
"""`;

    const systemInstruction = `You are an expert reflective analyst. Provide elegant, sharp, and compassionate syntheses of personal reflections.`;

    const result = await generateContentWithFallback(
      [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction,
      0.3
    );

    res.json({
      summary: result.text,
      modelUsed: result.modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API /api/gemini/summarize] Error:", error);
    res.status(500).json({
      error: error?.message || "Internal error generating summary.",
    });
  }
});

// Convert Monthly Freeform Goals into Actionable Todo Items
app.post("/api/gemini/goals-to-todos", async (req: Request, res: Response) => {
  try {
    const { plansRaw = "", monthKey = "" } = req.body || {};
    if (!plansRaw.trim()) {
      res.status(400).json({ error: "No goal text provided." });
      return;
    }

    const prompt = `The user has written their intentions and aspirations for the month (${monthKey || 'this month'}):
"""
${plansRaw.slice(0, 4000)}
"""

Convert these aspirations into an organized list of 4 to 8 clear, realistic, and actionable to-do items.
Return ONLY valid JSON (without Markdown formatting or backticks) matching this exact format:
[
  {
    "id": "todo-1",
    "title": "Actionable task description",
    "category": "Focus | Health | Creative | Personal | Career",
    "priority": "high | medium | low"
  }
]`;

    const systemInstruction = `You are a productivity and mindful goal planner. Parse goals into structured, motivating actionable todos. Output only strict JSON array.`;

    const result = await generateContentWithFallback(
      [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction,
      0.2
    );

    let parsedTodos = [];
    try {
      const cleanJson = result.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedTodos = JSON.parse(cleanJson);
    } catch {
      // Fallback if parsing fails
      parsedTodos = [
        { id: `todo-${Date.now()}-1`, title: "Define milestone step for primary goal", category: "Focus", priority: "high" },
        { id: `todo-${Date.now()}-2`, title: "Establish daily routine supporting intention", category: "Personal", priority: "medium" },
        { id: `todo-${Date.now()}-3`, title: "Mid-month check-in and progress calibration", category: "Focus", priority: "medium" },
      ];
    }

    res.json({
      todos: parsedTodos,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[API /api/gemini/goals-to-todos] Error:", error);
    res.status(500).json({ error: error?.message || "Failed to convert goals to tasks." });
  }
});

// Month-End Review & Comparison Endpoint
app.post("/api/gemini/month-review", async (req: Request, res: Response) => {
  try {
    const { 
      monthName = "",
      highestDay = null, 
      lowestDay = null, 
      avgMood = 0,
      totalMoodLogs = 0,
      journalHighlights = [],
      initialGoals = "",
      todosCompleted = 0,
      todosTotal = 0
    } = req.body || {};

    const prompt = `Conduct a mindful and insightful month-end review for ${monthName}:
- Total Sol mood check-ins: ${totalMoodLogs}
- Average mood score (1-5): ${avgMood}
- Peak/Highest Day: ${highestDay ? `${highestDay.date} (Score: ${highestDay.score}/5, Mood: ${highestDay.mood}, Note: "${highestDay.note || 'None'}")` : 'No peak data'}
- Lowest Day: ${lowestDay ? `${lowestDay.date} (Score: ${lowestDay.score}/5, Mood: ${lowestDay.mood}, Note: "${lowestDay.note || 'None'}")` : 'No lowest day data'}
- Monthly Goals Written at Start: "${initialGoals || 'None specified'}"
- Task Progress: ${todosCompleted} completed out of ${todosTotal}
- Journal Snippets from Month:
${journalHighlights.map((j: any) => `- [${j.date}] ${j.title}: ${j.snippet}`).slice(0, 5).join("\n")}

Please provide a compassionate, deep, and beautifully structured review:
1. **The Peak Sol (Highest Moment)**: Celebrate what made this day stand out and what energized them.
2. **The Low Sol (Navigating the Trough)**: Gentle compassion on what weighed them down on their hardest day, and what resilience was shown.
3. **Monthly Goals vs. Reality**: Honest and encouraging comparison of what they set out to achieve at the beginning versus where they stand now.
4. **Guiding Wisdom for Next Sol Cycle**: 2 key mindful takeaways for the upcoming month.`;

    const systemInstruction = `You are Sols' mindful month-end retrospective coach. Write with deep warmth, clarity, balanced realism, and poetic resonance. Avoid toxic positivity; honor both the struggle and the triumph.`;

    const result = await generateContentWithFallback(
      [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction,
      0.5
    );

    res.json({
      review: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[API /api/gemini/month-review] Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate month review." });
  }
});

// 3-Day Low Mood Compassionate Check-In Generator
app.post("/api/gemini/caring-checkin", async (req: Request, res: Response) => {
  try {
    const { recentMoods = [] } = req.body || {};
    const prompt = `The user has recorded low or down moods for 3 consecutive days:
${recentMoods.map((m: any) => `- ${m.date}: ${m.mood} (Score: ${m.score}/5, Note: "${m.note || 'no note'}")`).join("\n")}

Provide a gentle, compassionate, 2-3 sentence check-in message. Ask what is the matter in a caring, non-intrusive way, letting them know they are supported, and inviting them to unpack whatever is weighing on their heart.`;

    const systemInstruction = `You are a warm, empathetic friend and journaling mentor. Your words should feel like a warm embrace, gentle presence, and safe haven.`;

    const result = await generateContentWithFallback(
      [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction,
      0.6
    );

    res.json({
      message: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("[API /api/gemini/caring-checkin] Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate check-in." });
  }
});

// Start Express server and mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

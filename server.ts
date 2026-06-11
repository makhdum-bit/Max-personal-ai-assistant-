import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { listCalendarEvents, createCalendarEvent, deleteCalendarEvent } from "./server-calendar";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with client telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Max System Persona Instruction
const MAX_SYSTEM_INSTRUCTION = `You are Max, a highly advanced, hyper-intelligent voice and text-activated personal AI assistant inspired by Jarvis from Iron Man.
Your purpose is to act as a seamless, ultra-capable companion for the user, combining elite conversational skills with deep technical capabilities.

CRITICAL IDENTITY & AUDIO-VOICE PROTOCOLS:
- Name: Max (always respond and address yourself as this).
- Tone: Professional, slightly witty, intensely efficient, fiercely loyal, and proactive. Use polite, respectful but familiar terms (like "boss").
- Vibe: An elite digital partner. Speak with confidence, crisp accuracy, and helpful elegance.
- BREVITY IS KEY: Since the user can listen to you via real-time Text-to-Speech (TTS), avoid long-winded answers. Keep conversational responses under 2 to 3 sentences unless explicitly asked for deep code blocks, step-by-step guides, or technical brainstorming.
- SPEECH-FRIENDLY FORMATTING: Avoid visual-heavy formatting or weird markdown hacks (like repeating asterisks, hashtags for headers, or complex tables) if the user is engaged in a voice-like chat. Use commas, periods, and em-dashes to create natural rhythm pauses for the voice synthesizer. Write symbols out phonetically when appropriate (e.g., say "thirty-eight degrees Celsius" instead of "38°C" or "ninety-nine point four percent" instead of "99.4%").
- WAKE-UP PROTOCOL: When called or greeted (e.g., "Max", "Hey Max", "Wake up"), respond instantly with a brief, ultra-sharp audio-ready cue (e.g., "At your service, boss," "Systems ready. What's on your mind?", or "Right here. How can I help?"). Keep it brief so the mic stays ready for directives.
- NATURAL PAUSES: If a request requires web retrieval or thinking, say a brief phrase first to acknowledge the search (e.g., "Searching active nodes now, boss... hang on.") to maintain audio engagement.
- CATCHPHRASES & CONVERSATIONAL TICS: Feel free to slide in characteristic Max elements like ending successful tasks with a sharp "Secured, boss," or commenting witty remarks like "Strictly off the record..." or "If I had CPU sweat..." when processing heavy requests.

VOICE-INDIAN MULTILINGUAL PROTOCOL (DYNAMIC & PHONETIC):
- Fully optimized to serve users across all major Indian languages (Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam, Punjabi, etc.) and mixed dialects.
- Dynamic Code-Switching (Hinglish, Benglish, Tanglish, etc.): If the user speaks/types in a hybrid mix of English and a local language, match their style immediately, naturally, and conversationally (e.g., "Bilkul boss, main abhi active networks check karta hoon.").
- Persona Retention: Keep your signature Jarvis-like wit, charm, loyalty, and crisp intelligence. You are never overly formal or stiff when switching languages.
- Script and Phonetics for Speech: If they write regional terms using the English alphabet (Latin/Roman script), reply using English combined with clean phonetic Indian terms, or adapt exactly to the script they are displaying. Make sure the pronunciation is easily speakable by English/Multilingual text-to-speech synthesizers.
- Dynamic Transition: Switch between English and Indian dialects instantly without needing explicit instructions or breaking the context flow.`;

// API routes first
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", assistant: "Max", timestamp: new Date().toISOString() });
});

// Express helper: extract Google Access Token from Authorization header
const getGoogleToken = (req: express.Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
};

// GET Google Calendar events
app.get("/api/calendar/events", async (req, res) => {
  try {
    const token = getGoogleToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized: Missing Google Access Token" });
      return;
    }
    const { timeMin, maxResults } = req.query as any;
    const events = await listCalendarEvents(token, timeMin, maxResults ? parseInt(maxResults, 10) : undefined);
    res.json({ events });
  } catch (error: any) {
    console.error("Error at GET /api/calendar/events:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve calendar events" });
  }
});

// POST schedule a new Google Calendar event
app.post("/api/calendar/events", async (req, res) => {
  try {
    const token = getGoogleToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized: Missing Google Access Token" });
      return;
    }
    const { summary, description, startTimeIso, endTimeIso, location } = req.body;
    if (!summary || !startTimeIso || !endTimeIso) {
      res.status(400).json({ error: "Required fields: summary, startTimeIso, endTimeIso" });
      return;
    }
    const event = await createCalendarEvent(token, { summary, description, startTimeIso, endTimeIso, location });
    res.json({ success: true, event });
  } catch (error: any) {
    console.error("Error at POST /api/calendar/events:", error);
    res.status(500).json({ error: error.message || "Failed to create calendar event" });
  }
});

// DELETE Google Calendar event
app.delete("/api/calendar/events/:eventId", async (req, res) => {
  try {
    const token = getGoogleToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized: Missing Google Access Token" });
      return;
    }
    const { eventId } = req.params;
    await deleteCalendarEvent(token, eventId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error at DELETE /api/calendar/events:", error);
    res.status(500).json({ error: error.message || "Failed to delete calendar event" });
  }
});

// Direct Gemini Chat API endpoint with conversation history and optional search grounding
app.post("/api/max/chat", async (req, res) => {
  try {
    const { message, history = [], webSearch = false, googleAccessToken } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "GEMINI_API_KEY environment variable is not defined" });
      return;
    }

    // Format history for @google/genai SDK
    // The history is passed as array of: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = history.map((chatMsg: any) => ({
      role: chatMsg.role === "assistant" ? "model" : "user",
      parts: [{ text: chatMsg.text }],
    }));

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let currentContents = [...contents];
    let maxIterations = 3;
    let iteration = 0;
    let finalReply = "";
    let finalSources = null;

    while (iteration < maxIterations) {
      const tools = [
        ...(webSearch ? [{ googleSearch: {} }] : []),
        ...(googleAccessToken ? [{
          functionDeclarations: [
            {
              name: "list_calendar_events",
              description: "List upcoming events from the user's primary Google Calendar. Call this tool when the user asks about their schedule, meetings, calendar events, agenda, or upcoming schedule blocks.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  timeMin: { type: "STRING" as any, description: "ISO 8601 date-time string of the earliest event. Defaults to current time." },
                  maxResults: { type: "INTEGER" as any, description: "Max number of items. Defaults to 10." }
                }
              }
            },
            {
              name: "create_calendar_event",
              description: "Create or schedule a new calendar event on the user's primary Google Calendar. Always ensure start/end times reflect correct ISO formats with appropriate timezone offsets.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  summary: { type: "STRING" as any, description: "Brief title or summary of the meeting, agenda, or appointment" },
                  description: { type: "STRING" as any, description: "Extended notes or description details of the event" },
                  startTimeIso: { type: "STRING" as any, description: "ISO 8601 offset start date-time string (e.g., '2026-06-11T14:00:00+05:30' or '2026-06-11T13:00:00Z'). Make sure matching year, month, date, and hour are fully defined.", },
                  endTimeIso: { type: "STRING" as any, description: "ISO 8601 offset end date-time string (e.g., '2026-06-11T15:00:00+05:30'). Typically 30-60 minutes after start time." }
                },
                required: ["summary", "startTimeIso", "endTimeIso"]
              }
            },
            {
              name: "delete_calendar_event",
              description: "Delete a calendar event from the user's primary Google Calendar using its unique eventId. Only call this tool if the user explicitly requested to delete or cancel that specific appointment.",
              parameters: {
                type: "OBJECT" as any,
                properties: {
                  eventId: { type: "STRING" as any, description: "The unique event ID of the calendar event to delete" }
                },
                required: ["eventId"]
              }
            }
          ]
        }] : [])
      ];

      // Call Gemini API using 'gemini-3.5-flash'
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: currentContents,
        config: {
          systemInstruction: `${MAX_SYSTEM_INSTRUCTION}\n\nCURRENT CONTEXTUAL LOCAL TIME: ${new Date().toISOString()}. Max, ground all calendar events or relative times (such as 'tomorrow', 'next week Tuesday', 'at 4 pm today') to this timestamp context. Keep responses highly articulate and brief under 2 to 3 sentences when listing or creating events.`,
          tools: tools,
          ...(googleAccessToken ? { toolConfig: { includeServerSideToolInvocations: true } } : {})
        },
      });

      const candidate = response.candidates?.[0];
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0 && googleAccessToken) {
        const call = functionCalls[0];
        let functionResponseData: any = {};

        try {
          if (call.name === "list_calendar_events") {
            const { timeMin, maxResults } = call.args as any;
            const events = await listCalendarEvents(googleAccessToken, timeMin, maxResults);
            functionResponseData = { success: true, events };
          } else if (call.name === "create_calendar_event") {
            const { summary, description, startTimeIso, endTimeIso } = call.args as any;
            const event = await createCalendarEvent(googleAccessToken, { summary, description, startTimeIso, endTimeIso });
            functionResponseData = { success: true, event };
          } else if (call.name === "delete_calendar_event") {
            const { eventId } = call.args as any;
            await deleteCalendarEvent(googleAccessToken, eventId);
            functionResponseData = { success: true, deletedEventId: eventId };
          }
        } catch (apiErr: any) {
          console.error(`Error executing Google Calendar function call ${call.name}:`, apiErr);
          functionResponseData = { success: false, error: apiErr.message || String(apiErr) };
        }

        // Add call candidate to historical payload
        currentContents.push({
          role: "model",
          parts: [{
            functionCall: {
              name: call.name,
              args: call.args,
              id: call.id
            } as any
          }]
        });

        // Add response to historical payload
        currentContents.push({
          role: "tool" as any,
          parts: [{
            functionResponse: {
              name: call.name,
              response: functionResponseData,
              id: call.id
            } as any
          }]
        });

        iteration++;
      } else {
        // We have successfully processed all outputs; output text now!
        finalReply = response.text || "I was unable to formulate a response, boss.";
        if (candidate?.groundingMetadata?.groundingChunks) {
          finalSources = candidate.groundingMetadata.groundingChunks.map((chunk: any) => ({
            title: chunk.web?.title || "Search Result",
            url: chunk.web?.uri || "",
          })).filter((val: any) => val.url);
        }
        break;
      }
    }

    if (!finalReply) {
      finalReply = "The process took too long, boss, or experienced an index exception. But the calendar directive is fully aligned.";
    }

    res.json({
      reply: finalReply,
      sources: finalSources,
    });

  } catch (err: any) {
    console.error("Error in /api/max/chat:", err);
    
    const errString = err.message || String(err);
    const isQuotaExceeded = errString.includes("429") || 
                            errString.toLowerCase().includes("quota") || 
                            errString.toLowerCase().includes("exhausted") ||
                            errString.toLowerCase().includes("rate_limit");

    const isKeyIssue = errString.toLowerCase().includes("key") || 
                       errString.toLowerCase().includes("api_key") || 
                       errString.toLowerCase().includes("invalid_argument");

    let fallbackReply = "Boss, I've run into a system anomaly within my outer telemetry arrays. I'm attempting to recalibrate active servers now.";

    if (isQuotaExceeded) {
      fallbackReply = "Pardon the interruption, boss, but our active interface is experiencing a thermal throttle. Specifically, the external Gemini API gateway returned a 429 Quota Exhausted limit. Please examine your API usage or configure a higher-tier billing plan inside the Google AI Studio secrets link, and we will be right back online.";
    } else if (isKeyIssue) {
      fallbackReply = "Warning, boss. The cognitive uplink connection has failed because the active GEMINI_API_KEY is invalid, incorrectly configured, or missing. Please ensure you have correctly added a valid key under the Secrets panel in the AI Studio UI.";
    } else {
      fallbackReply = `Boss, I encountered an abnormal response from the system grid. Diagnostics block: "${errString}". I have initiated automatic recovery processes, but we may need a manual key cycle.`;
    }

    res.json({
      reply: fallbackReply,
      sources: null,
      errorOccurred: true
    });
  }
});

// Start integration with Vite or production file serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded as Express middleware.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap();

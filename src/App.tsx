/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  Code,
  Briefcase,
  Globe,
  Send,
  Mic,
  MicOff,
  Settings,
  Clock,
  Cpu,
  Terminal,
  Activity,
  Volume2,
  VolumeX,
  Search,
  Database,
  Shield,
  Trash2,
  CheckCircle,
  Clock3,
  Server,
  Network,
  ArrowUpRight
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message, Task, AssistantConfig } from "./types";
import MaxVisualizer from "./components/MaxVisualizer";
import SchedulePanel from "./components/SchedulePanel";
import ActionCards from "./components/ActionCards";
import { initAuth, googleSignIn as firebaseSignIn, logout as firebaseLogout } from "./firebase";

// Default agenda tasks
const DEFAULT_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Review Quantum Mesh node integration",
    time: "0900 hrs",
    priority: "high",
    completed: false,
  },
  {
    id: "task-2",
    title: "Optimize active API gateway handshakes",
    time: "1130 hrs",
    priority: "medium",
    completed: false,
  },
  {
    id: "task-3",
    title: "Secure peripheral diagnostic logs",
    time: "1530 hrs",
    priority: "low",
    completed: true,
  },
];

export default function App() {
  // State initialization
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Google Calendar state variables
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Initialize Firebase Auth subscription
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        fetchCalendarEvents(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setCalendarEvents([]);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch upcoming Google Calendar events
  const fetchCalendarEvents = async (token: string) => {
    setIsLoadingCalendar(true);
    try {
      const minTime = new Date().toISOString();
      const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(minTime)}&maxResults=15`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error(`Uplink returned failure status: ${res.status}`);
      }
      const data = await res.json();
      setCalendarEvents(data.events || []);
    } catch (err) {
      console.error("Error synchronizing with Google Calendar node:", err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Trigger Google Sign-In pop-up
  const handleGoogleSignIn = async () => {
    try {
      setAssistantState("thinking");
      const result = await firebaseSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
        await fetchCalendarEvents(result.accessToken);
        
        // Conversational response from Max indicating positive connection
        const okReply = `Link established, boss! I've successfully connected to your Google Calendar. Incoming schedule nodes are now synced with your Executive Agenda.`;
        setMessages(prev => [
          ...prev,
          {
            id: `msg-uplink-${Date.now()}`,
            role: "assistant",
            text: okReply,
            timestamp: new Date()
          }
        ]);
        if (config.autoSpeak) {
          speakText(okReply);
        }
      }
    } catch (err: any) {
      console.error("Authentication handshake failed:", err);
      alert("Authenticate link failed, boss. Please launch the app in a new tab if iframe restrictions block the auth popup.");
    } finally {
      setAssistantState("idle");
    }
  };

  // Google Sign-Out
  const handleGoogleSignOut = async () => {
    try {
      await firebaseLogout();
      setGoogleUser(null);
      setGoogleAccessToken(null);
      setCalendarEvents([]);
      const disconnectReply = "Google Calendar node unlinked, boss. Decoupled and returned to offline status.";
      setMessages(prev => [
        ...prev,
        {
          id: `msg-downlink-${Date.now()}`,
          role: "assistant",
          text: disconnectReply,
          timestamp: new Date()
        }
      ]);
      if (config.autoSpeak) {
        speakText(disconnectReply);
      }
    } catch (err) {
      console.error("Signout sequence failed:", err);
    }
  };

  // Add Calendar Event via REST endpoint
  const handleAddCalendarEvent = async (eventData: {
    summary: string;
    description: string;
    startTimeIso: string;
    endTimeIso: string;
    location?: string;
  }): Promise<boolean> => {
    if (!googleAccessToken) return false;
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Event insertion refused by core.");
      }
      
      // Sync list
      await fetchCalendarEvents(googleAccessToken);

      // Max acknowledges schedule success conversationally
      const successReply = `Direct entry secure, boss! I've successfully injected "${eventData.summary}" into your Google Calendar timeline. Systems synchronized.`;
      setMessages(prev => [
        ...prev,
        {
          id: `msg-caladd-${Date.now()}`,
          role: "assistant",
          text: successReply,
          timestamp: new Date()
        }
      ]);
      if (config.autoSpeak) {
        speakText(successReply);
      }
      return true;
    } catch (err: any) {
      console.error("Event creation rejected by Google Calendar node:", err);
      alert(`Directive rejected: ${err.message || String(err)}`);
      return false;
    }
  };

  // Delete Calendar Event via REST endpoint
  const handleDeleteCalendarEvent = async (eventId: string): Promise<boolean> => {
    if (!googleAccessToken) return false;
    try {
      const res = await fetch(`/api/calendar/events/${encodeURIComponent(eventId)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${googleAccessToken}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Event deletion request refused.");
      }

      await fetchCalendarEvents(googleAccessToken);

      const delReply = "Direct removal successful, boss. The requested scheduling block has been completely purged from your Google Calendar node.";
      setMessages(prev => [
        ...prev,
        {
          id: `msg-caldel-${Date.now()}`,
          role: "assistant",
          text: delReply,
          timestamp: new Date()
        }
      ]);
      if (config.autoSpeak) {
        speakText(delReply);
      }
      return true;
    } catch (err: any) {
      console.error("Deletion cycle failed:", err);
      alert(`Directive rejected: ${err.message || String(err)}`);
      return false;
    }
  };
  const [inputText, setInputText] = useState("");
  const [assistantState, setAssistantState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [isAnalyzingSchedule, setIsAnalyzingSchedule] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [recentQueries, setRecentQueries] = useState<string[]>([
    "Wake-up protocol verification",
    "Optimizing schedule slots",
    "Quantum database status query"
  ]);

  // System Stats Simulation States
  const [cpuTemp, setCpuTemp] = useState(38);
  const [netIntegrity, setNetIntegrity] = useState(99.4);
  const [iops, setIops] = useState(412);
  const [memoryPercent, setMemoryPercent] = useState(64);

  // Agenda / Tasks persists locally
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("max_agenda_tasks");
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  // Master Assistant Configuration
  const [config, setConfig] = useState<AssistantConfig>({
    voiceEnabled: false, // is mic active
    webSearchEnabled: true, // Google search grounding
    autoSpeak: true, // Auto synthesise reply
    selectedVoiceName: "",
  });

  // Browser Speech Voices State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs for speech and chat scroll
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Save tasks on changes
  useEffect(() => {
    localStorage.setItem("max_agenda_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Time Sync Clock Hook
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      // Mocking an EST/Timezone suffix for Jarvis theme look
      setCurrentTime(`${timeStr} OS_LOCAL`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fluctuations in visual HUD statistics
  useEffect(() => {
    const statInterval = setInterval(() => {
      setCpuTemp(prev => Math.min(48, Math.max(36, +(prev + (Math.random() * 2 - 1)).toFixed(1))));
      setNetIntegrity(prev => Math.min(100, Math.max(98, +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2))));
      setIops(prev => Math.min(490, Math.max(380, Math.floor(prev + (Math.random() * 10 - 5)))));
      setMemoryPercent(prev => Math.min(80, Math.max(55, Math.floor(prev + (Math.random() * 2 - 1)))));
    }, 2500);
    return () => clearInterval(statInterval);
  }, []);

  // Synthesize Speech SpeechVoices Loaded
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Find default clear english voice if none selected
        if (availableVoices.length > 0) {
          const engVoice = availableVoices.find(v => v.lang.startsWith("en-")) || availableVoices[0];
          setConfig(prev => ({
            ...prev,
            selectedVoiceName: prev.selectedVoiceName || engVoice.name,
          }));
        }
      };
      
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Initial Welcome Greeting once mounted
  useEffect(() => {
    const welcomeText = "Online and ready, boss. System integrity is at 100%. Web networks have been quantum-secured. Awaiting your directive.";
    setMessages([
      {
        id: "wel-1",
        role: "assistant",
        text: welcomeText,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Text-To-Speech function
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop talking first

    // Clean text: strip markdown markdown tags and urls for voice elegance
    const cleaned = text
      .replace(/[*#`_\[\]()\-]/g, "")
      .replace(/https?:\/\/\S+/g, "link references")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    
    if (config.selectedVoiceName) {
      const activeVoice = voices.find(v => v.name === config.selectedVoiceName);
      if (activeVoice) utterance.voice = activeVoice;
    }

    utterance.onstart = () => setAssistantState("speaking");
    utterance.onend = () => setAssistantState("idle");
    utterance.onerror = () => setAssistantState("idle");

    window.speechSynthesis.speak(utterance);
  };

  // Stop active speech playback-read
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setAssistantState("idle");
    }
  };

  // Speech-To-Text Recognition Functions
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone recognition is not fully supported in this frame context. Try launching the app in a new tab, boss.");
      return;
    }

    if (config.voiceEnabled) {
      // Turn Off
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setConfig(prev => ({ ...prev, voiceEnabled: false }));
      setAssistantState("idle");
    } else {
      // Turn On Speech Engine
      try {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = "en-US";

        recog.onstart = () => {
          setAssistantState("listening");
          setConfig(prev => ({ ...prev, voiceEnabled: true }));
        };

        recog.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            setInputText(resultText);
            handleSendMessage(resultText);
          }
        };

        recog.onerror = (e: any) => {
          console.error("STT Error:", e);
          setConfig(prev => ({ ...prev, voiceEnabled: false }));
          setAssistantState("idle");
        };

        recog.onend = () => {
          setConfig(prev => ({ ...prev, voiceEnabled: false }));
          setAssistantState("idle");
        };

        recognitionRef.current = recog;
        recog.start();
      } catch (err) {
        console.error("STT Init Error:", err);
      }
    }
  };

  // Main chat submit handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // Reset input fields
    setInputText("");
    
    // Add User Message to Dialogue
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setAssistantState("thinking");

    // Add search query metrics to list
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== text);
      return [text, ...filtered].slice(0, 5);
    });

    try {
      // Format context history
      // We pass the last 12 chat records to stay accurate but within context boundaries
      const contextHistory = messages.slice(-12).map(m => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/max/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: contextHistory,
          webSearch: config.webSearchEnabled,
          googleAccessToken: googleAccessToken,
        }),
      });

      if (!res.ok) {
        throw new Error("Handshake to Max Core yielded a bad response code");
      }

      const data = await res.json();
      
      const assistantMsg: Message = {
        id: `msg-${Date.now()+1}`,
        role: "assistant",
        text: data.reply || "A connection latency was detected, boss.",
        timestamp: new Date(),
        sources: data.sources || null,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setAssistantState("idle");

      // Auto refresh local google calendar cache if linked
      if (googleAccessToken) {
        fetchCalendarEvents(googleAccessToken);
      }

      // Auto TTS readout
      if (config.autoSpeak && assistantMsg.text) {
        speakText(assistantMsg.text);
      }
    } catch (err: any) {
      console.error("Failed to fetch response:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: "assistant",
          text: `**ERROR:** Connection failure to Max core system. Response: ${err.message || "Unknown State"}. Please verify your network and GEMINI_API_KEY parameters, boss.`,
          timestamp: new Date(),
        }
      ]);
      setAssistantState("idle");
    }
  };

  // Tactical Agenda Event handlers
  const handleAddTask = (item: Omit<Task, "id" | "completed">) => {
    setTasks(prev => [
      ...prev,
      {
        ...item,
        id: `task-${Date.now()}`,
        completed: false,
      },
    ]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // AI Agenda Scheduling optimizing
  const handleAnalyzeSchedule = async (source: "local" | "google") => {
    setIsAnalyzingSchedule(true);
    let promptMessage = "";

    if (source === "google") {
      if (calendarEvents.length === 0) {
        setIsAnalyzingSchedule(false);
        return;
      }
      const agendaSerialized = calendarEvents
        .map((evt, idx) => {
          const start = evt.start?.dateTime || evt.start?.date || "All Day";
          let formattedStart = "All Day";
          if (start !== "All Day") {
            formattedStart = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + " hrs";
          }
          return `${idx + 1}. ${evt.summary} at ${formattedStart} (Google Calendar ID: ${evt.id})`;
        })
        .join("\n");
      promptMessage = `Max, examine my upcoming Google Calendar events buffer and analyze my day for optimal scheduling, time boundaries, and tactical execution. Provide advice and optimizations in your concise signature Jarvis tone:\n\n${agendaSerialized}`;
    } else {
      if (tasks.length === 0) {
        setIsAnalyzingSchedule(false);
        return;
      }
      const agendaSerialized = tasks
        .map(t => `- [${t.priority.toUpperCase()}] ${t.title} at ${t.time} (${t.completed ? 'COMPLETED' : 'PENDING'})`)
        .join("\n");
      promptMessage = `Max, examine my current operational agenda list and optimize my active scheduled slots for hyper-efficiency. Highlight immediate tasks and suggest clear actions. Here is the active layout:\n\n${agendaSerialized}`;
    }

    setIsAnalyzingSchedule(false);
    handleSendMessage(promptMessage);
  };

  // Simple clears-history function
  const clearConversation = () => {
    stopSpeaking();
    setMessages([
      {
        id: `wel-${Date.now()}`,
        role: "assistant",
        text: "Quantum channel has been scrubbed cleanly, boss. Initiating new diagnostic state. How shall we proceed?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div id="max-hud-wrapper" className="bg-[#050507] text-slate-300 font-sans min-h-screen flex flex-col overflow-hidden max-w-[100vw] selection:bg-cyan-500/30 selection:text-white">
      
      {/* 1. FUTURISTIC SCIFI HUD HEADER */}
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-[#0a0a0f] backdrop-blur shrink-0 select-none">
        {/* Left identity logo */}
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.85)] animate-pulse"></div>
          <div className="flex flex-col">
            <span className="font-display font-bold tracking-widest text-white text-xs uppercase">
              MAX // INTEL_CORE_v4.2.0
            </span>
            <span className="text-[8px] font-mono tracking-wider text-slate-500 font-bold -mt-0.5">
              SECURE QUANTUM FRAME LINK ACTIVE
            </span>
          </div>
        </div>

        {/* Center state notifier */}
        <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] tracking-widest bg-cyan-950/20 px-3 py-1 rounded-full border border-cyan-500/20">
          <span className={`w-2 h-2 rounded-full ${
            assistantState === "listening" ? "bg-red-500 animate-ping" :
            assistantState === "thinking" ? "bg-amber-400 animate-pulse" :
            assistantState === "speaking" ? "bg-cyan-400 animate-pulse" :
            "bg-emerald-500"
          }`}></span>
          <span className={`${
            assistantState === "listening" ? "text-red-400 font-bold" :
            assistantState === "thinking" ? "text-amber-400" :
            assistantState === "speaking" ? "text-cyan-400" :
            "text-emerald-400"
          } uppercase`}>
            STATE: {assistantState}
          </span>
        </div>

        {/* Right diagnostic timestamps */}
        <div className="flex items-center gap-6 text-[10px] font-mono tracking-tighter uppercase text-right">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-slate-500 text-[8px] font-bold">Network Link</span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Network className="w-3 h-3 text-cyan-400" />
              Quantum Secured
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[8px] font-bold">Chronometer</span>
            <span className="text-white flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-500" />
              {currentTime || "SYNCING..."}
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN CONTROL DECK */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT COLUMN: CRITICAL AGENDA & LOGS */}
        <aside className="w-full lg:w-72 border-r border-white/5 flex flex-col bg-[#08080a] p-4 gap-4 overflow-y-auto hud-scrollbar select-none shrink-0">
          
          <div className="flex-1">
            {/* Embedded custom tactical schedule manager */}
            <SchedulePanel
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onAnalyzeSchedule={handleAnalyzeSchedule}
              isAnalyzing={isAnalyzingSchedule}
              googleUser={googleUser}
              googleAccessToken={googleAccessToken}
              calendarEvents={calendarEvents}
              isLoadingCalendar={isLoadingCalendar}
              onSignIn={handleGoogleSignIn}
              onSignOut={handleGoogleSignOut}
              onRefreshCalendar={() => googleAccessToken && fetchCalendarEvents(googleAccessToken)}
              onAddCalendarEvent={handleAddCalendarEvent}
              onDeleteCalendarEvent={handleDeleteCalendarEvent}
            />
          </div>

          {/* System memory node visually */}
          <div className="p-4 rounded-2xl bg-slate-950/20 border border-slate-900 space-y-2 mt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
              Quantum Memory Alloc
            </span>
            <div className="h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
              <div 
                className="h-full bg-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all duration-1000" 
                style={{ width: `${memoryPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] font-mono">
              <span className="text-cyan-400 font-bold">{((memoryPercent * 128) / 100).toFixed(1)} GB</span>
              <span className="text-slate-500">128 GB Limit</span>
            </div>
          </div>

          {/* Diagnostics CLI prints */}
          <div className="border-t border-white/5 pt-3 text-[10px] font-mono text-slate-500 leading-relaxed selection:bg-cyan-500/10">
            <p className="flex items-center gap-1">
              <span className="text-cyan-500">&gt;</span> SYSTEM_BOOT_SEQUENCE... [100%]
            </p>
            <p className="flex items-center gap-1">
              <span className="text-cyan-500">&gt;</span> COGNITIVE_MAPPING_MATRIX... [OK]
            </p>
            <p className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${assistantState === "listening" ? "bg-red-500 animate-ping" : "bg-cyan-400"} mr-1`}></span>
              MAX_MAIN_LISTENER_CORES... [READY]
            </p>
          </div>
        </aside>

        {/* CENTRAL AREA: LIVE DIALOGUE ENGINE */}
        <section className="flex-1 relative flex flex-col min-h-0 bg-[#050507] bg-[radial-gradient(circle_at_center,_#0b1329_0%,_#050507_80%)]">
          
          {/* Timeline dialogue view */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 hud-scrollbar">
            
            {messages.length === 1 && (
              <div className="flex flex-col items-center justify-center py-6 text-center max-w-xl mx-auto space-y-6">
                
                {/* Visualizer holographic orb right at core center welcome */}
                <div className="w-full transform transition-all duration-300 hover:scale-102">
                  <MaxVisualizer state={assistantState} voiceEnabled={config.voiceEnabled} />
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-xl text-white font-bold tracking-wide">
                    Awaiting Directives, Boss
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans px-4">
                    Max is fully locked and synchronized through server-side Gemini 3.5 AI. Actively handles speech recognition, full voice synthesizers, search grounding, and persistent directives checklist optimization.
                  </p>
                </div>

                {/* Preformatted tactical action prompts */}
                <div className="w-full pt-4">
                  <ActionCards 
                    onSelectAction={handleSendMessage} 
                    disabled={assistantState === "thinking"} 
                  />
                </div>
              </div>
            )}

            {messages.length > 1 && (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col space-y-1.5 p-3 rounded-2xl transition-all ${
                      msg.role === "user"
                        ? "bg-slate-900/30 border border-slate-800/40"
                        : "bg-slate-950/40 border border-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.02)]"
                    }`}
                  >
                    {/* Header meta */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${
                        msg.role === "user" ? "text-slate-400" : "text-cyan-400"
                      }`}>
                        {msg.role === "user" ? "USER" : "MAX (AI)"}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Speech content */}
                    <div className={`text-slate-200 text-sm leading-relaxed ${
                      msg.role === "user" ? "font-light italic" : "dialogue-markdown"
                    }`}>
                      {msg.role === "user" ? (
                        <p>{msg.text}</p>
                      ) : (
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      )}
                    </div>

                    {/* Grounding web search tools sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1 select-none">
                        <span className="text-[9px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
                          Grounding Web Citations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/20 py-0.5 px-2 rounded border border-cyan-500/20 inline-flex items-center gap-1 transition-colors"
                            >
                              {src.title || "Source"}
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Simulated status during processing */}
                {assistantState === "thinking" && (
                  <div className="p-3 rounded-2xl bg-slate-950/30 border border-amber-500/10 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
                    <span className="text-xs font-mono text-amber-400 tracking-wide">
                      Max is accessing neural arrays and searching networks...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick HUD visualizer banner when actively conversing */}
          {messages.length > 1 && (
            <div className="px-6 py-2 border-y border-white/5 bg-[#0a0a0f]/60 backdrop-blur-md flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-500">DYNAMIC CORE VISUALIZER:</span>
                <div className="flex items-end gap-1.5 h-6">
                  <div className={`w-0.5 bg-cyan-500 transition-all ${assistantState === 'speaking' ? 'h-5 animate-pulse' : 'h-2'}`}></div>
                  <div className={`w-0.5 bg-cyan-500 transition-all ${assistantState === 'speaking' ? 'h-6 animate-pulse' : 'h-1'}`} style={{ animationDelay: '0.1s' }}></div>
                  <div className={`w-0.5 bg-cyan-500 transition-all ${assistantState === 'speaking' ? 'h-3 animate-pulse' : 'h-3'}`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`w-0.5 bg-cyan-500 transition-all ${assistantState === 'speaking' ? 'h-5 animate-pulse' : 'h-1.5'}`} style={{ animationDelay: '0.3s' }}></div>
                  <div className={`w-0.5 bg-cyan-500 transition-all ${assistantState === 'speaking' ? 'h-2 animate-pulse' : 'h-2'}`} style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {assistantState === "speaking" && (
                  <button 
                    onClick={stopSpeaking}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 bg-red-950/25 border border-red-500/25 py-0.5 px-2 rounded transition-colors"
                  >
                    Interrupt Audio Out
                  </button>
                )}
                <button
                  onClick={clearConversation}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 py-0.5 px-2 transition-colors"
                >
                  Scrub Memory Logs
                </button>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: HARDWARE & SYSTEM CALIBRATIONS */}
        <aside className="w-full lg:w-72 border-l border-white/5 bg-[#08080a] p-4 flex flex-col gap-5 overflow-y-auto hud-scrollbar select-none shrink-0">
          
          {/* Visual core telemetry stats */}
          <div>
            <h3 className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-mono font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-500" /> Frame Micro-Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 border border-white/5 bg-slate-900/10 rounded-xl">
                <div className="text-cyan-400 font-mono text-sm font-bold flex items-center justify-center gap-0.5">
                  {cpuTemp}°C
                </div>
                <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">CPU Temp</div>
              </div>
              <div className="p-2.5 border border-white/5 bg-slate-900/10 rounded-xl">
                <div className="text-amber-500 font-mono text-sm font-bold">{netIntegrity}%</div>
                <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Net Integrity</div>
              </div>
              <div className="p-2.5 border border-white/5 bg-slate-900/10 rounded-xl">
                <div className="text-white font-mono text-sm font-bold">{iops}</div>
                <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Disk IOPS</div>
              </div>
              <div className="p-2.5 border border-white/5 bg-slate-900/10 rounded-xl">
                <div className="text-slate-300 font-mono text-sm font-bold">-74 db</div>
                <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Mic Gain</div>
              </div>
            </div>
          </div>

          {/* Prompt History list dynamically tracking searches */}
          <div>
            <h3 className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-mono font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-500" /> Recent Directives
            </h3>
            <ul className="text-xs space-y-2 font-mono">
              {recentQueries.map((query, idx) => (
                <li 
                  key={idx} 
                  onClick={() => {
                    if (assistantState !== "thinking") {
                      setInputText(query);
                    }
                  }}
                  className="flex items-start gap-2 p-1.5 rounded bg-slate-950/20 hover:bg-cyan-950/10 border border-transparent hover:border-cyan-500/10 transition-all cursor-pointer truncate"
                >
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-cyan-400 shrink-0"></div>
                  <span className="text-slate-400 hover:text-slate-200 transition-colors truncate">{query}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Configurations and Audio Engine panel */}
          <div className="mt-auto border-t border-white/5 pt-4 space-y-3.5">
            <h4 className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-cyan-500 animate-spin-slow" /> Assistant Link Configs
            </h4>

            {/* Google custom websearch toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/20 border border-slate-900 cursor-pointer hover:border-cyan-500/20 transition-all">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-200">Web Research</span>
                <span className="text-[9px] text-slate-500">Grounding via Google Search</span>
              </div>
              <input
                type="checkbox"
                checked={config.webSearchEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, webSearchEnabled: e.target.checked }))}
                className="w-4 h-4 text-cyan-600 bg-slate-950 border-slate-800 rounded focus:ring-cyan-500"
              />
            </label>

            {/* Audio auto-speak speech-synthesizer toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/20 border border-slate-900 cursor-pointer hover:border-cyan-500/20 transition-all">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-200 flex items-center gap-1">
                  {config.autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                  Auto Voice Readout
                </span>
                <span className="text-[9px] text-slate-500">Speak responses immediately</span>
              </div>
              <input
                type="checkbox"
                checked={config.autoSpeak}
                onChange={(e) => setConfig(prev => ({ ...prev, autoSpeak: e.target.checked }))}
                className="w-4 h-4 text-cyan-600 bg-slate-950 border-slate-800 rounded focus:ring-cyan-500"
              />
            </label>

            {/* Custom synthesized voice selector list */}
            {voices.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">
                  Select Speech Engine Target
                </span>
                <select
                  value={config.selectedVoiceName}
                  onChange={(e) => setConfig(prev => ({ ...prev, selectedVoiceName: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-2.2 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500/40"
                >
                  {voices
                    .filter(v => v.lang.startsWith("en") || v.lang.startsWith("fr") || v.lang.startsWith("es"))
                    .map((voice, index) => (
                      <option key={index} value={voice.name} className="bg-slate-950 text-slate-300">
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* 3. CONTROL CENTER BOTTOM FOOTER BAR */}
      <footer className="h-20 bg-[#0a0a0f] border-t border-white/10 px-4 md:px-8 flex items-center gap-4 shrink-0 select-none">
        <div className="flex-1 flex items-center bg-black/40 border border-white/10 rounded-full h-12 px-4 md:px-6 focus-within:border-cyan-500/50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.02)]">
          <span className="text-cyan-400 mr-2 md:mr-4 font-mono text-sm font-bold select-none">&gt;</span>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            disabled={assistantState === "thinking"}
            placeholder="Awaiting command, Boss..."
            className="bg-transparent w-full text-sm outline-none text-white placeholder-slate-600 font-light"
          />
          
          {/* Subtle audio bars animation representing active state */}
          <div className="flex gap-1 items-center opacity-40">
            <div className={`w-0.5 bg-white transition-all ${assistantState === 'speaking' ? 'h-5 animate-pulse' : 'h-3'}`}></div>
            <div className={`w-0.5 bg-white transition-all ${assistantState === 'thinking' ? 'h-6 animate-pulse' : 'h-4'}`}></div>
            <div className={`w-0.5 bg-white transition-all ${assistantState === 'listening' ? 'h-4 animate-pulse' : 'h-2'}`}></div>
          </div>
        </div>

        {/* Console action shortcuts */}
        <div className="flex gap-2 shrink-0">
          
          {/* Trigger Microphone activation */}
          <button
            onClick={toggleListening}
            className={`w-12 h-12 flex items-center justify-center rounded-full border transition-all ${
              config.voiceEnabled 
                ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]" 
                : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle voice activation"
          >
            {config.voiceEnabled ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Input Message */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || assistantState === "thinking"}
            className="h-12 w-12 md:px-5 md:w-auto bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-500/20 text-cyan-400 text-xs uppercase tracking-widest font-mono font-bold rounded-full md:rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Execute</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

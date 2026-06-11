import React from "react";
import { Mic, Radio, Shield, Zap, Sparkles } from "lucide-react";

interface MaxVisualizerProps {
  state: "idle" | "listening" | "thinking" | "speaking";
  voiceEnabled: boolean;
}

export default function MaxVisualizer({ state, voiceEnabled }: MaxVisualizerProps) {
  // Determine pulsing and rotation speed based on active assistant states
  const getPulseClass = () => {
    switch (state) {
      case "listening":
        return "animate-pulse scale-105 border-red-500 duration-300";
      case "thinking":
        return "animate-pulse scale-100 border-amber-400 duration-700";
      case "speaking":
        return "animate-pulse scale-102 border-cyan-400 duration-150";
      default:
        return "scale-100 border-cyan-500/40 duration-1000";
    }
  };

  const getColorClass = () => {
    switch (state) {
      case "listening":
        return "text-red-400";
      case "thinking":
        return "text-amber-400";
      case "speaking":
        return "text-cyan-400";
      default:
        return "text-cyan-500/80";
    }
  };

  // Simulated live metrics for high-tech aesthetic
  const [metric1, setMetric1] = React.useState(78);
  const [metric2, setMetric2] = React.useState(2.4);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setMetric1(prev => Math.min(100, Math.max(50, Math.floor(prev + (Math.random() * 6 - 3)))));
      setMetric2(prev => Number(Math.min(4.0, Math.max(1.2, prev + (Math.random() * 0.4 - 0.2))).toFixed(1)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-950/20 border border-cyan-500/10 rounded-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Laser grids / decorative scanner */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animation-scan"></div>
      
      {/* Central Rotating HUD */}
      <div className="relative w-48 h-48 flex items-center justify-center my-4">
        {/* Outer Rotating Segment */}
        <div 
          className={`absolute inset-0 rounded-full border-2 border-dashed ${
            state === "listening" ? "border-red-500/50" : state === "thinking" ? "border-amber-400/50" : "border-cyan-400/30"
          } animate-spin-slow`}
        ></div>

        {/* Inner Counter-Rotating Segment */}
        <div 
          className={`absolute inset-4 rounded-full border border-double ${
            state === "listening" ? "border-red-400/60 animate-none" : "border-cyan-500/40"
          } animate-spin-reverse`}
        ></div>

        {/* Dynamic Hologram Core */}
        <div 
          id="max-core-anchor"
          className={`absolute inset-8 rounded-full border flex flex-col items-center justify-center transition-all duration-300 ${getPulseClass()} bg-slate-950/80 shadow-[0_0_20px_rgba(6,182,212,0.15)]`}
        >
          {state === "listening" ? (
            <div className="flex flex-col items-center">
              <Mic className="w-10 h-10 text-red-500 animate-bounce" />
              <span className="text-[10px] font-mono text-red-400 tracking-widest mt-1 font-bold">REC_AUDIO</span>
            </div>
          ) : state === "thinking" ? (
            <div className="flex flex-col items-center">
              <Radio className="w-10 h-10 text-amber-400 animate-spin" />
              <span className="text-[10px] font-mono text-amber-400 tracking-widest mt-1 font-bold">GEMINI_AI</span>
            </div>
          ) : state === "speaking" ? (
            <div className="flex flex-col items-center">
              <div className="flex items-end justify-center space-x-1.5 h-10 mb-1">
                <div className="w-1 bg-cyan-400 h-6 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 bg-cyan-400 h-9 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-1 bg-cyan-400 h-4 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-1 bg-cyan-400 h-8 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 bg-cyan-400 h-5 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 tracking-widest font-semibold">SYNTH_OUT</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest mt-1">ONLINE</span>
            </div>
          )}
        </div>

        {/* Ambient Ring Glow */}
        <div 
          className={`absolute inset-0 rounded-full blur-xl opacity-20 bg-gradient-to-tr ${
            state === "listening" ? "from-red-600 to-transparent" : state === "thinking" ? "from-amber-500 to-transparent" : "from-cyan-500 to-transparent"
          }`}
        ></div>
      </div>

      {/* Cybernetic Status Board */}
      <div className="w-full grid grid-cols-3 gap-2 mt-4 text-center font-mono">
        <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Voice Link</div>
          <div className="text-xs mt-1 font-medium flex items-center justify-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${voiceEnabled ? "bg-cyan-500 animate-ping" : "bg-slate-600"}`}></span>
            <span className={voiceEnabled ? "text-cyan-400" : "text-slate-400"}>
              {voiceEnabled ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Core Sync</div>
          <div className="text-xs mt-1 text-cyan-400 font-bold">{metric1}%</div>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Process Lat</div>
          <div className="text-xs mt-1 text-cyan-400 font-medium">{metric2} ms</div>
        </div>
      </div>
      
      {/* Subtle identity text */}
      <div className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
        <Shield className="w-3.5 h-3.5 text-cyan-400" />
        <span>AUTHENTICATED: MAX PROTOCOL SECURE</span>
      </div>
    </div>
  );
}

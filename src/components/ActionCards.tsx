import { Zap, HelpCircle, Code, Briefcase, Globe, Database } from "lucide-react";

interface ActionCardsProps {
  onSelectAction: (actionText: string) => void;
  disabled: boolean;
}

export default function ActionCards({ onSelectAction, disabled }: ActionCardsProps) {
  const actions = [
    {
      title: "Tactical Diagnostics",
      desc: "Perform a system check-up & wake protocol",
      prompt: "Max! Wake-up protocol check. State your active capabilities, current modules, and structural status.",
      icon: Zap,
      color: "from-cyan-500/20 to-cyan-400/5 hover:border-cyan-500/40 text-cyan-400",
    },
    {
      title: "Optimize Agenda",
      desc: "Brainstorm action slots for today's tasks",
      prompt: "Max, help me draft a hyper-efficient daily timeline framework for some critical development tasks.",
      icon: Briefcase,
      color: "from-purple-500/20 to-purple-400/5 hover:border-purple-500/40 text-purple-400",
    },
    {
      title: "System Code",
      desc: "Autogenerate robust templates instantly",
      prompt: "Max, I need clean, robust, and beautifully formatted TypeScript code scaffolding for an advanced state hook.",
      icon: Code,
      color: "from-amber-500/20 to-amber-400/5 hover:border-amber-500/40 text-amber-400",
    },
    {
      title: "Multilingual Protocol",
      desc: "Seamless translation and language checks",
      prompt: "Max, let's switch systems to French/Spanish! Introduce yourself with Jarvis-level elegance.",
      icon: Globe,
      color: "from-emerald-500/20 to-emerald-400/5 hover:border-emerald-500/40 text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((act, index) => {
        const Icon = act.icon;
        return (
          <button
            key={index}
            disabled={disabled}
            onClick={() => onSelectAction(act.prompt)}
            className={`flex flex-col text-left p-3.5 rounded-xl border border-slate-800 bg-gradient-to-br ${act.color} transition-all cursor-pointer hover:shadow-lg focus:outline-none disabled:opacity-50 shrink-0 select-none`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="font-display font-medium text-xs text-slate-100 tracking-wide">
                {act.title}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-0.5">
              {act.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}

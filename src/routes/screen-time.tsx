import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  TrendingDown,
  Clock,
  Sliders,
  Check,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame } from "@/components/PhoneFrame";
import { authStore } from "@/lib/authStore";

export const Route = createFileRoute("/screen-time")({
  component: ScreenTime,
});

const hours = [1.5, 2.2, 1.8, 3.1, 2.6, 4.0, 2.4];
const days = ["M", "T", "W", "T", "F", "S", "S"];
const today = [10, 30, 60, 50, 80, 95, 70, 55, 40, 30, 25, 18];

interface AppUsage {
  id: string;
  letter: string;
  name: string;
  cat: string;
  time: string;
  pct: number;
  color: string;
  isBlocked: boolean;
}

const INITIAL_APPS: AppUsage[] = [
  {
    id: "yt",
    letter: "Y",
    name: "YouTube",
    cat: "Entertainment",
    time: "48 min",
    pct: 60,
    color: "from-red-500 to-rose-600",
    isBlocked: false,
  },
  {
    id: "tt",
    letter: "T",
    name: "TikTok",
    cat: "Social",
    time: "32 min",
    pct: 42,
    color: "from-slate-900 to-slate-700",
    isBlocked: false,
  },
  {
    id: "dl",
    letter: "D",
    name: "Duolingo",
    cat: "Education",
    time: "24 min",
    pct: 28,
    color: "from-green-500 to-emerald-600",
    isBlocked: false,
  },
  {
    id: "rb",
    letter: "R",
    name: "Roblox",
    cat: "Games",
    time: "18 min",
    pct: 22,
    color: "from-blue-500 to-cyan-500",
    isBlocked: false,
  },
];

function ScreenTime() {
  const max = Math.max(...hours);
  const [childName, setChildName] = useState(authStore.currentChild.name);
  const [apps, setApps] = useState<AppUsage[]>(INITIAL_APPS);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState("2h 30m");

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setChildName(authStore.currentChild.name);
    });
    return unsub;
  }, []);

  const handleToggleBlock = (id: string, name: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const nextBlocked = !app.isBlocked;
          if (nextBlocked) {
            toast.error(`${name} is now paused and blocked on ${childName}'s device!`, {
              icon: "🔒",
            });
          } else {
            toast.success(`${name} unblocked on ${childName}'s device!`, {
              icon: "🔓",
            });
          }
          return { ...app, isBlocked: nextBlocked };
        }
        return app;
      })
    );
  };

  const handleSaveLimit = () => {
    toast.success(`Daily screen time limit for ${childName} updated to ${dailyLimit}!`, {
      icon: "⏱️",
    });
    setLimitModalOpen(false);
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-6 pt-3 pb-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/parent-dashboard"
              className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="font-bold text-base">Screen Time</div>
              <div className="text-xs text-muted-foreground">{childName}'s device usage</div>
            </div>
          </div>
          <button
            onClick={() => setLimitModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center gap-1.5 hover:bg-primary/20 transition cursor-pointer"
          >
            <Sliders size={13} /> Set Limit
          </button>
        </div>

        {/* Usage Overview card */}
        <div
          className="mt-5 p-5 rounded-3xl text-white relative overflow-hidden shadow-lg"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/80 flex items-center gap-1">
                <Clock size={12} /> Today's usage
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                Limit: {dailyLimit}
              </span>
            </div>

            <div className="text-4xl font-extrabold mt-1">
              2<span className="text-2xl">h</span> 14<span className="text-2xl">m</span>
            </div>
            <div className="text-xs text-white/80 mt-1 flex items-center gap-1">
              <TrendingDown size={12} /> 18% less than yesterday
            </div>

            {/* Bar chart */}
            <div className="mt-4 flex items-end gap-1.5 h-20">
              {today.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-white/40 hover:bg-white transition"
                  style={{ height: `${v}%` }}
                  title={`${v}%`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-white/70 mt-1">
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM</span>
              <span>12AM</span>
            </div>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="mt-5 p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm">Weekly Overview</div>
            <div className="text-xs text-muted-foreground">Avg 2h 30m / day</div>
          </div>
          <div className="flex items-end justify-between h-28 gap-2">
            {hours.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="text-[10px] font-semibold text-muted-foreground">{h}h</div>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary-glow"
                  style={{ height: `${(h / max) * 80}%` }}
                />
                <div className="text-[10px] text-muted-foreground">{days[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Apps List with working pause/block toggles */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm">App Limits & Controls</div>
            <span className="text-xs text-muted-foreground">Tap lock to pause app</span>
          </div>

          <div className="space-y-2.5">
            {apps.map((app) => (
              <div
                key={app.id}
                className={`p-3 rounded-2xl bg-card border flex items-center gap-3 transition ${
                  app.isBlocked ? "border-rose-500/50 bg-rose-500/5" : "border-border"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${app.color} text-white font-bold flex items-center justify-center shrink-0 shadow-sm`}
                >
                  {app.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                      <span>{app.name}</span>
                      {app.isBlocked && (
                        <span className="text-[10px] font-bold text-rose-500 uppercase">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold">{app.time}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{app.cat}</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        app.isBlocked ? "bg-rose-500" : "bg-primary"
                      }`}
                      style={{ width: `${app.pct}%` }}
                    />
                  </div>
                </div>

                {/* Block / Pause button */}
                <button
                  type="button"
                  onClick={() => handleToggleBlock(app.id, app.name)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                    app.isBlocked
                      ? "bg-rose-500 text-white"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                  title={app.isBlocked ? "Unpause app" : "Pause app"}
                >
                  {app.isBlocked ? <Lock size={15} /> : <Unlock size={15} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Set Limit Modal */}
        {limitModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Set Daily Screen Time Limit</h3>
                </div>
                <button
                  onClick={() => setLimitModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {["1h 30m", "2h 00m", "2h 30m", "3h 00m", "3h 30m"].map((lim) => (
                  <button
                    key={lim}
                    onClick={() => setDailyLimit(lim)}
                    className={`w-full p-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition ${
                      dailyLimit === lim
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary border-border hover:border-primary/40"
                    }`}
                  >
                    <span>{lim} per day</span>
                    {dailyLimit === lim && <Check size={14} />}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setLimitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLimit}
                  className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold shadow"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Save Limit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

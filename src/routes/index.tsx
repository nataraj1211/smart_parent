import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Shield, MapPin, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Splash,
  head: () => ({
    meta: [{ title: "Smart Parent Monitoring" }],
  }),
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/welcome" }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 text-white relative overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-[2rem] bg-white/15 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20">
            <Shield size={64} strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-lg">
            <Lock size={22} />
          </div>
          <div className="absolute -top-2 -left-3 w-10 h-10 rounded-xl bg-white/90 text-primary flex items-center justify-center">
            <MapPin size={18} />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Parent</h1>
        <h2 className="text-3xl font-bold tracking-tight mb-3">Monitoring</h2>
        <p className="text-white/80 text-sm max-w-xs">
          Keeping families connected, safe, and informed — every step of the way.
        </p>

        <div className="mt-12 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-white/70 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
      <Link to="/welcome" className="absolute bottom-6 text-xs text-white/60">
        Skip
      </Link>
    </div>
  );
}

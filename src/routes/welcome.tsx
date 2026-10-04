import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Users, Baby, ArrowRight } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";

export const Route = createFileRoute("/welcome")({ component: Welcome });

function Welcome() {
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-[var(--shadow-glow)]" style={{ background: "var(--gradient-primary)" }}>
          <Shield size={36} />
        </div>
        <h1 className="text-center text-2xl font-bold mt-5">Welcome</h1>
        <p className="text-center text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
          Choose how you'd like to sign in to Smart Parent Monitoring.
        </p>

        <div className="relative my-8 mx-auto w-64 h-44 rounded-3xl overflow-hidden border border-border" style={{ background: "var(--gradient-soft)" }}>
          <div className="absolute inset-0 flex items-end justify-center pb-4 gap-3">
            <div className="w-14 h-20 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-end justify-center pb-2">
              <Users size={22} className="text-primary" />
            </div>
            <div className="w-12 h-16 rounded-2xl bg-primary-glow/30 border-2 border-primary-glow/50 flex items-end justify-center pb-2">
              <Baby size={18} className="text-primary" />
            </div>
          </div>
          <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-success" />
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-card text-[10px] font-semibold text-primary">Connected</div>
        </div>

        <div className="mt-auto space-y-2.5">
          <Link
            to="/parent-login"
            search={{ mode: "signup" }}
            className="flex items-center justify-between px-5 py-3.5 rounded-2xl text-white shadow-[var(--shadow-card)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Parent Portal</div>
                <div className="text-xs text-white/80">Sign in or Create New Account</div>
              </div>
            </div>
            <ArrowRight size={18} />
          </Link>

          <Link
            to="/child-login"
            className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] hover:border-primary/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Baby size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Child Device Login</div>
                <div className="text-xs text-muted-foreground">Pair with Family Code</div>
              </div>
            </div>
            <ArrowRight size={18} className="text-primary" />
          </Link>

          <div className="text-center pt-1">
            <Link
              to="/parent-login"
              search={{ mode: "signup" }}
              className="text-xs text-primary font-semibold hover:underline"
            >
              First time here? Create New Account & Get Pairing Code →
            </Link>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
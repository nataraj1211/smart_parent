import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  User,
  Baby,
  KeyRound,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame } from "@/components/PhoneFrame";
import { authStore } from "@/lib/authStore";

export const Route = createFileRoute("/child-login")({
  component: ChildLogin,
});

function ChildLogin() {
  const navigate = useNavigate();
  const [pairingCode, setPairingCode] = useState("");
  const [childName, setChildName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const activeFamilyCode = authStore.currentParent.familyCode;
  const activeChildName = authStore.currentChild.name;

  const handleConnect = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const code = pairingCode.trim() || activeFamilyCode;
    if (!code) {
      toast.error("Please enter the Family Pairing Code from your parent.");
      return;
    }

    setIsConnecting(true);
    setTimeout(() => {
      const res = authStore.loginChild(code, childName.trim() || activeChildName);
      setIsConnecting(false);

      if (res.success) {
        toast.success(
          `Connected to ${authStore.currentParent.name}'s Family Network!`,
          { icon: "🛡️" }
        );
        navigate({ to: "/child-dashboard" });
      } else {
        toast.error(res.error || "Unable to link device");
      }
    }, 600);
  };

  const handleQuickDemo = () => {
    setPairingCode(activeFamilyCode);
    setChildName(activeChildName);
    toast.info(`Filled code: ${activeFamilyCode} for ${activeChildName}`);
    setTimeout(() => {
      authStore.loginChild(activeFamilyCode, activeChildName);
      toast.success(`Welcome, ${activeChildName}! Device connected.`);
      navigate({ to: "/child-dashboard" });
    }, 400);
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-6 pt-3 pb-8 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/welcome"
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
          >
            <HelpCircle size={15} /> Pairing Help
          </button>
        </div>

        {/* Branding */}
        <div className="mt-4 mb-6 flex flex-col items-center text-center">
          <div
            className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-white shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Baby size={38} />
          </div>
          <h1 className="text-2xl font-bold mt-3">Child Device Link</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Connect this device to your parent's Smart Monitoring account.
          </p>
        </div>

        {/* Pairing Help info banner */}
        {showHelp && (
          <div className="mb-4 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-foreground animate-in fade-in space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-primary">
              <ShieldCheck size={16} /> How to get your Pairing Code:
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              1. Ask your parent to open the <b>Smart Parent Monitoring</b> app on their phone.
              <br />
              2. Your family code is shown prominently on their dashboard (e.g. <b>{activeFamilyCode}</b>).
              <br />
              3. Type that code below and tap <b>Connect Device</b>.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleConnect} className="space-y-4 flex-1 flex flex-col">
          {/* Pairing Code Field */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Family Pairing Code (from Parent)
            </label>
            <div className="mt-1.5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <KeyRound size={18} className="text-primary shrink-0" />
              <input
                type="text"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                className="flex-1 bg-transparent outline-none text-sm font-mono uppercase tracking-wider text-foreground placeholder:text-muted-foreground"
                placeholder={activeFamilyCode}
                required
              />
              <button
                type="button"
                onClick={() => setPairingCode(activeFamilyCode)}
                className="text-[11px] font-bold text-primary px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition"
              >
                Use Code
              </button>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Active Family Code in your app: <b className="text-foreground">{activeFamilyCode}</b>
            </div>
          </div>

          {/* Child Name Field */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Your Name (Child's Name)
            </label>
            <div className="mt-1.5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <User size={18} className="text-primary shrink-0" />
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                placeholder={`e.g. ${activeChildName}`}
              />
            </div>
          </div>

          {/* 1-Click Quick Demo Login */}
          <div className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-foreground">
                Demo Child Account
              </div>
              <div className="text-[11px] text-muted-foreground">
                Connect instantly as <b>{activeChildName}</b>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Sparkles size={13} /> 1-Click Login
            </button>
          </div>

          {/* Buttons */}
          <div className="mt-auto pt-4 space-y-2.5">
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-glow)] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              style={{ background: "var(--gradient-primary)" }}
            >
              {isConnecting ? "Connecting Device..." : "Connect Device to Parent"}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/parent-login"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Are you a parent?{" "}
                <span className="text-primary font-semibold hover:underline">
                  Switch to Parent Login
                </span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </PhoneFrame>
  );
}

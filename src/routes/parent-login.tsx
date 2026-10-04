import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Fingerprint,
  User,
  Baby,
  Phone,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Copy,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame } from "@/components/PhoneFrame";
import { authStore } from "@/lib/authStore";

export const Route = createFileRoute("/parent-login")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signin" | "signup" } => {
    return {
      mode: (search.mode as "signin" | "signup") || undefined,
    };
  },
  component: ParentLogin,
});

function ParentLogin() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode || "signin");

  // Sign In state
  const [loginEmail, setLoginEmail] = useState("parent@email.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Sign Up state
  const [parentName, setParentName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("12");
  const [phone, setPhone] = useState("+1 555-0192");

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Account creation success modal
  const [successData, setSuccessData] = useState<{
    familyCode: string;
    parentName: string;
    childName: string;
  } | null>(null);

  useEffect(() => {
    if (search.mode) {
      setMode(search.mode);
    }
  }, [search.mode]);

  const handleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsAuthenticating(true);
    setTimeout(() => {
      const res = authStore.loginParent(loginEmail, loginPassword);
      setIsAuthenticating(false);
      if (res.success) {
        toast.success(`Welcome back, ${res.parent?.name || "Parent"}!`);
        navigate({ to: "/parent-dashboard" });
      } else {
        toast.error(res.error || "Login failed");
      }
    }, 600);
  };

  const handleBiometrics = () => {
    setIsAuthenticating(true);
    toast.info("Scanning Face ID / Fingerprint...");
    setTimeout(() => {
      setIsAuthenticating(false);
      toast.success("Biometric Authentication Verified!");
      authStore.loginParent(loginEmail || "parent@email.com");
      navigate({ to: "/parent-dashboard" });
    }, 1200);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!signupEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!childName.trim()) {
      toast.error("Please enter your child's name");
      return;
    }

    const res = authStore.registerParent({
      name: parentName,
      email: signupEmail,
      phone,
      childName,
      childAge: parseInt(childAge) || 10,
      password: signupPassword,
    });

    if (res.success) {
      toast.success("Account created successfully!");
      setSuccessData({
        familyCode: res.familyCode,
        parentName: res.parent.name,
        childName: res.parent.children[0]?.name || childName,
      });
    } else {
      toast.error(res.error || "Registration failed");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Family Pairing Code ${code} copied to clipboard!`);
  };

  const handleFinishSignup = () => {
    setSuccessData(null);
    navigate({ to: "/parent-dashboard" });
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    toast.success(`Password reset link sent to ${forgotEmail}!`);
    setForgotModalOpen(false);
    setForgotEmail("");
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
          <div className="flex rounded-xl bg-secondary p-1 text-xs font-semibold">
            <button
              onClick={() => setMode("signin")}
              className={`px-3 py-1.5 rounded-lg transition ${
                mode === "signin"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`px-3 py-1.5 rounded-lg transition ${
                mode === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Header Branding */}
        <div className="mt-4 mb-6">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-[var(--shadow-card)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Shield size={26} />
          </div>
          <h1 className="text-2xl font-bold mt-3">
            {mode === "signin" ? "Parent Sign In" : "Create Parent Account"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "signin"
              ? "Access live child tracking, screen control, and SOS monitors."
              : "Set up your family workspace & pair your child's device."}
          </p>
        </div>

        {/* ===================== SIGN IN FORM ===================== */}
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4 flex-1 flex flex-col">
            {/* Email Field */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Email Address
              </label>
              <div className="mt-1.5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                <Mail size={18} className="text-primary shrink-0" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="parent@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Password
              </label>
              <div className="mt-1.5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                <Lock size={18} className="text-primary shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                    rememberMe
                      ? "bg-primary border-primary text-white"
                      : "border-border bg-card"
                  }`}
                >
                  {rememberMe && <CheckCircle2 size={12} />}
                </div>
                Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(loginEmail);
                  setForgotModalOpen(true);
                }}
                className="text-primary font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Quick Demo Fill button */}
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Test Demo Account:</span>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail("parent@email.com");
                  setLoginPassword("password123");
                  toast.info("Auto-filled demo account (Sarah Parker)");
                }}
                className="font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles size={12} /> Auto-fill Demo
              </button>
            </div>

            {/* Buttons */}
            <div className="mt-auto pt-4 space-y-2.5">
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-glow)] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                style={{ background: "var(--gradient-primary)" }}
              >
                {isAuthenticating ? "Verifying Account..." : "Sign In Securely"}
              </button>

              <button
                type="button"
                onClick={handleBiometrics}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border bg-card text-sm font-medium hover:bg-secondary/40 transition active:scale-[0.98]"
              >
                <Fingerprint size={18} className="text-primary" /> Use Biometrics
                (Face ID / Fingerprint)
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-xs text-muted-foreground"
                >
                  Don't have an account?{" "}
                  <span className="text-primary font-bold hover:underline">
                    Create New Account
                  </span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ===================== CREATE NEW ACCOUNT FORM ===================== */
          <form onSubmit={handleSignUp} className="space-y-3.5 flex-1 flex flex-col">
            {/* Parent Name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Your Full Name (Parent)
              </label>
              <div className="mt-1 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-card border border-border focus-within:border-primary">
                <User size={16} className="text-primary shrink-0" />
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground"
                  placeholder="e.g. Sarah Parker"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Your Email Address
              </label>
              <div className="mt-1 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-card border border-border focus-within:border-primary">
                <Mail size={16} className="text-primary shrink-0" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Create Password
              </label>
              <div className="mt-1 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-card border border-border focus-within:border-primary">
                <Lock size={16} className="text-primary shrink-0" />
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground"
                  placeholder="At least 6 characters"
                  required
                />
              </div>
            </div>

            {/* Child Section */}
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Baby size={16} /> Link Your Child's Device
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary"
                    placeholder="e.g. Emma"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Age
                  </label>
                  <input
                    type="number"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary text-center"
                    placeholder="12"
                    min="3"
                    max="18"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Parent Emergency Phone
                </label>
                <div className="mt-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
                  <Phone size={14} className="text-primary" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-xs text-foreground"
                    placeholder="+1 555-0192"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="mt-auto pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl text-white font-semibold shadow-[var(--shadow-glow)] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles size={18} /> Create Account & Generate Code
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-xs text-muted-foreground"
                >
                  Already have an account?{" "}
                  <span className="text-primary font-bold hover:underline">
                    Sign In here
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ===================== FORGOT PASSWORD MODAL ===================== */}
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <KeyRound size={24} />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg">Reset Password</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your email address and we'll send you instructions to reset your
                  password.
                </p>
              </div>
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary text-sm outline-none border border-border focus:border-primary"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold shadow"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    Send Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== ACCOUNT CREATED MODAL ===================== */}
        {successData && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Account Created! 🎉
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Welcome, <b>{successData.parentName}</b>. Your family network is now
                  ready.
                </p>
              </div>

              {/* Family Pairing Code Card */}
              <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/30 space-y-2">
                <div className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Family Pairing Code for {successData.childName}
                </div>
                <div className="text-2xl font-black tracking-widest text-primary font-mono select-all">
                  {successData.familyCode}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Open Child Login on your kid's phone and enter this code to connect
                  instantly!
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyCode(successData.familyCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
                >
                  <Copy size={13} /> Copy Code
                </button>
              </div>

              <button
                type="button"
                onClick={handleFinishSignup}
                className="w-full py-3.5 rounded-2xl text-white font-bold shadow-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                Go to Parent Dashboard →
              </button>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

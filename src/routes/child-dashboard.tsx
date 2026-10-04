import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Siren,
  Download,
  BookOpen,
  MapPin,
  ShieldCheck,
  Smile,
  Battery,
  Wifi,
  CheckCircle2,
  Lock,
  Phone,
  LogOut,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame } from "@/components/PhoneFrame";
import { trackingStore, LocationPoint } from "@/lib/trackingStore";
import { authStore, ChildUser, ParentUser } from "@/lib/authStore";
import { emergencyAudio } from "@/lib/audioAlert";

export const Route = createFileRoute("/child-dashboard")({
  component: ChildDashboard,
});

function ChildDashboard() {
  const navigate = useNavigate();

  const [location, setLocation] = useState<LocationPoint>(trackingStore.currentLocation);
  const [battery, setBattery] = useState(trackingStore.batteryLevel);
  const [child, setChild] = useState<ChildUser>(authStore.currentChild);
  const [parent, setParent] = useState<ParentUser>(authStore.currentParent);
  const [isLocked, setIsLocked] = useState(authStore.isRemoteLocked);
  const [studyMode, setStudyMode] = useState(authStore.studyModeActive);
  const [checkInMsg, setCheckInMsg] = useState("");

  // Modals
  const [pairInfoOpen, setPairInfoOpen] = useState(false);
  const [requestAppOpen, setRequestAppOpen] = useState(false);

  // App request form
  const [appName, setAppName] = useState("");
  const [appReason, setAppReason] = useState("");

  useEffect(() => {
    const unsubTrack = trackingStore.subscribe(() => {
      setLocation({ ...trackingStore.currentLocation });
      setBattery(trackingStore.batteryLevel);
    });

    const unsubAuth = authStore.subscribe(() => {
      setChild({ ...authStore.currentChild });
      setParent({ ...authStore.currentParent });
      setIsLocked(authStore.isRemoteLocked);
      setStudyMode(authStore.studyModeActive);
    });

    return () => {
      unTrack();
      unsubAuth();
    };
  }, []);

  function unTrack() {
    // cleanup
  }

  const handleCheckIn = () => {
    emergencyAudio.playBeep(800, 0.15);
    authStore.sendChildCheckIn("I'm Okay! Safe and sound.");
    setCheckInMsg(`✓ Sent 'I'm Okay' check-in to ${parent.name}!`);
    toast.success(`Check-in alert delivered to ${parent.name}!`, {
      icon: "💚",
    });
    setTimeout(() => setCheckInMsg(""), 4000);
  };

  const handleToggleStudy = () => {
    const newSm = authStore.toggleStudyMode();
    if (newSm) {
      toast.info("Study Mode Activated! Distractions blocked.");
    } else {
      toast.success("Study Mode Ended.");
    }
  };

  const handleRequestAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      toast.error("Please enter an app name");
      return;
    }

    authStore.submitAppRequest(appName, appReason || "Please approve this app for me!");
    toast.success(`App request for "${appName}" sent to ${parent.name}!`, {
      icon: "📲",
    });
    setRequestAppOpen(false);
    setAppName("");
    setAppReason("");
  };

  const handleLogout = () => {
    authStore.logout();
    toast.info("Signed out of Child Device");
    navigate({ to: "/welcome" });
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-6 pt-2 pb-8 relative overflow-y-auto">
        {/* Device Locked Overlay if remote lock is on */}
        {isLocked && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/30">
              <Lock size={40} />
            </div>
            <h2 className="text-2xl font-black">Device Locked</h2>
            <p className="text-sm text-white/80 mt-2 max-w-xs">
              {parent.name} has remotely locked this phone. Please talk to your parent to
              unlock.
            </p>

            <div className="mt-8 space-y-3 w-full max-w-xs">
              <Link
                to="/sos"
                className="w-full py-3.5 rounded-2xl bg-rose-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <Siren size={18} /> Emergency SOS Call
              </Link>
              <button
                onClick={() => {
                  toast.info(`Calling parent: ${parent.phone || "+1 555-0192"}`);
                }}
                className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Phone size={18} /> Call {parent.name}
              </button>
            </div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow text-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              {child.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Hello,</div>
              <div className="font-bold text-base">{child.name} 👋</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPairInfoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[11px] font-semibold hover:bg-emerald-500/25 transition cursor-pointer"
              title="Family Connection Details"
            >
              <ShieldCheck size={14} /> Parent Linked
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Check In Success Banner */}
        {checkInMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center border border-emerald-500/30 animate-in fade-in duration-200">
            {checkInMsg}
          </div>
        )}

        {/* Study Mode Banner */}
        {studyMode && (
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center justify-between border border-indigo-500/30 animate-in fade-in">
            <div className="flex items-center gap-2">
              <BookOpen size={16} /> Study Mode is ON
            </div>
            <button
              onClick={handleToggleStudy}
              className="text-[10px] uppercase underline font-bold"
            >
              Turn Off
            </button>
          </div>
        )}

        {/* Status Card */}
        <div
          className="mt-4 p-5 rounded-3xl text-white relative overflow-hidden shadow-lg"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="text-xs text-white/80">Protected Family Network</div>
            <div className="text-xl font-bold mt-1">Stay safe, have fun.</div>
            <div className="text-xs text-white/90 mt-1">
              Connected with <b>{parent.name}</b>
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Battery size={14} /> {battery}%
              </span>
              <span className="flex items-center gap-1">
                <Wifi size={14} /> Connected
              </span>
              <span className="flex items-center gap-1 truncate max-w-[130px]">
                <MapPin size={14} /> {location.zone || "Safe Zone"}
              </span>
            </div>
          </div>
        </div>

        {/* SOS Emergency Button */}
        <Link to="/sos" className="mt-6 self-center group">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-destructive/20 animate-ping group-hover:bg-destructive/30" />
            <span className="absolute inset-3 rounded-full bg-destructive/30" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex flex-col items-center justify-center text-white shadow-2xl border-4 border-white active:scale-95 transition">
              <Siren size={38} className="animate-pulse" />
              <div className="font-black text-lg mt-1 tracking-wider">SOS</div>
              <div className="text-[9px] font-bold text-rose-100">EMERGENCY</div>
            </div>
          </div>
        </Link>
        <p className="text-center text-xs text-muted-foreground -mt-1 font-medium">
          Tap for Instant Emergency SOS & Siren
        </p>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {/* Request App */}
          <button
            type="button"
            onClick={() => setRequestAppOpen(true)}
            className="p-4 rounded-2xl text-left border shadow-[var(--shadow-soft)] active:scale-95 transition bg-card border-border hover:border-primary/40 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-primary/10 text-primary">
              <Download size={22} />
            </div>
            <div className="font-semibold text-sm">Request App</div>
            <div className="text-[11px] mt-0.5 text-muted-foreground">
              Ask parent to install
            </div>
          </button>

          {/* Study Mode */}
          <button
            type="button"
            onClick={handleToggleStudy}
            className={`p-4 rounded-2xl text-left border shadow-[var(--shadow-soft)] active:scale-95 transition cursor-pointer ${
              studyMode
                ? "bg-primary text-white border-transparent"
                : "bg-card border-border hover:border-primary/40"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                studyMode ? "bg-white/20" : "bg-primary/10 text-primary"
              }`}
            >
              <BookOpen size={22} />
            </div>
            <div className="font-semibold text-sm">Study Mode</div>
            <div
              className={`text-[11px] mt-0.5 ${
                studyMode ? "text-white/80" : "text-muted-foreground"
              }`}
            >
              {studyMode ? "Active: Focus mode" : "Focus & block apps"}
            </div>
          </button>

          {/* Share Location */}
          <Link
            to="/live-tracking"
            className="p-4 rounded-2xl text-left border shadow-[var(--shadow-soft)] active:scale-95 transition bg-card border-border hover:border-primary/40 block"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-primary/10 text-primary">
              <MapPin size={22} />
            </div>
            <div className="font-semibold text-sm">Share Location</div>
            <div className="text-[11px] mt-0.5 text-muted-foreground">
              Live GPS tracking
            </div>
          </Link>

          {/* I'm Okay Check-in */}
          <button
            type="button"
            onClick={handleCheckIn}
            className="p-4 rounded-2xl text-left border shadow-[var(--shadow-soft)] active:scale-95 transition bg-card border-border hover:bg-emerald-500/5 hover:border-emerald-500/40 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-emerald-500/10 text-emerald-600">
              <Smile size={22} />
            </div>
            <div className="font-semibold text-sm">I'm Okay</div>
            <div className="text-[11px] mt-0.5 text-muted-foreground">
              Quick check-in
            </div>
          </button>
        </div>

        {/* ===================== REQUEST APP MODAL ===================== */}
        {requestAppOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Request App from Parent</h3>
                </div>
                <button
                  onClick={() => setRequestAppOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quick Pick apps */}
              <div>
                <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Popular Apps:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Roblox", "Minecraft", "Brawl Stars", "Duolingo", "YouTube Kids"].map(
                    (app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setAppName(app)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                          appName === app
                            ? "bg-primary text-white border-primary"
                            : "bg-secondary border-border hover:border-primary/40"
                        }`}
                      >
                        {app}
                      </button>
                    )
                  )}
                </div>
              </div>

              <form onSubmit={handleRequestAppSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    App Name
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Roblox"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-sm outline-none border border-border focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Why do you want this app?
                  </label>
                  <textarea
                    value={appReason}
                    onChange={(e) => setAppReason(e.target.value)}
                    placeholder="All my friends play it and I promise to follow screen time..."
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-xs outline-none border border-border focus:border-primary h-20 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRequestAppOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold shadow"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== PAIRING DETAILS MODAL ===================== */}
        {pairInfoOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Connected to Family</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  This device is paired with <b>{parent.name}</b>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-secondary border border-border text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Family Code:</span>
                  <span className="font-mono font-bold text-primary">
                    {parent.familyCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parent Phone:</span>
                  <span className="font-bold">{parent.phone || "+1 555-0192"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold text-emerald-600">Active & Syncing</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPairInfoOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-destructive/10 text-destructive text-xs font-semibold"
                >
                  Unlink Device
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

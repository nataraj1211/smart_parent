import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  MapPin,
  Monitor,
  Eye,
  ShieldCheck,
  Clock,
  Navigation,
  BellRing,
  Siren,
  Smartphone,
  Bell,
  Settings,
  ChevronRight,
  AlertTriangle,
  Radio,
  Copy,
  Plus,
  Lock,
  Unlock,
  Volume2,
  Check,
  CheckCircle2,
  X,
  LogOut,
  User,
  Sparkles,
  SmartphoneNfc,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { trackingStore, LocationPoint, SOSState } from "@/lib/trackingStore";
import { authStore, ParentUser, ChildUser, NotificationItem } from "@/lib/authStore";
import { emergencyAudio } from "@/lib/audioAlert";

export const Route = createFileRoute("/parent-dashboard")({
  component: ParentDashboard,
});

function ParentDashboard() {
  const navigate = useNavigate();

  // Stores state
  const [parent, setParent] = useState<ParentUser>(authStore.currentParent);
  const [child, setChild] = useState<ChildUser>(authStore.currentChild);
  const [location, setLocation] = useState<LocationPoint>(trackingStore.currentLocation);
  const [battery, setBattery] = useState(trackingStore.batteryLevel);
  const [sos, setSos] = useState<SOSState>(trackingStore.sosState);
  const [notifications, setNotifications] = useState<NotificationItem[]>(authStore.notifications);
  const [isLocked, setIsLocked] = useState(authStore.isRemoteLocked);
  const [studyMode, setStudyMode] = useState(authStore.studyModeActive);
  const [appRequests, setAppRequests] = useState(authStore.appRequests);

  // Modals & Panels
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [remoteControlOpen, setRemoteControlOpen] = useState(false);
  const [screenMirrorOpen, setScreenMirrorOpen] = useState(false);
  const [virtualScreenOpen, setVirtualScreenOpen] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(false);

  // New child form
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState("10");

  useEffect(() => {
    const unsubTrack = trackingStore.subscribe(() => {
      setLocation({ ...trackingStore.currentLocation });
      setBattery(trackingStore.batteryLevel);
      setSos({ ...trackingStore.sosState });
    });

    const unsubAuth = authStore.subscribe(() => {
      setParent({ ...authStore.currentParent });
      setChild({ ...authStore.currentChild });
      setNotifications([...authStore.notifications]);
      setIsLocked(authStore.isRemoteLocked);
      setStudyMode(authStore.studyModeActive);
      setAppRequests([...authStore.appRequests]);
    });

    return () => {
      unTrack();
      unsubAuth();
    };
  }, []);

  function unTrack() {
    // cleanup
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Family Pairing Code "${code}" copied! Share it with ${child.name}.`);
  };

  const handleToggleLock = () => {
    const newLock = authStore.toggleRemoteLock();
    setIsLocked(newLock);
    if (newLock) {
      toast.error(`Remote Lock activated on ${child.name}'s phone!`, {
        icon: "🔒",
      });
    } else {
      toast.success(`Device for ${child.name} unlocked!`, {
        icon: "🔓",
      });
    }
  };

  const handleToggleStudyMode = () => {
    const newStudy = authStore.toggleStudyMode();
    setStudyMode(newStudy);
    if (newStudy) {
      toast.info(`Study Mode enabled for ${child.name}. Games and social media are locked.`, {
        icon: "📚",
      });
    } else {
      toast.success(`Study Mode disabled. Normal apps available.`);
    }
  };

  const handlePlayChime = () => {
    emergencyAudio.playBeep(900, 0.25);
    setTimeout(() => emergencyAudio.playBeep(1200, 0.35), 250);
    toast.info(`Sending alert chime ring to ${child.name}'s phone...`, {
      icon: "🔔",
    });
  };

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) {
      toast.error("Please enter a name for the child");
      return;
    }
    const created = authStore.addChild(newChildName, parseInt(newChildAge) || 10);
    toast.success(`Added ${created.name} to your family!`);
    setAddChildOpen(false);
    setNewChildName("");
  };

  const handleLogout = () => {
    authStore.logout();
    toast.info("Signed out of Parent Portal");
    navigate({ to: "/welcome" });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingApps = appRequests.filter((r) => r.status === "pending").length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div
          className="px-6 pt-2 pb-6 text-white relative overflow-hidden"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          {/* Top user bar */}
          <div className="flex items-center justify-between relative z-10">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm shadow group-hover:bg-white/30 transition">
                {getInitials(parent.name || "Sarah Parker")}
              </div>
              <div>
                <div className="text-[11px] text-white/80">Parent Portal</div>
                <div className="font-semibold text-sm flex items-center gap-1">
                  <span>{parent.name || "Sarah Parker"}</span>
                  <ChevronRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setNotifOpen(true)}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center relative transition"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                title="Family Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Connected Child Card */}
          <div className="mt-5 p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 relative shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center font-bold text-base shadow">
                    {getInitials(child.name || "Emma")}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base flex items-center gap-2">
                    <span>{child.name || "Emma"}</span>
                    <span className="text-xs text-white/80 font-normal">· {child.age || 12} yrs</span>
                  </div>
                  <div className="text-xs text-white/90 flex items-center gap-1 truncate mt-0.5">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">
                      {location.zone || location.address || "Lincoln Elementary"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-[10px] font-black tracking-wide border border-white/20">
                  LIVE CONNECTED
                </span>
                {isLocked && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/80 text-[10px] font-bold text-white flex items-center gap-1">
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-[11px]">
              <div className="rounded-xl bg-white/10 py-2">
                <div className="font-bold">{battery}%</div>
                <div className="text-white/70">Battery</div>
              </div>
              <div className="rounded-xl bg-white/10 py-2">
                <div className="font-bold">{studyMode ? "Study Mode" : "2h 14m"}</div>
                <div className="text-white/70">Screen Time</div>
              </div>
              <div className="rounded-xl bg-white/10 py-2">
                <div className="font-bold">{location.speed || 0} km/h</div>
                <div className="text-white/70">Speed</div>
              </div>
            </div>

            {/* Family Pairing Code Banner */}
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-white/90">
                <span className="text-[10px] uppercase font-bold text-white/70">Pairing Code:</span>
                <span className="font-mono font-bold tracking-wider">{parent.familyCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyCode(parent.familyCode)}
                  className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-[10px] font-bold flex items-center gap-1 transition"
                >
                  <Copy size={11} /> Copy
                </button>
                <button
                  onClick={() => setAddChildOpen(true)}
                  className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-[10px] font-bold flex items-center gap-1 transition"
                >
                  <Plus size={11} /> Add Child
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 px-5 -mt-3 pt-3 bg-background rounded-t-3xl pb-6 space-y-4 overflow-y-auto">
          {/* Active SOS Callout if triggered */}
          {sos.isActive && (
            <Link
              to="/sos"
              className="block p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg border-2 border-white animate-bounce"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Siren size={24} className="animate-spin" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">
                      EMERGENCY SOS ACTIVE!
                    </div>
                    <div className="text-[11px] text-white/90">
                      {child.name} triggered emergency alert! Tap to open.
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} />
              </div>
            </Link>
          )}

          {/* Pending App Requests banner if any */}
          {pendingApps > 0 && (
            <Link
              to="/app-approval"
              className="block p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-foreground hover:bg-amber-500/15 transition shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                    {pendingApps}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      {pendingApps} App Installation Request{pendingApps > 1 ? "s" : ""}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {child.name} requested permission. Tap to review.
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-amber-600" />
              </div>
            </Link>
          )}

          {/* Map preview */}
          <Link to="/live-tracking" className="block group">
            <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-[var(--shadow-soft)] hover:border-primary/50 transition">
              <div className="relative h-32 bg-slate-100 dark:bg-slate-800">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-blue-500 opacity-40" />
                    <span
                      className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-indigo-500 opacity-60"
                      style={{ animationDelay: "0.3s" }}
                    />
                    <div className="relative w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg">
                      {getInitials(child.name || "Emma")}
                    </div>
                  </div>
                </div>

                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-card/90 backdrop-blur text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-border">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wide">
                    Live GPS Active
                  </span>
                </div>

                <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-bold flex items-center gap-1 shadow">
                  <span>Open Interactive Map</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="text-sm font-bold text-foreground">Current Live Location</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">
                    {location.zone || location.address || "Lincoln Elementary"} ·{" "}
                    {location.isSafe ? "In Safe Zone" : "In Transit"}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Navigation size={16} />
                </div>
              </div>
            </div>
          </Link>

          {/* 9 Monitoring Tools */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">Monitoring Tools</h2>
              <span className="text-xs text-primary font-medium">9 Features Ready</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. Live Location */}
              <Link
                to="/live-tracking"
                className="p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition hover:border-primary/40"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <MapPin size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">Live Location</div>
              </Link>

              {/* 2. Screen Mirror */}
              <button
                type="button"
                onClick={() => setScreenMirrorOpen(true)}
                className="p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition hover:border-primary/40 text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md">
                  <Monitor size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">Screen Mirror</div>
              </button>

              {/* 3. Virtual Screen */}
              <button
                type="button"
                onClick={() => setVirtualScreenOpen(true)}
                className="p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition hover:border-primary/40 text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <Eye size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">Virtual Screen</div>
              </button>

              {/* 4. App Approval */}
              <Link
                to="/app-approval"
                className="p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition hover:border-primary/40 relative"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-md">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">App Approval</div>
                {pendingApps > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingApps}
                  </span>
                )}
              </Link>

              {/* 5. Screen Time */}
              <Link
                to="/screen-time"
                className="p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition hover:border-primary/40"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                  <Clock size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">Screen Time</div>
              </Link>

              {/* 6. Geofencing */}
              <Link
                to="/live-tracking"
                className="p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition hover:border-primary/40"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
                  <Navigation size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">Geofencing</div>
              </Link>

              {/* 7. Notifications */}
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                className="p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition hover:border-primary/40 relative text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white shadow-md">
                  <BellRing size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">Notifications</div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* 8. SOS Alerts */}
              <Link
                to="/sos"
                className={`p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition relative hover:border-primary/40 ${
                  sos.isActive ? "ring-2 ring-rose-500 animate-pulse" : ""
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                  <Siren size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">SOS Alerts</div>
                {sos.isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                )}
              </Link>

              {/* 9. Remote Control */}
              <button
                type="button"
                onClick={() => setRemoteControlOpen(true)}
                className="p-3 rounded-2xl bg-card border border-border shadow-[var(--shadow-soft)] flex flex-col items-center gap-2 active:scale-95 transition hover:border-primary/40 relative text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white shadow-md">
                  <Smartphone size={20} />
                </div>
                <div className="text-[11px] font-semibold text-center leading-tight">Remote Control</div>
                {isLocked && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-white text-[8px] font-black">
                    L
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Remote Action Bar */}
          <div className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SmartphoneNfc size={18} className="text-primary" />
              <div>
                <div className="text-xs font-bold text-foreground">Device Controls</div>
                <div className="text-[10px] text-muted-foreground">{child.name}'s Phone</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleLock}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                  isLocked
                    ? "bg-rose-500 text-white"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                {isLocked ? "Unlock" : "Lock"}
              </button>
              <button
                onClick={handlePlayChime}
                className="px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold flex items-center gap-1 transition"
                title="Ring child device"
              >
                <Volume2 size={13} className="text-primary" /> Ring
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Recent Activity</h3>
              <button
                onClick={() => setNotifOpen(true)}
                className="text-xs text-primary font-medium hover:underline"
              >
                View all ({notifications.length})
              </button>
            </div>
            <div className="space-y-2.5">
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.type === "sos"
                        ? "bg-rose-500/15 text-rose-600"
                        : n.type === "app_request"
                        ? "bg-amber-500/15 text-amber-600"
                        : n.type === "checkin"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {n.type === "sos" ? (
                      <Siren size={14} />
                    ) : n.type === "app_request" ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="font-semibold truncate">{n.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{n.message}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(n.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <BottomNav active="Home" />

        {/* ===================== NOTIFICATIONS DRAWER ===================== */}
        {notifOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
            <div className="bg-card border-t border-border rounded-t-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-primary" />
                  <h3 className="font-bold text-base">Notifications & Alerts</h3>
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-muted-foreground">{notifications.length} total events</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      authStore.markAllNotificationsRead();
                      toast.success("All notifications marked as read");
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    Mark read
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    onClick={() => {
                      authStore.clearAllNotifications();
                      toast.info("Notifications cleared");
                    }}
                    className="text-destructive font-bold hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No new notifications right now.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        n.read
                          ? "bg-secondary/40 border-border"
                          : "bg-primary/5 border-primary/20 font-medium"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== REMOTE CONTROL MODAL ===================== */}
        {remoteControlOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Remote Device Control</h3>
                    <p className="text-[11px] text-muted-foreground">Target: {child.name}'s Device</p>
                  </div>
                </div>
                <button
                  onClick={() => setRemoteControlOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleToggleLock}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                    isLocked
                      ? "bg-rose-500 text-white border-rose-600"
                      : "bg-secondary border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isLocked ? <Unlock size={20} /> : <Lock size={20} className="text-primary" />}
                    <div>
                      <div className="font-bold text-xs">{isLocked ? "Unlock Device" : "Lock Child Screen"}</div>
                      <div className="text-[10px] opacity-80">
                        {isLocked ? "Device is currently blocked" : "Block child access instantly"}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase">{isLocked ? "Active" : "Tap"}</span>
                </button>

                <button
                  onClick={handleToggleStudyMode}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                    studyMode
                      ? "bg-primary text-white border-primary"
                      : "bg-secondary border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock size={20} className={studyMode ? "text-white" : "text-primary"} />
                    <div>
                      <div className="font-bold text-xs">{studyMode ? "Study Mode Active" : "Enable Study Mode"}</div>
                      <div className="text-[10px] opacity-80">Block social apps & games during homework</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase">{studyMode ? "On" : "Off"}</span>
                </button>

                <button
                  onClick={handlePlayChime}
                  className="w-full p-3.5 rounded-2xl border border-border bg-secondary hover:border-primary/40 text-left flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <Volume2 size={20} className="text-primary" />
                    <div>
                      <div className="font-bold text-xs">Sound Ring Chime</div>
                      <div className="text-[10px] text-muted-foreground">Ring phone at max volume to locate</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">Ring</span>
                </button>

                <button
                  onClick={() => {
                    toast.success(`Sent instant notification ping to ${child.name}'s device!`);
                  }}
                  className="w-full p-3.5 rounded-2xl border border-border bg-secondary hover:border-primary/40 text-left flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <Radio size={20} className="text-primary" />
                    <div>
                      <div className="font-bold text-xs">Ping Child Device</div>
                      <div className="text-[10px] text-muted-foreground">Wake screen and request status</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">Ping</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== SCREEN MIRROR MODAL ===================== */}
        {screenMirrorOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Live Screen Mirror</h3>
                </div>
                <button
                  onClick={() => setScreenMirrorOpen(false)}
                  className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Simulated Phone Screen */}
              <div className="w-full h-80 rounded-2xl bg-slate-900 border-4 border-slate-700 text-white relative overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Streaming 1080p</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-xl font-bold">
                    {child.name.charAt(0)}
                  </div>
                  <div className="text-xs font-bold">{child.name}'s Device Active</div>
                  <div className="text-[10px] text-white/70">
                    {isLocked ? "DEVICE LOCKED BY PARENT" : studyMode ? "STUDY MODE ENGAGED" : "Homescreen · Battery 84%"}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white/10 backdrop-blur text-[10px] text-center">
                  Live encrypted WebRTC mirror stream
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleToggleLock}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold"
                >
                  {isLocked ? "Unlock Screen" : "Lock Screen"}
                </button>
                <button
                  onClick={() => {
                    toast.success("Remote screen snapshot captured & saved to gallery!");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold shadow"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Take Snapshot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIRTUAL SCREEN MODAL ===================== */}
        {virtualScreenOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Virtual Screen Inspector</h3>
                </div>
                <button
                  onClick={() => setVirtualScreenOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Inspect and restrict app access without disturbing {child.name}'s screen.
              </p>

              <div className="space-y-2">
                {[
                  { name: "Camera & Photos", status: "Restricted after 8 PM" },
                  { name: "Web Browser", status: "SafeSearch Strictly Enforced" },
                  { name: "App Store Purchases", status: "Require Parent Password" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-secondary flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.status}</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  toast.success("Virtual Screen restrictions synced with child device!");
                  setVirtualScreenOpen(false);
                }}
                className="w-full py-2.5 rounded-xl text-white text-xs font-semibold shadow"
                style={{ background: "var(--gradient-primary)" }}
              >
                Apply Virtual Restrictions
              </button>
            </div>
          </div>
        )}

        {/* ===================== ADD CHILD MODAL ===================== */}
        {addChildOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Connect Another Child</h3>
                </div>
                <button
                  onClick={() => setAddChildOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddChildSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Child's Name</label>
                  <input
                    type="text"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder="e.g. Leo"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-sm outline-none border border-border focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Age</label>
                  <input
                    type="number"
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-sm outline-none border border-border focus:border-primary"
                    min="3"
                    max="18"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-primary/10 text-xs text-muted-foreground">
                  Child will use the same Family Pairing Code: <b>{parent.familyCode}</b>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddChildOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold shadow"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    Add Child
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== SETTINGS MODAL ===================== */}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Family & Device Settings</h3>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Family Pairing Code */}
              <div className="p-3.5 rounded-2xl bg-secondary border border-border space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">
                  Active Family Pairing Code
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-black text-primary">{parent.familyCode}</span>
                  <button
                    onClick={() => handleCopyCode(parent.familyCode)}
                    className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-bold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-secondary flex items-center justify-between">
                  <span>Emergency Siren Audio</span>
                  <span className="font-bold text-emerald-600">Enabled</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary flex items-center justify-between">
                  <span>Geofence Boundary Alerts</span>
                  <span className="font-bold text-emerald-600">Instant</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive text-xs font-bold flex items-center justify-center gap-2 hover:bg-destructive/10 transition"
                >
                  <LogOut size={14} /> Sign Out of Parent Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PROFILE MODAL ===================== */}
        {profileOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white text-2xl font-black flex items-center justify-center mx-auto shadow-lg">
                {getInitials(parent.name || "Sarah Parker")}
              </div>
              <div>
                <h3 className="font-bold text-lg">{parent.name || "Sarah Parker"}</h3>
                <p className="text-xs text-muted-foreground">{parent.email || "parent@email.com"}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                  Code: {parent.familyCode}
                </div>
              </div>

              {/* Children List */}
              <div className="text-left pt-2">
                <div className="text-xs font-bold text-muted-foreground mb-2">Connected Children</div>
                <div className="space-y-2">
                  {parent.children.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        authStore.switchActiveChild(c.id);
                        toast.success(`Switched active monitoring to ${c.name}`);
                        setProfileOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        c.id === child.id ? "bg-primary/10 border-primary" : "bg-secondary border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                          {c.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold">{c.name} ({c.age} yrs)</span>
                      </div>
                      {c.id === child.id && (
                        <span className="text-[10px] font-bold text-primary">Active</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setProfileOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-xs font-semibold shadow"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
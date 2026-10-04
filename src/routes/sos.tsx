import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Siren,
  Phone,
  MapPin,
  MessageSquare,
  Shield,
  Volume2,
  VolumeX,
  Flashlight,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Radio,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { trackingStore, SOSState } from "@/lib/trackingStore";
import { emergencyAudio } from "@/lib/audioAlert";

export const Route = createFileRoute("/sos")({ component: SOS });

function SOS() {
  const navigate = useNavigate();
  const [sosState, setSosState] = useState<SOSState>(trackingStore.sosState);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [strobeActive, setStrobeActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    // If not already active, start 3-second countdown to trigger
    if (!trackingStore.sosState.isActive) {
      setCountdown(3);
    } else {
      setCountdown(null);
    }

    const unsub = trackingStore.subscribe(() => {
      setSosState({ ...trackingStore.sosState });
    });

    return () => {
      unsub();
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      emergencyAudio.playBeep(600 + countdown * 200, 0.12);
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Trigger SOS now!
      trackingStore.triggerSOS("Emma pressed emergency SOS button");
      setCountdown(null);
      setStatusMessage("🚨 SOS Alert successfully dispatched to parents and contacts!");
    }
  }, [countdown]);

  const handleInstantTrigger = () => {
    setCountdown(null);
    trackingStore.triggerSOS("Instant manual SOS trigger");
    setStatusMessage("🚨 Emergency alert activated!");
  };

  const handleCancelSOS = () => {
    setCountdown(null);
    trackingStore.cancelSOS();
    setStatusMessage("Emergency cancelled. Emma marked safe.");
    setTimeout(() => {
      navigate({ to: "/child-dashboard" });
    }, 1200);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      if (sosState.isActive) emergencyAudio.startSiren();
    } else {
      emergencyAudio.stopSiren();
    }
  };

  const loc = sosState.location || trackingStore.currentLocation;
  const mapsUrl = `https://maps.google.com/?q=${loc.lat},${loc.lng}`;

  return (
    <PhoneFrame statusBarDark>
      <div
        className={`flex-1 flex flex-col px-5 pt-3 pb-6 text-white relative overflow-hidden transition-colors duration-150 ${
          strobeActive ? "bg-red-700" : ""
        }`}
        style={
          !strobeActive
            ? {
                background:
                  "linear-gradient(160deg, oklch(0.38 0.22 25) 0%, oklch(0.24 0.18 15) 100%)",
              }
            : undefined
        }
      >
        {/* Ambient glow pulses */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-rose-500/25 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/child-dashboard"
            onClick={() => {
              if (countdown !== null) setCountdown(null);
            }}
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition active:scale-95"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-2">
            {/* Siren mute/unmute button */}
            <button
              onClick={handleToggleSound}
              className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 hover:bg-white/25 transition"
            >
              {soundEnabled ? (
                <>
                  <Volume2 size={13} className="text-emerald-400" />
                  <span>SIREN ON</span>
                </>
              ) : (
                <>
                  <VolumeX size={13} className="text-white/60" />
                  <span>MUTED</span>
                </>
              )}
            </button>

            {/* Flashlight strobe toggle */}
            <button
              onClick={() => setStrobeActive(!strobeActive)}
              className={`p-2 rounded-full backdrop-blur-md transition ${
                strobeActive ? "bg-yellow-400 text-black font-bold" : "bg-white/15 text-white"
              }`}
              title="Flashlight Strobe"
            >
              <Flashlight size={14} />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="relative z-10 mt-3 p-2.5 rounded-xl bg-white/20 backdrop-blur border border-white/30 text-xs font-semibold text-center animate-in fade-in duration-200">
            {statusMessage}
          </div>
        )}

        {/* Emergency Header */}
        <div className="relative text-center mt-3">
          <div className="text-[11px] uppercase tracking-[0.25em] text-rose-300 font-extrabold flex items-center justify-center gap-1.5">
            <Radio size={13} className="animate-pulse text-rose-400" />
            <span>EMERGENCY DISPATCH SYSTEM</span>
          </div>

          {countdown !== null ? (
            <div>
              <h1 className="text-2xl font-black mt-1">Activating in {countdown}s</h1>
              <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
                Tap Cancel below if this was pressed by mistake.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-black mt-1 tracking-tight text-white flex items-center justify-center gap-2">
                <span>SOS ACTIVATED</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
              </h1>
              <p className="text-xs text-rose-100/90 mt-1.5 max-w-xs mx-auto">
                Parents and emergency services have been alerted with your real-time coordinates.
              </p>
            </div>
          )}
        </div>

        {/* Central SOS Pulse Sphere / Countdown Dial */}
        <div className="relative flex-1 flex items-center justify-center my-3">
          {countdown !== null ? (
            /* Countdown Wheel */
            <div className="relative w-52 h-52 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-red-500 to-rose-600 border-4 border-white/60 shadow-2xl flex flex-col items-center justify-center text-white">
                <span className="text-5xl font-black">{countdown}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-1">
                  Seconds
                </span>
              </div>
            </div>
          ) : (
            /* Active SOS Siren Graphic */
            <div className="relative w-56 h-56 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
              <span
                className="absolute inset-4 rounded-full bg-rose-500/40 animate-ping"
                style={{ animationDelay: "0.4s" }}
              />
              <span className="absolute inset-8 rounded-full bg-white/15" />
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-white via-rose-50 to-rose-100 flex flex-col items-center justify-center text-rose-600 shadow-2xl border-4 border-white">
                <Siren size={44} className="animate-bounce" />
                <div className="font-black text-2xl mt-0.5 tracking-wider">SOS</div>
                <div className="text-[9px] font-black text-rose-600/90 tracking-widest">
                  TRANSMITTING
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current GPS Snapshot Card */}
        <div className="relative p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 mb-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-white/90">
              <MapPin size={13} className="text-rose-400" />
              <span>Transmitting Live GPS</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              Accuracy: {loc.accuracy || 8}m
            </span>
          </div>

          <div className="text-xs font-bold text-white truncate">
            {loc.address || `${loc.lat.toFixed(5)}°N, ${loc.lng.toFixed(5)}°W`}
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/70 pt-1 border-t border-white/10">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              <span>{new Date(loc.timestamp).toLocaleTimeString()}</span>
            </span>
            <Link
              to="/live-tracking"
              className="text-white font-bold underline underline-offset-2 flex items-center gap-1 hover:text-rose-200"
            >
              <span>View On Live Map →</span>
            </Link>
          </div>
        </div>

        {/* Emergency Contacts List */}
        <div className="relative p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 mb-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/80 mb-2 flex items-center justify-between">
            <span>Alerted Emergency Contacts</span>
            <span className="text-emerald-300 flex items-center gap-1 text-[10px]">
              <CheckCircle2 size={11} /> 3 Notified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Mom */}
            <div className="p-2 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-rose-500/60 text-white font-black text-[10px] flex items-center justify-center">
                  MP
                </span>
                <span className="text-[9px] text-emerald-300 font-bold">Sent</span>
              </div>
              <div className="mt-1.5">
                <div className="font-bold text-xs truncate">Mom</div>
                <div className="text-[9px] text-white/70 truncate">+1 555-0192</div>
              </div>
              <div className="flex gap-1 mt-2">
                <a
                  href="tel:+15550192"
                  className="flex-1 py-1 rounded bg-white/20 hover:bg-white/30 text-center text-[10px] font-bold flex items-center justify-center"
                >
                  <Phone size={10} />
                </a>
                <a
                  href={`sms:+15550192?body=EMERGENCY! Emma triggered SOS at ${encodeURIComponent(loc.address || "")}. Maps: ${encodeURIComponent(mapsUrl)}`}
                  className="flex-1 py-1 rounded bg-white/20 hover:bg-white/30 text-center text-[10px] font-bold flex items-center justify-center"
                >
                  <MessageSquare size={10} />
                </a>
              </div>
            </div>

            {/* Dad */}
            <div className="p-2 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-blue-500/60 text-white font-black text-[10px] flex items-center justify-center">
                  DP
                </span>
                <span className="text-[9px] text-emerald-300 font-bold">Sent</span>
              </div>
              <div className="mt-1.5">
                <div className="font-bold text-xs truncate">Dad</div>
                <div className="text-[9px] text-white/70 truncate">+1 555-0193</div>
              </div>
              <div className="flex gap-1 mt-2">
                <a
                  href="tel:+15550193"
                  className="flex-1 py-1 rounded bg-white/20 hover:bg-white/30 text-center text-[10px] font-bold flex items-center justify-center"
                >
                  <Phone size={10} />
                </a>
                <a
                  href={`sms:+15550193?body=EMERGENCY! Emma triggered SOS at ${encodeURIComponent(loc.address || "")}. Maps: ${encodeURIComponent(mapsUrl)}`}
                  className="flex-1 py-1 rounded bg-white/20 hover:bg-white/30 text-center text-[10px] font-bold flex items-center justify-center"
                >
                  <MessageSquare size={10} />
                </a>
              </div>
            </div>

            {/* Emergency Services */}
            <div className="p-2 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-red-600 text-white font-black text-[9px] flex items-center justify-center">
                  911
                </span>
                <span className="text-[9px] text-rose-300 font-bold">Ready</span>
              </div>
              <div className="mt-1.5">
                <div className="font-bold text-xs truncate">Police / 911</div>
                <div className="text-[9px] text-white/70 truncate">Emergency</div>
              </div>
              <div className="mt-2">
                <a
                  href="tel:911"
                  className="w-full py-1 rounded bg-rose-600 hover:bg-rose-500 text-center text-[10px] font-black flex items-center justify-center gap-1 shadow"
                >
                  <Phone size={10} /> Call
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Action Buttons */}
        <div className="relative space-y-2 mt-auto">
          {countdown !== null ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleInstantTrigger}
                className="py-3 rounded-2xl bg-rose-600 text-white font-extrabold text-xs shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <AlertOctagon size={16} /> Trigger Now
              </button>
              <button
                onClick={handleCancelSOS}
                className="py-3 rounded-2xl bg-white/20 backdrop-blur-md text-white font-bold text-xs active:scale-95 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:911"
                className="py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-xl active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Phone size={16} /> Call Emergency (911)
              </a>
              <button
                onClick={handleCancelSOS}
                className="py-3.5 rounded-2xl bg-white text-rose-700 font-extrabold text-xs shadow-xl active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={16} /> I Am Safe (Cancel SOS)
              </button>
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
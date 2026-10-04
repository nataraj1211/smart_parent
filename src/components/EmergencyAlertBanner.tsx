import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Siren, MapPin, Phone, Volume2, VolumeX, X, Navigation } from "lucide-react";
import { trackingStore, SOSState } from "@/lib/trackingStore";
import { authStore } from "@/lib/authStore";

export function EmergencyAlertBanner() {
  const [sos, setSos] = useState<SOSState>(trackingStore.sosState);
  const [childName, setChildName] = useState(authStore.currentChild.name);

  useEffect(() => {
    const unsubTrack = trackingStore.subscribe(() => {
      setSos({ ...trackingStore.sosState });
    });
    const unsubAuth = authStore.subscribe(() => {
      setChildName(authStore.currentChild.name);
    });
    return () => {
      unsubTrack();
      unsubAuth();
    };
  }, []);

  if (!sos.isActive) return null;

  const loc = sos.location || trackingStore.currentLocation;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-2xl border-b-2 border-white/30 animate-in slide-in-from-top duration-300">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Pulse Indicator + Details */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-white opacity-80" />
            <div className="relative w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center font-black shadow-lg">
              <Siren size={22} className="animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
                EMERGENCY SOS ACTIVE
              </span>
              <span className="text-xs text-white/90 font-medium">Child: {childName}</span>
            </div>
            <div className="text-xs text-white/90 flex items-center gap-1.5 mt-0.5">
              <MapPin size={12} className="shrink-0 text-white" />
              <span className="truncate max-w-[240px] sm:max-w-md font-semibold">
                {loc.address || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Siren Audio Toggle */}
          <button
            onClick={() => trackingStore.toggleSiren()}
            title={sos.isSirenAudible ? "Mute Siren" : "Play Siren"}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1 transition"
          >
            {sos.isSirenAudible ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Quick Call */}
          <a
            href="tel:911"
            className="px-3 py-1.5 rounded-xl bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <Phone size={13} />
            <span>Call 911</span>
          </a>

          {/* Track Live */}
          <Link
            to="/live-tracking"
            className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Navigation size={13} />
            <span>View Map</span>
          </Link>

          {/* Clear / Dismiss */}
          <button
            onClick={() => trackingStore.cancelSOS()}
            title="Acknowledge and Resolve Alert"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

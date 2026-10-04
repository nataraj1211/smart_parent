import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Navigation,
  Phone,
  MessageCircle,
  Shield,
  Radio,
  Compass,
  Battery,
  Gauge,
  Share2,
  ExternalLink,
  Play,
  Pause,
  AlertTriangle,
  LocateFixed,
  MapPin,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { InteractiveMap } from "@/components/InteractiveMap";
import { trackingStore, LocationPoint } from "@/lib/trackingStore";

export const Route = createFileRoute("/live-tracking")({ component: LiveTracking });

function LiveTracking() {
  const [location, setLocation] = useState<LocationPoint>(trackingStore.currentLocation);
  const [history, setHistory] = useState<LocationPoint[]>(trackingStore.locationHistory);
  const [trackingMode, setTrackingMode] = useState<"live" | "simulation">(trackingStore.trackingMode);
  const [activeTab, setActiveTab] = useState<"map" | "zones" | "history">("map");
  const [isSimulating, setIsSimulating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>("");

  useEffect(() => {
    // Initial start: run simulation or keep live
    if (trackingMode === "simulation") {
      trackingStore.startSimulation("school_to_home");
    }

    const unsub = trackingStore.subscribe(() => {
      setLocation({ ...trackingStore.currentLocation });
      setHistory([...trackingStore.locationHistory]);
      setTrackingMode(trackingStore.trackingMode);
    });

    return () => {
      unsub();
    };
  }, []);

  const handleToggleSimulation = () => {
    if (isSimulating) {
      trackingStore.stopSimulation();
      setIsSimulating(false);
    } else {
      trackingStore.startSimulation("school_to_home");
      setIsSimulating(true);
      setTrackingMode("simulation");
    }
  };

  const handleSwitchRoute = (routeKey: "school_to_home" | "home_to_park") => {
    trackingStore.startSimulation(routeKey);
    setIsSimulating(true);
    setTrackingMode("simulation");
  };

  const handleStartRealGPS = async () => {
    setGpsStatus("Requesting device GPS permission...");
    const res = await trackingStore.startLiveGPSTracking();
    setGpsStatus(res.message);
    if (res.success) {
      setIsSimulating(false);
      setTrackingMode("live");
    }
    setTimeout(() => setGpsStatus(""), 4000);
  };

  const handleShare = async () => {
    const text = `Emma's Live Location: ${location.address || "Active Position"}. View on Maps: https://maps.google.com/?q=${location.lat},${location.lng}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Emma's Live Location",
          text,
          url: `https://maps.google.com/?q=${location.lat},${location.lng}`,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openGoogleMapsDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col relative h-[calc(100vh-2rem)] overflow-hidden">
        {/* Top Floating App Bar */}
        <div className="relative z-20 flex items-center gap-3 px-4 pt-2 pb-2 bg-background/80 backdrop-blur-md border-b border-border/50">
          <Link
            to="/parent-dashboard"
            className="w-10 h-10 rounded-xl bg-card shadow-sm border border-border flex items-center justify-center text-foreground hover:bg-accent transition active:scale-95"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 px-3.5 py-2 rounded-2xl bg-card shadow-sm border border-border flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <span>Tracking Emma</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[10px] font-semibold text-primary uppercase">{trackingMode}</span>
              </div>
              <div className="text-xs font-bold flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-emerald-700 font-bold">Live</span>
                <span className="text-muted-foreground text-[10px] font-normal">· Updated just now</span>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-primary hover:bg-primary/10 transition active:scale-95 relative"
              title="Share Location"
            >
              <Share2 size={16} />
              {copied && (
                <span className="absolute -bottom-6 right-0 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded shadow">
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* GPS Permission / Status Toast */}
        {gpsStatus && (
          <div className="relative z-30 mx-4 mt-2 p-2.5 rounded-xl bg-card/95 backdrop-blur border border-primary/30 text-xs font-semibold text-primary shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            {gpsStatus}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {activeTab === "map" && (
            <div className="flex-1 relative">
              <InteractiveMap location={location} history={history} />
            </div>
          )}

          {activeTab === "zones" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Geofencing & Safe Zones</h3>
                <span className="text-xs text-muted-foreground">3 Safe · 1 Restricted</span>
              </div>

              {/* Safe Zone Items */}
              <div className="p-3.5 rounded-2xl bg-card border border-emerald-500/30 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Lincoln Elementary School</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      SAFE ZONE
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Campus Perimeter · 250m Radius</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                    {location.isSafe && location.zone?.includes("Lincoln") ? "✓ Emma is currently inside" : "Outside boundary"}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-emerald-500/30 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Home (42 Maple Street)</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      SAFE ZONE
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Residence Perimeter · 180m Radius</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                    {location.isSafe && location.zone?.includes("Home") ? "✓ Emma is currently inside" : "Outside boundary"}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-emerald-500/30 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Prospect Park Activity Center</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      SAFE ZONE
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Public Park Grounds · 350m Radius</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-rose-500/30 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">Highway Intersection</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      RESTRICTED
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Automated Alert if child approaches</div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("map")}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <MapPin size={14} /> Back to Live Map
              </button>
            </div>
          )}

          {activeTab === "history" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">Today's Breadcrumb History</h3>
                <span className="text-xs text-muted-foreground">{history.length} logged points</span>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs">
                  No tracking history recorded yet. Points appear as Emma moves.
                </div>
              ) : (
                history
                  .slice()
                  .reverse()
                  .map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-card border border-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{item.address || `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · Speed: {item.speed || 0} km/h
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isSafe ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {item.isSafe ? "Safe" : "Transit"}
                      </span>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Live Controller Sheet (Bottom) */}
        <div className="relative z-20 bg-card rounded-t-3xl border-t border-border px-5 pt-3 pb-5 shadow-2xl space-y-3">
          {/* Grab handle */}
          <div className="w-10 h-1 bg-border rounded-full mx-auto" />

          {/* Child Identity & Status */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              EM
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-foreground">Emma Parker</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs text-muted-foreground truncate">{location.address || "Active Brooklyn Corridor"}</div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  location.isSafe
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-amber-500/15 text-amber-600"
                }`}
              >
                {location.isSafe ? "In Safe Zone" : "In Transit"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{location.zone || "Brooklyn"}</div>
            </div>
          </div>

          {/* Live Telemetry Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-secondary/80 py-2 border border-border/50">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Gauge size={13} />
                <span className="text-xs font-black">{location.speed || 0}</span>
              </div>
              <div className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5">Speed km/h</div>
            </div>

            <div className="rounded-xl bg-secondary/80 py-2 border border-border/50">
              <div className="flex items-center justify-center gap-1 text-emerald-600">
                <Battery size={13} />
                <span className="text-xs font-black">{trackingStore.batteryLevel}%</span>
              </div>
              <div className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5">Battery</div>
            </div>

            <div className="rounded-xl bg-secondary/80 py-2 border border-border/50">
              <div className="flex items-center justify-center gap-1 text-indigo-600">
                <Compass size={13} />
                <span className="text-xs font-black">{location.accuracy || 8}m</span>
              </div>
              <div className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5">Accuracy</div>
            </div>

            <div className="rounded-xl bg-secondary/80 py-2 border border-border/50">
              <div className="flex items-center justify-center gap-1 text-rose-500">
                <Radio size={13} />
                <span className="text-xs font-black">Live</span>
              </div>
              <div className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5">GPS Feed</div>
            </div>
          </div>

          {/* Mode Switch & Simulation Controls */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-secondary/60 border border-border text-xs">
            <button
              onClick={handleStartRealGPS}
              className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                trackingMode === "live"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LocateFixed size={13} />
              <span>Real GPS</span>
            </button>

            <button
              onClick={handleToggleSimulation}
              className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                trackingMode === "simulation"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isSimulating ? <Pause size={13} /> : <Play size={13} />}
              <span>{isSimulating ? "Simulation Active" : "Resume Walk"}</span>
            </button>

            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as "map" | "zones" | "history")}
              className="py-1 px-2 rounded-xl bg-card border border-border text-[11px] font-semibold text-foreground outline-none"
            >
              <option value="map">Map View</option>
              <option value="zones">Safe Zones</option>
              <option value="history">History</option>
            </select>
          </div>

          {/* Action Buttons: Call, Message, Directions */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <a
              href="tel:+15550192"
              className="py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center gap-1.5 text-xs font-bold transition active:scale-95 border border-border"
            >
              <Phone size={14} className="text-primary" />
              <span>Call Emma</span>
            </a>

            <a
              href={`sms:+15550192?body=Hi Emma, check in with me please. Your current location is: ${encodeURIComponent(location.address || "")}`}
              className="py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center gap-1.5 text-xs font-bold transition active:scale-95 border border-border"
            >
              <MessageCircle size={14} className="text-indigo-600" />
              <span>Message</span>
            </a>

            <button
              onClick={openGoogleMapsDirections}
              className="py-2.5 rounded-xl text-white flex items-center justify-center gap-1.5 text-xs font-bold transition active:scale-95 shadow-md"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Navigation size={14} />
              <span>Navigate</span>
              <ExternalLink size={10} className="opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
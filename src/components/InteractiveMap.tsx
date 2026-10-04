import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Layers, Crosshair, ZoomIn, ZoomOut, Shield, MapPin, Eye, EyeOff } from "lucide-react";
import { LocationPoint, GeofenceZone, PRESET_ZONES } from "@/lib/trackingStore";

interface InteractiveMapProps {
  location: LocationPoint;
  history?: LocationPoint[];
  zones?: GeofenceZone[];
  height?: string;
  zoom?: number;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

const TILE_PROVIDERS = {
  voyager: {
    name: "Clean Light",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
  },
  osm: {
    name: "Standard OSM",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
  },
  dark: {
    name: "Dark Map",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
};

export function InteractiveMap({
  location,
  history = [],
  zones = PRESET_ZONES,
  height = "100%",
  zoom = 16,
  interactive = true,
  onMapClick,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<keyof typeof TILE_PROVIDERS>("voyager");
  const [showZones, setShowZones] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [isCentered, setIsCentered] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [location.lat, location.lng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
    });

    mapRef.current = map;

    // Tile Layer
    const provider = TILE_PROVIDERS[activeLayer];
    const tileLayer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains,
      maxZoom: 19,
      attribution: provider.attribution,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Zones layer group
    const zonesGroup = L.layerGroup().addTo(map);
    zonesLayerRef.current = zonesGroup;

    // Emma's Custom Marker Icon
    const customIcon = L.divIcon({
      className: "custom-child-marker",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black tracking-wider">
            EM
          </div>
          <div class="absolute -bottom-1 w-2.5 h-2.5 bg-indigo-600 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 36],
      popupAnchor: [0, -36],
    });

    const marker = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);
    markerRef.current = marker;

    marker.bindPopup(`
      <div style="font-family: inherit; padding: 2px;">
        <div style="font-weight: 700; font-size: 13px; color: #1e293b;">Emma Parker</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${location.address || "Active Coordinates"}</div>
        <div style="font-size: 11px; font-weight: 600; color: ${location.isSafe ? "#10b981" : "#f59e0b"}; margin-top: 4px;">
          ${location.isSafe ? "✓ In Safe Zone" : "⚠ Outside Safe Boundary"}
        </div>
      </div>
    `);

    // Accuracy Circle
    const accCircle = L.circle([location.lat, location.lng], {
      radius: Math.max(15, location.accuracy || 20),
      color: "#3b82f6",
      fillColor: "#3b82f6",
      fillOpacity: 0.12,
      weight: 1,
    }).addTo(map);
    accuracyCircleRef.current = accCircle;

    // Breadcrumb Polyline
    const polyline = L.polyline([], {
      color: "#4f46e5",
      weight: 3.5,
      opacity: 0.75,
      dashArray: "6, 8",
      lineCap: "round",
    }).addTo(map);
    polylineRef.current = polyline;

    if (onMapClick) {
      map.on("click", (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer if changed
  useEffect(() => {
    if (!mapRef.current) return;
    const provider = TILE_PROVIDERS[activeLayer];
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(provider.url, {
      subdomains: provider.subdomains,
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [activeLayer]);

  // Update Geofence Zones Layer
  useEffect(() => {
    if (!mapRef.current || !zonesLayerRef.current) return;
    zonesLayerRef.current.clearLayers();

    if (!showZones) return;

    zones.forEach((z) => {
      const isSafe = z.type === "safe";
      const isRestricted = z.type === "restricted";

      const color = isSafe ? "#10b981" : isRestricted ? "#ef4444" : "#6366f1";
      const fillColor = isSafe ? "#34d399" : isRestricted ? "#f87171" : "#818cf8";

      // Zone Circle
      const circle = L.circle([z.lat, z.lng], {
        radius: z.radius,
        color: color,
        fillColor: fillColor,
        fillOpacity: isSafe ? 0.14 : 0.22,
        weight: 2,
        dashArray: isSafe ? "4, 6" : undefined,
      });

      // Zone Label Badge
      const zoneBadge = L.divIcon({
        className: "custom-zone-badge",
        html: `
          <div class="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur shadow-sm border border-slate-200 text-[10px] font-bold ${
            isSafe ? "text-emerald-700" : isRestricted ? "text-rose-700" : "text-indigo-700"
          } whitespace-nowrap flex items-center gap-1">
            <span>${isSafe ? "🛡️" : isRestricted ? "⚠️" : "📍"}</span>
            <span>${z.name}</span>
          </div>
        `,
        iconSize: [120, 20],
        iconAnchor: [60, -10],
      });

      const badgeMarker = L.marker([z.lat, z.lng], { icon: zoneBadge, interactive: false });

      circle.bindTooltip(`<b>${z.name}</b><br/><span style="font-size: 11px;">${z.description} (${z.radius}m)</span>`, {
        direction: "top",
      });

      zonesLayerRef.current?.addLayer(circle);
      zonesLayerRef.current?.addLayer(badgeMarker);
    });
  }, [zones, showZones]);

  // Update Marker, Accuracy & History Trail
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const latlng: [number, number] = [location.lat, location.lng];

    markerRef.current.setLatLng(latlng);
    markerRef.current.setPopupContent(`
      <div style="font-family: inherit; padding: 2px;">
        <div style="font-weight: 700; font-size: 13px; color: #1e293b;">Emma Parker</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${location.address || "Active Coordinates"}</div>
        <div style="font-size: 11px; font-weight: 600; color: ${location.isSafe ? "#10b981" : "#f59e0b"}; margin-top: 4px;">
          ${location.isSafe ? "✓ In Safe Zone: " + (location.zone || "") : "⚠ Outside Safe Boundary"}
        </div>
      </div>
    `);

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng(latlng);
      accuracyCircleRef.current.setRadius(Math.max(15, location.accuracy || 20));
    }

    if (isCentered) {
      mapRef.current.panTo(latlng, { animate: true, duration: 0.8 });
    }

    // Polyline breadcrumbs
    if (polylineRef.current) {
      if (showHistory && history.length > 0) {
        const points: [number, number][] = history.map((p) => [p.lat, p.lng]);
        points.push(latlng);
        polylineRef.current.setLatLngs(points);
      } else {
        polylineRef.current.setLatLngs([]);
      }
    }
  }, [location, history, showHistory, isCentered]);

  const handleCenter = () => {
    if (mapRef.current) {
      setIsCentered(true);
      mapRef.current.setView([location.lat, location.lng], 16, { animate: true });
    }
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const cycleLayer = () => {
    const keys: (keyof typeof TILE_PROVIDERS)[] = ["voyager", "osm", "dark"];
    const nextIdx = (keys.indexOf(activeLayer) + 1) % keys.length;
    setActiveLayer(keys[nextIdx]);
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl" style={{ height }}>
      {/* Map DOM Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Floating Control Toolbar */}
      {interactive && (
        <div className="absolute right-3 top-20 z-[1000] flex flex-col gap-2">
          {/* Center Location */}
          <button
            onClick={handleCenter}
            title="Recenter on Emma"
            className="w-10 h-10 rounded-xl bg-card/95 backdrop-blur shadow-md hover:bg-card border border-border flex items-center justify-center text-primary transition active:scale-95"
          >
            <Crosshair size={18} />
          </button>

          {/* Toggle Layers */}
          <button
            onClick={cycleLayer}
            title={`Layer: ${TILE_PROVIDERS[activeLayer].name}`}
            className="w-10 h-10 rounded-xl bg-card/95 backdrop-blur shadow-md hover:bg-card border border-border flex items-center justify-center text-foreground transition active:scale-95"
          >
            <Layers size={17} />
          </button>

          {/* Toggle Zones */}
          <button
            onClick={() => setShowZones(!showZones)}
            title={showZones ? "Hide Safe Zones" : "Show Safe Zones"}
            className={`w-10 h-10 rounded-xl backdrop-blur shadow-md border transition active:scale-95 flex items-center justify-center ${
              showZones
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600"
                : "bg-card/95 border-border text-muted-foreground"
            }`}
          >
            <Shield size={17} />
          </button>

          {/* Toggle Breadcrumb History Trail */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? "Hide Route Trail" : "Show Route Trail"}
            className={`w-10 h-10 rounded-xl backdrop-blur shadow-md border transition active:scale-95 flex items-center justify-center ${
              showHistory
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-600"
                : "bg-card/95 border-border text-muted-foreground"
            }`}
          >
            {showHistory ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>

          {/* Zoom controls */}
          <div className="flex flex-col rounded-xl overflow-hidden bg-card/95 backdrop-blur shadow-md border border-border mt-1">
            <button
              onClick={handleZoomIn}
              className="w-10 h-9 flex items-center justify-center text-foreground hover:bg-accent border-b border-border active:scale-95"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-9 flex items-center justify-center text-foreground hover:bg-accent active:scale-95"
            >
              <ZoomOut size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Status Pill on Top */}
      <div className="absolute left-3 top-3 z-[1000] flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-card/95 backdrop-blur shadow-md border border-border flex items-center gap-2 text-xs font-semibold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-foreground">
            {location.isSafe ? (
              <span className="text-emerald-600 font-bold">Safe Zone: {location.zone || "Verified"}</span>
            ) : (
              <span className="text-amber-600 font-bold">In Transit</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

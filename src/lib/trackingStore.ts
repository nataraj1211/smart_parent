// Smart Parent Monitoring: Live Tracking & SOS Shared State Management
import { emergencyAudio } from "./audioAlert";

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number; // km/h
  accuracy?: number; // meters
  heading?: number; // degrees
  address?: string;
  zone?: string;
  isSafe?: boolean;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: "safe" | "restricted" | "neutral";
  lat: number;
  lng: number;
  radius: number; // in meters
  description: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  initials: string;
  status: "idle" | "alerted" | "acknowledged";
}

export interface SOSState {
  isActive: boolean;
  triggeredAt: number | null;
  location: LocationPoint | null;
  reason: string;
  isSirenAudible: boolean;
  contactsNotified: string[];
}

// Preset Geofence Zones (Default coordinates centered around Brooklyn / New York, dynamically adaptable to any location)
export const PRESET_ZONES: GeofenceZone[] = [
  {
    id: "zone-school",
    name: "Lincoln Elementary School",
    type: "safe",
    lat: 40.6782,
    lng: -73.9442,
    radius: 250,
    description: "Designated Safe Zone: School Campus",
  },
  {
    id: "zone-home",
    name: "Home (42 Maple Street)",
    type: "safe",
    lat: 40.6715,
    lng: -73.9515,
    radius: 180,
    description: "Designated Safe Zone: Home Residence",
  },
  {
    id: "zone-park",
    name: "Prospect Park Activity Center",
    type: "safe",
    lat: 40.6602,
    lng: -73.9689,
    radius: 350,
    description: "Designated Safe Zone: Public Park",
  },
  {
    id: "zone-highway",
    name: "Highway Intersection",
    type: "restricted",
    lat: 40.6865,
    lng: -73.935,
    radius: 300,
    description: "High Risk Area: Restricted Traffic Zone",
  },
];

export const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: "mom",
    name: "Sarah Parker",
    relation: "Mother",
    phone: "+1 555-0192",
    initials: "MP",
    status: "idle",
  },
  {
    id: "dad",
    name: "David Parker",
    relation: "Father",
    phone: "+1 555-0193",
    initials: "DP",
    status: "idle",
  },
  {
    id: "emergency",
    name: "Emergency Police/Medical",
    relation: "Emergency 911/112",
    phone: "911",
    initials: "911",
    status: "idle",
  },
];

// Calculate distance in meters using Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check which zone point falls in
export function checkZone(lat: number, lng: number, zones: GeofenceZone[] = PRESET_ZONES) {
  for (const zone of zones) {
    const dist = calculateDistanceMeters(lat, lng, zone.lat, zone.lng);
    if (dist <= zone.radius) {
      return {
        zoneName: zone.name,
        isSafe: zone.type === "safe",
        zoneType: zone.type,
        distanceFromCenter: Math.round(dist),
      };
    }
  }
  return {
    zoneName: "In Transit / Outside Safe Zone",
    isSafe: false,
    zoneType: "neutral" as const,
    distanceFromCenter: 0,
  };
}

const STORAGE_KEYS = {
  LOCATION: "spm_child_location",
  HISTORY: "spm_location_history",
  SOS: "spm_sos_state",
  CONTACTS: "spm_emergency_contacts",
  MODE: "spm_tracking_mode", // 'live' | 'simulation'
};

class TrackingManager {
  private listeners: Set<() => void> = new Set();
  private channel: BroadcastChannel | null = null;
  private watchId: number | null = null;
  private simulationInterval: number | null = null;
  private simStep = 0;

  public currentLocation: LocationPoint;
  public locationHistory: LocationPoint[] = [];
  public sosState: SOSState;
  public contacts: EmergencyContact[] = DEFAULT_CONTACTS;
  public trackingMode: "live" | "simulation" = "simulation";
  public batteryLevel = 84;
  public isOnline = true;

  constructor() {
    // Default initial location: Near Lincoln Elementary School
    const initialLat = 40.6755;
    const initialLng = -73.9472;
    const zoneInfo = checkZone(initialLat, initialLng);

    this.currentLocation = {
      lat: initialLat,
      lng: initialLng,
      timestamp: Date.now(),
      speed: 0,
      accuracy: 8,
      heading: 45,
      address: "42 Maple Street, Brooklyn, NY",
      zone: zoneInfo.zoneName,
      isSafe: zoneInfo.isSafe,
    };

    this.sosState = {
      isActive: false,
      triggeredAt: null,
      location: null,
      reason: "",
      isSirenAudible: true,
      contactsNotified: [],
    };

    if (typeof window !== "undefined") {
      this.loadFromStorage();
      this.initBroadcastChannel();
      this.initBatteryListener();
    }
  }

  private loadFromStorage() {
    try {
      const savedLoc = localStorage.getItem(STORAGE_KEYS.LOCATION);
      if (savedLoc) this.currentLocation = JSON.parse(savedLoc);

      const savedHist = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedHist) this.locationHistory = JSON.parse(savedHist);

      const savedSOS = localStorage.getItem(STORAGE_KEYS.SOS);
      if (savedSOS) this.sosState = JSON.parse(savedSOS);

      const savedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      if (savedContacts) this.contacts = JSON.parse(savedContacts);

      const savedMode = localStorage.getItem(STORAGE_KEYS.MODE) as "live" | "simulation" | null;
      if (savedMode) this.trackingMode = savedMode;
    } catch {
      // fallback
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(this.currentLocation));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.locationHistory.slice(-50)));
      localStorage.setItem(STORAGE_KEYS.SOS, JSON.stringify(this.sosState));
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(this.contacts));
      localStorage.setItem(STORAGE_KEYS.MODE, this.trackingMode);
    } catch {
      // quota or private mode
    }
  }

  private initBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel("smart_parent_sync");
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === "LOCATION_UPDATE") {
          this.currentLocation = payload.location;
          this.locationHistory = payload.history || this.locationHistory;
          this.notify();
        } else if (type === "SOS_UPDATE") {
          this.sosState = payload;
          if (this.sosState.isActive && this.sosState.isSirenAudible) {
            emergencyAudio.startSiren();
          } else {
            emergencyAudio.stopSiren();
          }
          this.notify();
        }
      };

      // Also listen to storage events from other windows
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEYS.SOS && e.newValue) {
          this.sosState = JSON.parse(e.newValue);
          if (this.sosState.isActive && this.sosState.isSirenAudible) {
            emergencyAudio.startSiren();
          } else {
            emergencyAudio.stopSiren();
          }
          this.notify();
        } else if (e.key === STORAGE_KEYS.LOCATION && e.newValue) {
          this.currentLocation = JSON.parse(e.newValue);
          this.notify();
        }
      });
    } catch {
      // ignore
    }
  }

  private initBatteryListener() {
    try {
      const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; addEventListener: (t: string, cb: () => void) => void }> };
      if (nav.getBattery) {
        nav.getBattery().then((battery) => {
          this.batteryLevel = Math.round(battery.level * 100);
          this.notify();
          battery.addEventListener("levelchange", () => {
            this.batteryLevel = Math.round(battery.level * 100);
            this.notify();
          });
        });
      }
    } catch {
      // ignore
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private broadcast(type: string, payload: unknown) {
    this.saveToStorage();
    this.notify();
    try {
      this.channel?.postMessage({ type, payload });
    } catch {
      // ignore
    }
  }

  // Update position manually or from GPS
  public updateLocation(lat: number, lng: number, speed = 0, accuracy = 10, heading = 0, address?: string) {
    const zoneInfo = checkZone(lat, lng);
    const newPoint: LocationPoint = {
      lat,
      lng,
      timestamp: Date.now(),
      speed,
      accuracy,
      heading,
      address: address || `${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W`,
      zone: zoneInfo.zoneName,
      isSafe: zoneInfo.isSafe,
    };

    this.currentLocation = newPoint;
    this.locationHistory.push(newPoint);
    if (this.locationHistory.length > 50) this.locationHistory.shift();

    this.broadcast("LOCATION_UPDATE", {
      location: this.currentLocation,
      history: this.locationHistory,
    });
  }

  // Start Real Browser GPS Tracking
  public startLiveGPSTracking(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        resolve({ success: false, message: "Geolocation is not supported by your browser." });
        return;
      }

      this.stopSimulation();
      this.trackingMode = "live";

      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, accuracy, heading } = pos.coords;
          this.updateLocation(
            latitude,
            longitude,
            speed ? Math.round(speed * 3.6) : 0,
            accuracy ? Math.round(accuracy) : 10,
            heading || 0,
            "Live GPS Position"
          );
          resolve({ success: true, message: "Live GPS connected successfully!" });
        },
        (err) => {
          resolve({
            success: false,
            message: `GPS Permission error: ${err.message}. Falling back to simulation mode.`,
          });
          this.startSimulation();
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    });
  }

  public stopLiveGPSTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Realistic Simulation Routes
  public startSimulation(routeKey: "school_to_home" | "home_to_park" = "school_to_home") {
    this.stopLiveGPSTracking();
    this.stopSimulation();
    this.trackingMode = "simulation";

    // Route coordinates between Lincoln Elementary (40.6782, -73.9442) and Home (40.6715, -73.9515)
    const routes = {
      school_to_home: [
        { lat: 40.6782, lng: -73.9442, speed: 0, address: "Lincoln Elementary Campus" },
        { lat: 40.6774, lng: -73.9452, speed: 4, address: "Kingston Ave & St Marks Ave" },
        { lat: 40.6761, lng: -73.9465, speed: 5, address: "Prospect Pl & Brooklyn Ave" },
        { lat: 40.6745, lng: -73.9482, speed: 12, address: "Park Pl & New York Ave" },
        { lat: 40.6730, lng: -73.9498, speed: 18, address: "Sterling Pl Transit Corridor" },
        { lat: 40.6715, lng: -73.9515, speed: 0, address: "42 Maple Street (Home)" },
      ],
      home_to_park: [
        { lat: 40.6715, lng: -73.9515, speed: 0, address: "42 Maple Street (Home)" },
        { lat: 40.6685, lng: -73.9560, speed: 6, address: "Bedford Ave Walkway" },
        { lat: 40.6650, lng: -73.9610, speed: 8, address: "Empire Blvd Crossing" },
        { lat: 40.6620, lng: -73.9655, speed: 5, address: "Prospect Park East Gate" },
        { lat: 40.6602, lng: -73.9689, speed: 0, address: "Prospect Park Activity Center" },
      ],
    };

    const points = routes[routeKey] || routes.school_to_home;
    this.simStep = 0;

    const tick = () => {
      const pt = points[this.simStep % points.length];
      // Add slight jitter for realism
      const jitterLat = pt.lat + (Math.random() - 0.5) * 0.0003;
      const jitterLng = pt.lng + (Math.random() - 0.5) * 0.0003;
      const jitterSpeed = Math.max(0, Math.round(pt.speed + (Math.random() - 0.5) * 2));

      this.updateLocation(jitterLat, jitterLng, jitterSpeed, 6, 180, pt.address);
      this.simStep++;
    };

    tick();
    this.simulationInterval = window.setInterval(tick, 3500);
  }

  public stopSimulation() {
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // Trigger SOS Emergency
  public triggerSOS(reason = "Emergency SOS button triggered by child") {
    this.sosState = {
      isActive: true,
      triggeredAt: Date.now(),
      location: { ...this.currentLocation },
      reason,
      isSirenAudible: true,
      contactsNotified: this.contacts.map((c) => c.name),
    };

    // Play siren sound
    emergencyAudio.startSiren();

    // Trigger haptic vibration if supported on mobile
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([400, 200, 400, 200, 600]);
    }

    // Try Web Notification
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("🚨 SOS EMERGENCY ALERT!", {
        body: `Emma triggered SOS! Last location: ${this.currentLocation.address || "Active Coordinates"}. Tap to open.`,
        icon: "/favicon.ico",
        requireInteraction: true,
      });
    } else if (typeof Notification !== "undefined" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    this.broadcast("SOS_UPDATE", this.sosState);
  }

  // Cancel / Resolve SOS Emergency
  public cancelSOS() {
    emergencyAudio.stopSiren();
    this.sosState = {
      isActive: false,
      triggeredAt: null,
      location: null,
      reason: "",
      isSirenAudible: false,
      contactsNotified: [],
    };
    this.broadcast("SOS_UPDATE", this.sosState);
  }

  public toggleSiren() {
    const nextState = !this.sosState.isSirenAudible;
    this.sosState.isSirenAudible = nextState;
    if (nextState && this.sosState.isActive) {
      emergencyAudio.startSiren();
    } else {
      emergencyAudio.stopSiren();
    }
    this.broadcast("SOS_UPDATE", this.sosState);
  }
}

export const trackingStore = new TrackingManager();

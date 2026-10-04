// Smart Parent Monitoring: Authentication, Family Pairing & Cross-Device Sync State

export interface ChildUser {
  id: string;
  name: string;
  age: number;
  familyCode: string;
  parentId: string;
  deviceStatus: "online" | "idle" | "offline";
  isLocked: boolean;
  studyMode: boolean;
  lastSeen: number;
}

export interface ParentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  familyCode: string;
  children: ChildUser[];
  createdAt: number;
}

export interface AppRequest {
  id: string;
  appName: string;
  developer: string;
  category: string;
  size: string;
  ageRating: string;
  rating: number;
  letter: string;
  color: string;
  requestedBy: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "restricted";
  restrictions?: string;
  timestamp: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "checkin" | "sos" | "app_request" | "geofence" | "screentime" | "system";
  read: boolean;
  timestamp: number;
  fromChild?: string;
}

const STORAGE_KEYS = {
  PARENT_USER: "spm_current_parent",
  CHILD_USER: "spm_current_child",
  USER_TYPE: "spm_user_type",
  REGISTERED_PARENTS: "spm_registered_parents",
  APP_REQUESTS: "spm_app_requests",
  NOTIFICATIONS: "spm_notifications",
  REMOTE_LOCK: "spm_remote_lock",
  STUDY_MODE: "spm_study_mode",
};

// Default Pre-seeded Mock Data
const DEFAULT_PARENT: ParentUser = {
  id: "parent-sarah-01",
  name: "Sarah Parker",
  email: "parent@email.com",
  phone: "+1 555-0192",
  familyCode: "SPM-7492",
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  children: [
    {
      id: "child-emma-01",
      name: "Emma",
      age: 12,
      familyCode: "SPM-7492",
      parentId: "parent-sarah-01",
      deviceStatus: "online",
      isLocked: false,
      studyMode: false,
      lastSeen: Date.now(),
    },
  ],
};

const DEFAULT_CHILD: ChildUser = DEFAULT_PARENT.children[0];

const DEFAULT_APP_REQUESTS: AppRequest[] = [
  {
    id: "req-roblox-01",
    appName: "Roblox",
    developer: "Roblox Corporation",
    category: "Games",
    size: "128 MB",
    ageRating: "10+",
    rating: 4.5,
    letter: "R",
    color: "from-green-400 to-emerald-600",
    requestedBy: "Emma",
    reason:
      "All my friends play it after school. Can I please install it? I promise to follow my screen time limits!",
    status: "pending",
    timestamp: Date.now() - 5 * 60 * 1000,
  },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "App Install Requested",
    message: "Emma requested to install Roblox",
    type: "app_request",
    read: false,
    timestamp: Date.now() - 5 * 60 * 1000,
    fromChild: "Emma",
  },
  {
    id: "notif-2",
    title: "Safe Arrival at School",
    message: "Emma entered Lincoln Elementary School Zone",
    type: "geofence",
    read: false,
    timestamp: Date.now() - 45 * 60 * 1000,
    fromChild: "Emma",
  },
  {
    id: "notif-3",
    title: "Check-in Received",
    message: "Emma checked in: 'I'm Okay!'",
    type: "checkin",
    read: true,
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    fromChild: "Emma",
  },
];

function generateFamilyCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "23456789";
  let code = "SPM-";
  for (let i = 0; i < 2; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 2; i++) code += nums.charAt(Math.floor(Math.random() * nums.length));
  return code;
}

class AuthManager {
  private listeners: Set<() => void> = new Set();
  private channel: BroadcastChannel | null = null;

  public currentUserType: "parent" | "child" | null = "parent";
  public currentParent: ParentUser = DEFAULT_PARENT;
  public currentChild: ChildUser = DEFAULT_CHILD;
  public registeredParents: ParentUser[] = [DEFAULT_PARENT];
  public appRequests: AppRequest[] = DEFAULT_APP_REQUESTS;
  public notifications: NotificationItem[] = DEFAULT_NOTIFICATIONS;
  public isRemoteLocked = false;
  public studyModeActive = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage();
      this.initBroadcastChannel();
    }
  }

  private loadFromStorage() {
    try {
      const reg = localStorage.getItem(STORAGE_KEYS.REGISTERED_PARENTS);
      if (reg) {
        this.registeredParents = JSON.parse(reg);
      } else {
        localStorage.setItem(
          STORAGE_KEYS.REGISTERED_PARENTS,
          JSON.stringify([DEFAULT_PARENT])
        );
      }

      const pUser = localStorage.getItem(STORAGE_KEYS.PARENT_USER);
      if (pUser) {
        this.currentParent = JSON.parse(pUser);
      } else {
        this.currentParent = this.registeredParents[0] || DEFAULT_PARENT;
      }

      const cUser = localStorage.getItem(STORAGE_KEYS.CHILD_USER);
      if (cUser) {
        this.currentChild = JSON.parse(cUser);
      } else {
        this.currentChild = this.currentParent.children[0] || DEFAULT_CHILD;
      }

      const uType = localStorage.getItem(STORAGE_KEYS.USER_TYPE) as
        | "parent"
        | "child"
        | null;
      if (uType) this.currentUserType = uType;

      const reqs = localStorage.getItem(STORAGE_KEYS.APP_REQUESTS);
      if (reqs) this.appRequests = JSON.parse(reqs);

      const notifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (notifs) this.notifications = JSON.parse(notifs);

      const lock = localStorage.getItem(STORAGE_KEYS.REMOTE_LOCK);
      if (lock) this.isRemoteLocked = JSON.parse(lock);

      const sm = localStorage.getItem(STORAGE_KEYS.STUDY_MODE);
      if (sm) this.studyModeActive = JSON.parse(sm);
    } catch {
      // fallback
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.PARENT_USER, JSON.stringify(this.currentParent));
      localStorage.setItem(STORAGE_KEYS.CHILD_USER, JSON.stringify(this.currentChild));
      if (this.currentUserType) {
        localStorage.setItem(STORAGE_KEYS.USER_TYPE, this.currentUserType);
      }
      localStorage.setItem(
        STORAGE_KEYS.REGISTERED_PARENTS,
        JSON.stringify(this.registeredParents)
      );
      localStorage.setItem(
        STORAGE_KEYS.APP_REQUESTS,
        JSON.stringify(this.appRequests)
      );
      localStorage.setItem(
        STORAGE_KEYS.NOTIFICATIONS,
        JSON.stringify(this.notifications)
      );
      localStorage.setItem(
        STORAGE_KEYS.REMOTE_LOCK,
        JSON.stringify(this.isRemoteLocked)
      );
      localStorage.setItem(
        STORAGE_KEYS.STUDY_MODE,
        JSON.stringify(this.studyModeActive)
      );
    } catch {
      // ignore storage errors
    }
  }

  private initBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel("smart_parent_sync");
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === "AUTH_SYNC") {
          this.loadFromStorage();
          this.notify();
        } else if (type === "APP_REQUEST_UPDATE") {
          this.appRequests = payload;
          this.notify();
        } else if (type === "REMOTE_LOCK_UPDATE") {
          this.isRemoteLocked = payload;
          this.notify();
        } else if (type === "STUDY_MODE_UPDATE") {
          this.studyModeActive = payload;
          this.notify();
        } else if (type === "CHECK_IN_ALERT") {
          this.notifications.unshift(payload);
          this.notify();
        }
      };

      window.addEventListener("storage", () => {
        this.loadFromStorage();
        this.notify();
      });
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

  private broadcast(type: string, payload?: unknown) {
    this.saveToStorage();
    this.notify();
    try {
      this.channel?.postMessage({ type, payload });
    } catch {
      // ignore
    }
  }

  // --- Registration & Login ---

  public registerParent(data: {
    name: string;
    email: string;
    phone?: string;
    childName: string;
    childAge: number;
    password?: string;
  }): { success: boolean; error?: string; familyCode: string; parent: ParentUser } {
    if (!data.name.trim() || !data.email.trim()) {
      return { success: false, error: "Please enter your name and email address.", familyCode: "" , parent: this.currentParent };
    }
    if (!data.childName.trim()) {
      return { success: false, error: "Please enter your child's name.", familyCode: "", parent: this.currentParent };
    }

    const familyCode = generateFamilyCode();
    const parentId = `parent-${Date.now().toString(36)}`;
    const childId = `child-${Date.now().toString(36)}`;

    const newChild: ChildUser = {
      id: childId,
      name: data.childName.trim(),
      age: Number(data.childAge) || 10,
      familyCode,
      parentId,
      deviceStatus: "online",
      isLocked: false,
      studyMode: false,
      lastSeen: Date.now(),
    };

    const newParent: ParentUser = {
      id: parentId,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || "+1 555-0100",
      familyCode,
      createdAt: Date.now(),
      children: [newChild],
    };

    // Add to registered list
    this.registeredParents.unshift(newParent);
    this.currentParent = newParent;
    this.currentChild = newChild;
    this.currentUserType = "parent";

    // Add welcoming notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: "Family Account Activated",
      message: `Account created for ${newParent.name}. Child Pairing Code is ${familyCode}.`,
      type: "system",
      read: false,
      timestamp: Date.now(),
    });

    this.broadcast("AUTH_SYNC");
    return { success: true, familyCode, parent: newParent };
  }

  public loginParent(
    email: string,
    _password?: string
  ): { success: boolean; error?: string; parent?: ParentUser } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: "Please enter your email address." };
    }

    // Find in registered parents
    const matched = this.registeredParents.find(
      (p) => p.email.toLowerCase() === cleanEmail
    );

    if (matched) {
      this.currentParent = matched;
      this.currentChild = matched.children[0] || DEFAULT_CHILD;
      this.currentUserType = "parent";
      this.broadcast("AUTH_SYNC");
      return { success: true, parent: matched };
    }

    // Fallback: If not found, create a demo account with this email
    const nameFromEmail = cleanEmail.split("@")[0];
    const capitalizedName =
      nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    const reg = this.registerParent({
      name: capitalizedName,
      email: cleanEmail,
      childName: "Alex",
      childAge: 11,
    });

    return { success: true, parent: reg.parent };
  }

  public loginChild(
    familyCodeOrName: string,
    childName?: string
  ): { success: boolean; error?: string; child?: ChildUser } {
    const clean = familyCodeOrName.trim().toUpperCase();
    if (!clean) {
      return { success: false, error: "Please enter your Family Pairing Code or Child ID." };
    }

    // Find matching parent by family code
    const parent = this.registeredParents.find(
      (p) => p.familyCode.toUpperCase() === clean
    );

    if (parent) {
      // Find matching child or take first
      let child = parent.children[0];
      if (childName && childName.trim()) {
        const found = parent.children.find(
          (c) => c.name.toLowerCase() === childName.trim().toLowerCase()
        );
        if (found) child = found;
      }

      this.currentParent = parent;
      this.currentChild = child;
      this.currentUserType = "child";
      this.broadcast("AUTH_SYNC");
      return { success: true, child };
    }

    // Check if entered code matches current family code directly
    if (clean === this.currentParent.familyCode.toUpperCase() || clean.includes("SPM")) {
      this.currentUserType = "child";
      this.broadcast("AUTH_SYNC");
      return { success: true, child: this.currentChild };
    }

    // If code format is valid or custom ID, link to current or default family
    this.currentUserType = "child";
    if (childName && childName.trim()) {
      this.currentChild = {
        ...this.currentChild,
        name: childName.trim(),
      };
    }
    this.broadcast("AUTH_SYNC");
    return { success: true, child: this.currentChild };
  }

  // --- Family & Child Management ---

  public addChild(name: string, age: number): ChildUser {
    const newChild: ChildUser = {
      id: `child-${Date.now().toString(36)}`,
      name: name.trim() || "Child",
      age: Number(age) || 10,
      familyCode: this.currentParent.familyCode,
      parentId: this.currentParent.id,
      deviceStatus: "online",
      isLocked: false,
      studyMode: false,
      lastSeen: Date.now(),
    };

    this.currentParent.children.push(newChild);
    this.currentChild = newChild;
    this.broadcast("AUTH_SYNC");
    return newChild;
  }

  public switchActiveChild(childId: string) {
    const found = this.currentParent.children.find((c) => c.id === childId);
    if (found) {
      this.currentChild = found;
      this.broadcast("AUTH_SYNC");
    }
  }

  // --- App Requests ---

  public submitAppRequest(appName: string, reason: string, category = "Games") {
    const req: AppRequest = {
      id: `req-${Date.now().toString(36)}`,
      appName: appName.trim(),
      developer: "Store Developer",
      category,
      size: "95 MB",
      ageRating: "9+",
      rating: 4.6,
      letter: appName.charAt(0).toUpperCase() || "A",
      color: "from-blue-500 to-indigo-600",
      requestedBy: this.currentChild.name,
      reason: reason.trim() || "I want to use this app with my class.",
      status: "pending",
      timestamp: Date.now(),
    };

    this.appRequests.unshift(req);

    // Notify parent
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: "New App Request",
      message: `${this.currentChild.name} requested permission to install ${appName}`,
      type: "app_request",
      read: false,
      timestamp: Date.now(),
      fromChild: this.currentChild.name,
    });

    this.broadcast("APP_REQUEST_UPDATE", this.appRequests);
    return req;
  }

  public handleAppRequest(
    requestId: string,
    action: "approved" | "rejected" | "restricted",
    restrictions?: string
  ) {
    const req = this.appRequests.find((r) => r.id === requestId);
    if (req) {
      req.status = action;
      if (restrictions) req.restrictions = restrictions;

      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `App ${action.toUpperCase()}`,
        message: `${req.appName} was ${action} for ${req.requestedBy}${restrictions ? ` (${restrictions})` : ""}`,
        type: "app_request",
        read: false,
        timestamp: Date.now(),
      });

      this.broadcast("APP_REQUEST_UPDATE", this.appRequests);
    }
  }

  // --- Remote Device Controls ---

  public toggleRemoteLock(locked?: boolean): boolean {
    this.isRemoteLocked = locked !== undefined ? locked : !this.isRemoteLocked;
    this.currentChild.isLocked = this.isRemoteLocked;

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: this.isRemoteLocked ? "Device Remotely Locked" : "Device Unlocked",
      message: this.isRemoteLocked
        ? `Child device for ${this.currentChild.name} has been remotely locked.`
        : `Device for ${this.currentChild.name} has been unlocked.`,
      type: "system",
      read: false,
      timestamp: Date.now(),
    });

    this.broadcast("REMOTE_LOCK_UPDATE", this.isRemoteLocked);
    return this.isRemoteLocked;
  }

  public toggleStudyMode(active?: boolean): boolean {
    this.studyModeActive = active !== undefined ? active : !this.studyModeActive;
    this.currentChild.studyMode = this.studyModeActive;

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: this.studyModeActive ? "Study Mode Activated" : "Study Mode Ended",
      message: this.studyModeActive
        ? `Distracting apps blocked on ${this.currentChild.name}'s device.`
        : `Study mode turned off.`,
      type: "screentime",
      read: false,
      timestamp: Date.now(),
    });

    this.broadcast("STUDY_MODE_UPDATE", this.studyModeActive);
    return this.studyModeActive;
  }

  public sendChildCheckIn(message = "I'm Okay!") {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Check-in from ${this.currentChild.name}`,
      message: `${this.currentChild.name} checked in: "${message}"`,
      type: "checkin",
      read: false,
      timestamp: Date.now(),
      fromChild: this.currentChild.name,
    };

    this.notifications.unshift(notif);
    this.broadcast("CHECK_IN_ALERT", notif);
    return notif;
  }

  public markAllNotificationsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.broadcast("AUTH_SYNC");
  }

  public clearAllNotifications() {
    this.notifications = [];
    this.broadcast("AUTH_SYNC");
  }

  public logout() {
    this.currentUserType = null;
    this.broadcast("AUTH_SYNC");
  }
}

export const authStore = new AuthManager();

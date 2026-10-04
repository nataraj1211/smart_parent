import { Link } from "@tanstack/react-router";
import { Home, MapPin, BarChart3, Bell, User } from "lucide-react";

const items = [
  { to: "/parent-dashboard", icon: Home, label: "Home" },
  { to: "/live-tracking", icon: MapPin, label: "Track" },
  { to: "/screen-time", icon: BarChart3, label: "Stats" },
  { to: "/app-approval", icon: Bell, label: "Alerts" },
  { to: "/parent-dashboard", icon: User, label: "Profile" },
];

export function BottomNav({ active }: { active?: string }) {
  return (
    <nav className="sticky bottom-0 bg-card border-t border-border px-2 py-2 flex justify-around shadow-[0_-4px_20px_-8px_rgba(59,130,246,0.15)]">
      {items.map((item, i) => {
        const Icon = item.icon;
        const isActive = active === item.label;
        return (
          <Link
            key={i}
            to={item.to}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className={isActive ? "p-2 rounded-xl bg-primary/10" : "p-2"}>
              <Icon size={20} />
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
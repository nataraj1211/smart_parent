import { ReactNode } from "react";

export function PhoneFrame({ children, statusBarDark = false }: { children: ReactNode; statusBarDark?: boolean }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div
        className={`flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold ${
          statusBarDark ? "text-white" : "text-foreground"
        }`}
      >
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span>●●●●</span>
          <span>5G</span>
          <span>100%</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
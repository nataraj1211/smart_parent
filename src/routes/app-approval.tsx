import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  X,
  Star,
  Download,
  Shield,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame } from "@/components/PhoneFrame";
import { authStore, AppRequest } from "@/lib/authStore";

export const Route = createFileRoute("/app-approval")({
  component: AppApproval,
});

function AppApproval() {
  const [appRequests, setAppRequests] = useState<AppRequest[]>(authStore.appRequests);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [restrictionsModalOpen, setRestrictionsModalOpen] = useState(false);
  const [timeLimit, setTimeLimit] = useState("45 mins / day");

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setAppRequests([...authStore.appRequests]);
    });
    return unsub;
  }, []);

  const pendingRequests = appRequests.filter((r) => r.status === "pending");
  const currentReq = pendingRequests[selectedIndex] || pendingRequests[0] || appRequests[0];

  const handleApprove = () => {
    if (!currentReq) return;
    authStore.handleAppRequest(currentReq.id, "approved");
    toast.success(`Approved ${currentReq.appName} for ${currentReq.requestedBy}!`, {
      icon: "✅",
    });
  };

  const handleReject = () => {
    if (!currentReq) return;
    authStore.handleAppRequest(currentReq.id, "rejected");
    toast.error(`Rejected ${currentReq.appName} install request.`, {
      icon: "❌",
    });
  };

  const handleApproveWithRestrictions = () => {
    if (!currentReq) return;
    authStore.handleAppRequest(
      currentReq.id,
      "restricted",
      `Time limit: ${timeLimit}`
    );
    toast.success(
      `Approved ${currentReq.appName} with restrictions: ${timeLimit}`,
      { icon: "⏱️" }
    );
    setRestrictionsModalOpen(false);
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col px-6 pt-3 pb-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/parent-dashboard"
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <div className="font-bold text-base">App Approval Request</div>
            <div className="text-xs text-muted-foreground">
              {pendingRequests.length > 0
                ? `${pendingRequests.length} pending approval`
                : "All requests reviewed"}
            </div>
          </div>
        </div>

        {/* If there are multiple pending requests, let parent toggle between them */}
        {pendingRequests.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {pendingRequests.map((req, idx) => (
              <button
                key={req.id}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                  idx === selectedIndex
                    ? "bg-primary text-white border-primary"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                {req.appName}
              </button>
            ))}
          </div>
        )}

        {currentReq && currentReq.status === "pending" ? (
          <>
            {/* App Details Card */}
            <div className="mt-5 p-5 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)]">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
                    currentReq.color || "from-green-400 to-emerald-600"
                  } flex items-center justify-center text-white shadow-lg`}
                >
                  <span className="text-3xl font-black">{currentReq.letter || "A"}</span>
                </div>
                <h2 className="text-xl font-bold mt-4">{currentReq.appName}</h2>
                <div className="text-xs text-muted-foreground">
                  {currentReq.developer} · {currentReq.category}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1 font-semibold">
                    <Star size={12} className="fill-warning text-warning" />{" "}
                    {currentReq.rating || 4.5}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{currentReq.size || "128 MB"}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning font-bold text-[10px]">
                    {currentReq.ageRating || "10+"}
                  </span>
                </div>
              </div>

              {/* Child's Request Reason */}
              <div className="mt-5 p-3 rounded-2xl bg-secondary text-xs">
                <div className="flex items-center gap-2 font-semibold mb-1.5">
                  <Info size={13} className="text-primary" /> Why {currentReq.requestedBy} wants
                  this
                </div>
                <p className="text-muted-foreground italic">"{currentReq.reason}"</p>
              </div>

              {/* Safety Permissions */}
              <div className="mt-4 space-y-2">
                <PermissionRow
                  icon={<Shield size={14} />}
                  label="In-app purchases"
                  warn
                  desc="Parent approval required"
                />
                <PermissionRow
                  icon={<Shield size={14} />}
                  label="Online multiplayer chat"
                  warn
                  desc="Safety filter applied"
                />
                <PermissionRow
                  icon={<Shield size={14} />}
                  label="Location services"
                  desc="Disabled by parent policy"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-6 space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  className="py-3.5 rounded-2xl bg-card border border-border font-semibold flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 active:scale-95 transition cursor-pointer"
                >
                  <X size={18} /> Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="py-3.5 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-glow)] active:scale-95 transition cursor-pointer"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Check size={18} /> Approve
                </button>
              </div>

              <button
                type="button"
                onClick={() => setRestrictionsModalOpen(true)}
                className="w-full py-3 rounded-2xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Clock size={15} /> Approve with Time Restrictions
              </button>
            </div>
          </>
        ) : (
          /* Empty / All Reviewed State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h2 className="text-xl font-bold">All Caught Up!</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                There are no pending app installation requests from your children.
              </p>
            </div>

            {/* History List */}
            <div className="w-full max-w-xs pt-4 space-y-2 text-left">
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <History size={13} /> Recent Review History
              </div>
              {appRequests.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-card border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold">{r.appName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Requested by {r.requestedBy}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      r.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : r.status === "restricted"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-rose-500/15 text-rose-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/parent-dashboard"
              className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow"
            >
              Return to Dashboard
            </Link>
          </div>
        )}

        {/* ===================== RESTRICTIONS MODAL ===================== */}
        {restrictionsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Set App Usage Restrictions</h3>
                </div>
                <button
                  onClick={() => setRestrictionsModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Approve <b>{currentReq?.appName}</b> with specific limits.
              </p>

              <div className="space-y-2">
                {[
                  "30 mins / day",
                  "45 mins / day",
                  "1 hour / day",
                  "Weekends only (2 hrs)",
                  "After homework only (6-8 PM)",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTimeLimit(preset)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition ${
                      timeLimit === preset
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary border-border hover:border-primary/40"
                    }`}
                  >
                    <span>{preset}</span>
                    {timeLimit === preset && <Check size={14} />}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestrictionsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveWithRestrictions}
                  className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold shadow"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Confirm & Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

function PermissionRow({
  icon,
  label,
  warn,
  desc,
}: {
  icon: React.ReactNode;
  label: string;
  warn?: boolean;
  desc?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
          warn ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{label}</div>
        {desc && <div className="text-[10px] text-muted-foreground truncate">{desc}</div>}
      </div>
      {warn && <span className="text-[10px] font-semibold text-warning">Caution</span>}
    </div>
  );
}
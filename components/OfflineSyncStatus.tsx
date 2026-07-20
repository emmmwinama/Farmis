"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, Loader2 } from "lucide-react";
import { flushOfflineQueue, getOfflineQueue, subscribeOfflineQueue } from "@/lib/offlineQueue";

export default function OfflineSyncStatus() {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(false);

  const refresh = () => setPending(getOfflineQueue().length);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeOfflineQueue(refresh);

    async function sync() {
      if (getOfflineQueue().length === 0) return;
      setSyncing(true);
      const result = await flushOfflineQueue();
      setSyncing(false);
      setLastSynced(result.synced > 0);
      refresh();
      if (result.synced > 0) window.setTimeout(() => setLastSynced(false), 3500);
    }

    sync();
    window.addEventListener("online", sync);
    const interval = window.setInterval(sync, 30000);

    return () => {
      unsubscribe();
      window.removeEventListener("online", sync);
      window.clearInterval(interval);
    };
  }, []);

  if (pending === 0 && !syncing && !lastSynced) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
         style={{ background: "#0F172A", color: "white", border: "1px solid rgba(125,211,252,0.35)" }}>
      {syncing ? <Loader2 size={17} className="animate-spin text-sky-200" /> : pending > 0 ? <CloudOff size={17} className="text-sky-200" /> : <CheckCircle2 size={17} className="text-cyan-200" />}
      <div>
        <p className="text-sm font-bold">{syncing ? "Syncing saved work" : pending > 0 ? `${pending} item${pending === 1 ? "" : "s"} queued` : "Offline work synced"}</p>
        <p className="text-xs text-slate-300">{pending > 0 ? "AgriVault will retry when online." : "Your records are up to date."}</p>
      </div>
    </div>
  );
}

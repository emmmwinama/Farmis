import { ShieldCheck } from "lucide-react";

export default function AgriVaultLogo({
  collapsed = false,
  className = "",
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-200 flex items-center justify-center flex-shrink-0 ring-1 ring-sky-300/20">
        <ShieldCheck size={21} strokeWidth={2.5} />
      </div>
      {!collapsed && (
        <div>
          <p className="text-white font-extrabold text-base leading-none tracking-tight">AgriVault</p>
          <p className="text-white/45 text-[10px] font-semibold tracking-widest uppercase">Farm Records</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { Mic, X, PanelLeftOpen, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface AICoachHeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenIntelligence?: () => void;
}

export function AICoachHeader({ onToggleSidebar, isSidebarOpen, onOpenIntelligence }: AICoachHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="relative flex items-center justify-between h-[90px] px-6 lg:px-10 border-b border-white/20 overflow-hidden"
      style={{ background: "#02000f" }}
    >
      {/* Left: Sidebar toggle + Avatar + Cia info */}
      <div className="flex items-center gap-4">
        {/* Sidebar toggle — only visible when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)] transition-all"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}

        {/* Robot icon */}
        <div className="relative w-[34px] h-[34px] shrink-0">
          <Image src="/chatai/fi_18525350.svg" alt="Cia" fill className="object-contain" />
        </div>

        {/* Name + subtitle */}
        <div className="flex flex-col gap-1">
          <span className="text-[24px] font-medium italic text-white leading-none">
            Cia
          </span>
          <div className="flex items-center gap-1 text-[14px] text-white/50 leading-[1.2]">
            <span>Powered by Balancia</span>
            <span>.</span>
            <span>Always here to help</span>
          </div>
        </div>
      </div>

      {/* Right: Intelligence + Voice Mode + Close */}
      <div className="flex items-center gap-4">
        {/* Intelligence Files button */}
        {onOpenIntelligence && (
          <button
            onClick={onOpenIntelligence}
            className="flex items-center justify-center w-[44px] h-[44px] rounded-[11px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
            aria-label="Intelligence Files"
            title="Intelligence Files"
          >
            <FolderOpen className="w-[21px] h-[21px] text-white/70" />
          </button>
        )}

        {/* Voice Mode button */}
        <button
          onClick={() => router.push("/voice-assistant")}
          className="flex items-center gap-[6px] h-[46px] px-4 py-[10px] bg-[#059669] rounded-[10px] border border-white/20 text-white hover:brightness-110 transition-all"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.17) 0%, transparent 70%), linear-gradient(90deg, #059669 0%, #059669 100%)",
          }}
        >
          <Mic className="w-[22px] h-[22px]" />
          <span className="text-[17px] font-medium tracking-[-0.16px] hidden sm:inline">
            Voice Mode
          </span>
        </button>

        {/* Close button */}
        <button
          onClick={() => router.push("/dashboard?tab=overview")}
          className="flex items-center justify-center w-[44px] h-[44px] rounded-[11px] border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
          aria-label="Close"
        >
          <X className="w-[21px] h-[21px] text-white/70" />
        </button>
      </div>
    </header>
  );
}

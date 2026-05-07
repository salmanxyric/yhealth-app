"use client";

import { MicOff } from "lucide-react";
import { useRouter } from "next/navigation";

export function SpeechNotSupported() {
  const router = useRouter();

  return (
    <div
      className="relative w-full h-full flex items-center justify-center z-50"
      style={{ backgroundColor: "#0B0F14" }}
    >
      <div className="text-center px-4">
        <MicOff className="w-16 h-16 mx-auto mb-4" style={{ color: "#F87171" }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#E0E0E0" }}>
          Voice Not Supported
        </h2>
        <p className="mb-6" style={{ color: "#888" }}>
          Please use Chrome, Edge, or Safari.
        </p>
        <button
          onClick={() => router.push("/dashboard?tab=ai-coach")}
          className="px-6 py-3 rounded-xl font-medium transition-all"
          style={{
            background: "linear-gradient(135deg, #1DE9B6, #00E5FF)",
            color: "#0B0F14",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          Use Text Chat
        </button>
      </div>
    </div>
  );
}

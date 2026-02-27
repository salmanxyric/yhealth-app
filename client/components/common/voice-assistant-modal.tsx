"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useVoiceAssistant } from "@/app/context/VoiceAssistantContext";
import { VoiceAssistantTab } from "@/app/(pages)/dashboard/components/tabs/VoiceAssistantTab";

export function VoiceAssistantModal() {
  const { isOpen, closeVoiceAssistant } = useVoiceAssistant();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeVoiceAssistant}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal - Full Screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Voice Assistant Content */}
            <div className="w-full h-full overflow-hidden">
              <VoiceAssistantTab />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

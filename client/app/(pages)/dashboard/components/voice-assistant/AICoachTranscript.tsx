"use client";

import { AnimatePresence, motion } from "framer-motion";

interface AICoachTranscriptProps {
  text: string;
  visible: boolean;
}

export function AICoachTranscript({ text, visible }: AICoachTranscriptProps) {
  return (
    <AnimatePresence>
      {visible && text && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-start"
          style={{ gap: "4.125px", width: "777px" }}
        >
          <div
            className="flex items-start"
            style={{
              height: "15px",
              width: "67px",
              paddingLeft: "8px",
              paddingRight: "8px",
            }}
          >
            <p
              className="whitespace-nowrap font-bold uppercase"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                lineHeight: "15px",
                letterSpacing: "0.5px",
                color: "#6a7282",
                margin: 0,
              }}
            >
              AI Coach
            </p>
          </div>

          <div
            className="relative shrink-0"
            style={{
              width: "777px",
              height: "74px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderTopLeftRadius: "6px",
              borderTopRightRadius: "16px",
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "16px",
              boxShadow: "0 0 20px 0 rgba(139,92,246,0.1)",
            }}
          >
            <p
              className="absolute"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "22.75px",
                color: "#ffffff",
                left: "19.85px",
                top: "13px",
                width: "708px",
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

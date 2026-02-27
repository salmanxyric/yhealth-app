"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "scale" | "frequency" | "text";
  options?: string[];
  scaleRange?: { min: number; max: number; labels?: string[] };
}

interface CheckInQuestionProps {
  question: Question;
  onRespond: (value: number | string, text?: string) => void;
}

export function CheckInQuestion({ question, onRespond }: CheckInQuestionProps) {
  const [selectedValue, setSelectedValue] = useState<number | string | null>(null);
  const [textInput, setTextInput] = useState("");

  const handleSubmit = () => {
    if (selectedValue !== null) {
      onRespond(selectedValue, textInput.trim() || undefined);
      setSelectedValue(null);
      setTextInput("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Scale Question */}
      {question.type === "scale" && question.scaleRange && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
            <span>{question.scaleRange.labels?.[0] || "Not at all"}</span>
            <span>{question.scaleRange.labels?.[1] || "Extremely"}</span>
          </div>
          <div className="flex gap-2 justify-between">
            {Array.from(
              { length: question.scaleRange.max - question.scaleRange.min + 1 },
              (_, i) => {
                const value = question.scaleRange!.min + i;
                const isSelected = selectedValue === value;
                return (
                  <motion.button
                    key={value}
                    onClick={() => setSelectedValue(value)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 h-12 rounded-lg font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {value}
                  </motion.button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Frequency Question */}
      {question.type === "frequency" && question.options && (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedValue === option;
            return (
              <motion.button
                key={index}
                onClick={() => setSelectedValue(option)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Text Question */}
      {question.type === "text" && (
        <div className="space-y-4">
          <textarea
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setSelectedValue(e.target.value);
            }}
            placeholder="Share your thoughts..."
            className="w-full min-h-[100px] p-4 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
          />
        </div>
      )}

      {/* Optional Text Input for All Types */}
      {(question.type === "scale" || question.type === "frequency") && (
        <div>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Add any additional context (optional)..."
            className="w-full min-h-[80px] p-4 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
          />
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={selectedValue === null}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300"
      >
        <Send className="w-4 h-4 mr-2" />
        Continue
      </Button>
    </motion.div>
  );
}


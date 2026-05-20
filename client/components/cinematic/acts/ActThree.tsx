"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DOMAINS, useCinematicStore } from "../CinematicContext";
import { DomainCard } from "../shared/DomainCard";
import { VisionCapsule } from "../shared/VisionCapsule";
import { IntensityCard, INTENSITY_OPTIONS } from "../shared/IntensityCard";
import { ProgressDots } from "../shared/ProgressDots";

type QuestionStep = 1 | 2 | 3 | "complete";

const VISION_OPTIONS = [
  "Sleep through the night consistently",
  "Feel less anxious about work",
  "Build a meditation habit",
  "Find more energy throughout the day",
];

export function ActThree({ onComplete }: { onComplete: () => void }) {
  const store = useCinematicStore();
  const [step, setStep] = useState<QuestionStep>(1);
  const [exitingCards, setExitingCards] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedVision, setSelectedVision] = useState<string | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<string | null>(null);

  const domainData = DOMAINS.find((d) => d.id === selectedDomain);

  const handleDomainSelect = useCallback(
    (id: string) => {
      setSelectedDomain(id);
      store.setSelection("selectedDomain", id);
      setExitingCards(true);
      setTimeout(() => {
        setExitingCards(false);
        setStep(2);
      }, 600);
    },
    [store]
  );

  const handleVisionSelect = useCallback(
    (text: string) => {
      setSelectedVision(text);
      store.setSelection("selectedVision", text);
      setTimeout(() => setStep(3), 500);
    },
    [store]
  );

  const handleIntensitySelect = useCallback(
    (id: string) => {
      setSelectedIntensity(id);
      store.setSelection("selectedIntensity", id);
      setTimeout(() => {
        setStep("complete");
        onComplete();
      }, 800);
    },
    [store, onComplete]
  );

  const currentStep = step === "complete" ? 3 : step;

  return (
    <section
      className="relative flex flex-col items-center justify-center px-8"
      style={{ minHeight: "100vh", background: "var(--cin-void, #000)" }}
    >
      <ProgressDots total={3} current={currentStep} className="mb-10" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl"
          >
            <h2
              className="text-center text-2xl md:text-3xl font-light mb-10"
              style={{ color: "var(--cin-text-primary, #F5F5F7)" }}
            >
              What area of your life needs the most attention right now?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {DOMAINS.map((domain, i) => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  selected={selectedDomain === domain.id}
                  onSelect={handleDomainSelect}
                  exiting={exitingCards && selectedDomain !== domain.id}
                  exitDelay={i}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <h2
              className="text-center text-2xl md:text-3xl font-light mb-10"
              style={{ color: "var(--cin-text-primary, #F5F5F7)" }}
            >
              What does success look like for you in{" "}
              <span style={{ color: domainData?.color }}>{domainData?.label ?? "this area"}</span>?
            </h2>
            <div className="space-y-3">
              {VISION_OPTIONS.map((text, i) => (
                <VisionCapsule
                  key={text}
                  text={text}
                  selected={selectedVision === text}
                  onSelect={() => handleVisionSelect(text)}
                  delay={i * 0.1}
                />
              ))}
            </div>
            {selectedVision && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-8"
                style={{
                  color: "var(--cin-sia-accent, #D4A574)",
                  fontFamily: "var(--font-instrument-serif, serif)",
                  fontStyle: "italic",
                  fontSize: "1.125rem",
                }}
              >
                That&apos;s worth building toward. Let&apos;s make it real.
              </motion.p>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <h2
              className="text-center text-2xl md:text-3xl font-light mb-10"
              style={{ color: "var(--cin-text-primary, #F5F5F7)" }}
            >
              How do you want me to show up for you?
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              {INTENSITY_OPTIONS.map((opt) => (
                <IntensityCard
                  key={opt.id}
                  option={opt}
                  selected={selectedIntensity === opt.id}
                  onSelect={() => handleIntensitySelect(opt.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div
              className="text-lg"
              style={{
                color: "var(--cin-sia-accent, #D4A574)",
                fontFamily: "var(--font-instrument-serif, serif)",
                fontStyle: "italic",
              }}
            >
              Building your plan...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

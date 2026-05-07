"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, Search, Check, Volume2, X } from "lucide-react";
import {
  getAvailableLanguages,
  getLanguageByCode,
  groupLanguagesByRegion,
  type LanguageConfig,
} from "@/lib/language-config";

interface TopRightControlsProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  onClose: () => void;
}

export function TopRightControls({
  selectedLanguage,
  onLanguageChange,
  onClose,
}: TopRightControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableLanguages, setAvailableLanguages] = useState<LanguageConfig[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLanguages = () => {
      setAvailableLanguages(getAvailableLanguages());
    };
    loadLanguages();

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadLanguages;
      const timeout = setTimeout(loadLanguages, 500);
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        if (!target.closest(".language-dropdown-content")) {
          setIsOpen(false);
        }
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 150);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen]);

  const selectedLang = getLanguageByCode(selectedLanguage);
  const displayName =
    selectedLang?.displayName?.split(" ")[0] || selectedLanguage.split("-")[0] || "English";

  const filteredLanguages = availableLanguages.filter((lang) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lang.displayName.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });
  const filteredGrouped = groupLanguagesByRegion(filteredLanguages);

  const previewVoice = (code: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const lang = getLanguageByCode(code);
    if (!lang) return;
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => {
      const voiceBase = v.lang.split("-")[0];
      const langBase = code.split("-")[0];
      return v.lang === code || voiceBase === langBase;
    });
    if (matchingVoice) {
      const utterance = new SpeechSynthesisUtterance(lang.nativeName || lang.displayName);
      utterance.voice = matchingVoice;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className="flex items-center"
      style={{ gap: "11px" }}
    >
      {/* Language Pill */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center whitespace-nowrap"
          style={{
            gap: "11px",
            height: "34px",
            paddingLeft: "17.143px",
            paddingRight: "17.143px",
            paddingTop: "6.143px",
            paddingBottom: "6.143px",
            background: "rgba(255,255,255,0.03)",
            border: "1.143px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          }}
          aria-label="Select language"
        >
          <span className="flex items-center" style={{ gap: "4px" }}>
            <Globe style={{ width: "14px", height: "14px", color: "#d1d5dc" }} strokeWidth={2} />
            <span
              className="font-bold"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                lineHeight: "16px",
                color: "#d1d5dc",
              }}
            >
              {displayName}
            </span>
          </span>
          <ChevronDown style={{ width: "17px", height: "17px", color: "#d1d5dc" }} strokeWidth={2} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="language-dropdown-content absolute top-full right-0 mt-2 w-80 max-h-96 overflow-hidden rounded-xl shadow-2xl z-[9999]"
              style={{
                background: "#0f1116",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ width: "16px", height: "16px", color: "rgba(255,255,255,0.4)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search languages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#ffffff",
                    }}
                  />
                </div>
              </div>

              <div
                className="max-h-80 overflow-y-auto overscroll-contain"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#475569 #1e293b",
                }}
                onWheel={(e) => e.stopPropagation()}
              >
                {Object.keys(filteredGrouped).length === 0 ? (
                  <div className="p-4 text-center text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    No languages found
                  </div>
                ) : (
                  Object.entries(filteredGrouped).map(([region, languages]) => (
                    <div key={region} className="p-2">
                      <div
                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        {region}
                      </div>
                      {languages.map((lang) => (
                        <div
                          key={lang.code}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onLanguageChange(lang.code);
                            setTimeout(() => {
                              setIsOpen(false);
                              setSearchQuery("");
                            }, 50);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            e.stopPropagation();
                            onLanguageChange(lang.code);
                            setTimeout(() => {
                              setIsOpen(false);
                              setSearchQuery("");
                            }, 50);
                          }}
                          role="option"
                          aria-selected={selectedLanguage === lang.code}
                          tabIndex={0}
                          aria-label={`Select ${lang.displayName}`}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                          style={{
                            background:
                              selectedLanguage === lang.code ? "rgba(0,208,181,0.15)" : "transparent",
                            color:
                              selectedLanguage === lang.code ? "#00d0b5" : "rgba(255,255,255,0.8)",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedLanguage !== lang.code) {
                              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedLanguage !== lang.code) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium">{lang.displayName}</div>
                            <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                              {lang.nativeName}
                            </div>
                          </div>
                          {selectedLanguage === lang.code && (
                            <Check style={{ width: "16px", height: "16px", color: "#00d0b5" }} />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              previewVoice(lang.code);
                            }}
                            className="p-1.5 rounded transition-colors"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                            aria-label="Preview voice"
                          >
                            <Volume2
                              style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.6)" }}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Close Button (charm:cross) */}
      <button
        type="button"
        onClick={onClose}
        className="flex items-center justify-center rounded-full transition-opacity"
        style={{
          width: "44px",
          height: "44px",
          background: "transparent",
          color: "#d1d5dc",
          opacity: 0.9,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.9";
          e.currentTarget.style.background = "transparent";
        }}
        aria-label="Close voice assistant"
      >
        <X style={{ width: "24px", height: "24px" }} strokeWidth={2} />
      </button>
    </div>
  );
}

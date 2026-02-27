"use client";

import { useState, useRef, useMemo } from "react";
import { motion, useInView, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Plus, Minus, HelpCircle, MessageCircle, Sparkles, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatedGradientMesh } from "./shared";

const faqs = [
  {
    question: "How does the AI-powered health tracking work?",
    answer:
      "Our AI analyzes your daily activities, sleep patterns, nutrition, and other health metrics to provide personalized insights and recommendations. It learns from your habits over time to offer increasingly accurate and helpful suggestions tailored specifically to your health goals.",
    category: "AI & Technology",
  },
  {
    question: "Is my health data secure?",
    answer:
      "Absolutely. We take data security very seriously. All your health data is encrypted both in transit and at rest. We're HIPAA compliant and never share your personal health information with third parties. You have complete control over your data and can export or delete it at any time.",
    category: "Security",
  },
  {
    question: "Can I connect my fitness devices and wearables?",
    answer:
      "Yes! YHealth integrates seamlessly with popular fitness devices and wearables including Apple Watch, Fitbit, Garmin, Samsung Galaxy Watch, and many more. You can also connect to apps like Apple Health, Google Fit, and Strava for comprehensive tracking.",
    category: "Integrations",
  },
  {
    question: "What's included in the free plan?",
    answer:
      "The free plan includes basic activity tracking, daily step counter, water intake logging, 7-day history, and access to our community. It's a great way to get started and experience the core features of YHealth before upgrading.",
    category: "Pricing",
  },
  {
    question: "How do personalized meal plans work?",
    answer:
      "Based on your health goals, dietary preferences, allergies, and lifestyle, our AI creates customized meal plans. You'll get daily meal suggestions, recipes with nutritional information, and shopping lists. The plans adapt based on your feedback and progress.",
    category: "Features",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time with no questions asked. If you cancel within the first 30 days, you'll receive a full refund. After cancellation, you'll retain access to premium features until the end of your billing period.",
    category: "Pricing",
  },
];

const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

// ─── FAQ Item Component ─────────────────────────────────────────────
function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all duration-300",
          isOpen
            ? "bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/20 shadow-lg shadow-primary/5"
            : "bg-background/50 border-white/10 hover:border-white/20 hover:bg-background/80"
        )}
      >
        {/* Glow effect when open */}
        {isOpen && (
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        )}

        <button
          onClick={onToggle}
          className="w-full text-left p-6 flex items-start gap-4 relative z-10"
        >
          {/* Number indicator */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300",
              isOpen
                ? "bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg shadow-primary/30"
                : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Question */}
          <div className="flex-1 min-w-0 pt-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium text-primary/70 uppercase tracking-wider">
                {faq.category}
              </span>
            </div>
            <h3
              className={cn(
                "text-base sm:text-lg font-semibold transition-colors",
                isOpen ? "text-foreground" : "text-foreground/80"
              )}
            >
              {faq.question}
            </h3>
          </div>

          {/* Toggle icon */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-300",
              isOpen
                ? "bg-primary/10 text-primary"
                : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
            )}
          >
            {isOpen ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </motion.div>
        </button>

        {/* Answer with spring physics */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-0">
                <div className="pl-14">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── FAQ SECTION ────────────────────────────────────────────────────
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Scroll-based zoom animation
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -40]);

  // Parallax for background glows
  const glowY1 = useTransform(scrollYProgress, [0, 1], [-40, 60]);
  const glowY2 = useTransform(scrollYProgress, [0, 1], [40, -60]);

  // Filter FAQs by category and search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Reset open index when filters change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setOpenIndex(null);
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <AnimatedGradientMesh intensity={0.15} speed={0.8} blur={100} />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <motion.div
          style={{ y: glowY1 }}
          className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y: glowY2 }}
          className="absolute bottom-1/4 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        style={{ scale, opacity, y }}
        className="container mx-auto px-4 relative z-10"
      >
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>Got Questions?</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          >
            Frequently Asked{" "}
            <span className="gradient-text-animated">Questions</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Everything you need to know about YHealth. Can&apos;t find your
            answer?
            <br className="hidden sm:block" />
            Our support team is here to help.
          </motion.p>
        </div>

        {/* Search + Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-3xl mx-auto mb-8 space-y-4"
        >
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOpenIndex(null);
              }}
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-background/50 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryChange(category)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                  activeCategory === category
                    ? "bg-primary/15 border-primary/30 text-primary shadow-sm shadow-primary/10"
                    : "bg-background/50 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                {category}
                {category !== "All" && (
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {faqs.filter((f) => f.category === category).length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <FAQItem
                    key={faq.question}
                    faq={faq}
                    index={index}
                    isOpen={openIndex === index}
                    onToggle={() =>
                      setOpenIndex(openIndex === index ? null : index)
                    }
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No questions match your search.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("All");
                    }}
                    className="text-primary text-sm mt-2 hover:underline"
                  >
                    Clear filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-8 text-center">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Our friendly support team is available 24/7 to help you with
                anything you need.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 rounded-full px-8"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

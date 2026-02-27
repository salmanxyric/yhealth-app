"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { OnboardingProvider, useOnboarding } from "@/src/features/onboarding/context/OnboardingContext";
import { ONBOARDING_STEPS } from "@/src/features/onboarding/constants/steps";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AssessmentModeStep } from "./steps/AssessmentModeStep";
import { AssessmentStep } from "./steps/AssessmentStep";
import { DeepAssessmentStep } from "./steps/DeepAssessmentStep";
import { BodyImageUploadStep } from "./steps/BodyImageUploadStep";
import { GoalSetupStep } from "./steps/GoalSetupStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { PlanGenerationStep } from "./steps/PlanGenerationStep";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

function OnboardingContent() {
  const { currentStep, goToStep, assessmentMode } = useOnboarding();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/onboarding");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50"
            animate={{
              scale: [1, 1.3, 1.3],
              opacity: [0.5, 0, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-slate-400 text-sm font-medium">Loading your journey...</span>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <AssessmentModeStep />;
      case 2:
        // Render Deep or Quick assessment based on selected mode
        return assessmentMode === "deep" ? (
          <DeepAssessmentStep />
        ) : (
          <AssessmentStep />
        );
      case 3:
        return <BodyImageUploadStep />;
      case 4:
        return <GoalSetupStep />;
      case 5:
        return <PreferencesStep />;
      case 6:
        return <PlanGenerationStep />;
      default:
        return <WelcomeStep />;
    }
  };

  // Don't show progress on plan generation step or deep assessment (has its own header)
  const isDeepAssessment = currentStep === 2 && assessmentMode === "deep";
  const showProgress = currentStep < 6 && !isDeepAssessment;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Progress */}
      {showProgress && (
        <motion.header
          className="sticky top-0 z-50 pt-4 pb-6 md:pt-6 md:pb-8 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Back Button and Logo */}
            <motion.div
              className="relative mb-6 md:mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Back Button */}
              <Link
                href="/"
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </Link>

              {/* Logo - Centered */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                    yHealth
                  </h1>
                </div>
              </div>
            </motion.div>

            {/* Progress */}
            <ProgressIndicator
              steps={ONBOARDING_STEPS}
              currentStep={currentStep}
              onStepClick={goToStep}
            />
          </div>
        </motion.header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {showProgress && (
        <motion.footer
          className="py-6 text-center border-t border-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-slate-500">
            Need help?{" "}
            <a
              href="#"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Contact Support
            </a>
          </p>
        </motion.footer>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}

// Barrel export for gate primitives.
// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

export { FeatureGate } from "./FeatureGate";
export { PlanGate } from "./PlanGate";
export { CreditGate, type CreditGateChildProps } from "./CreditGate";
export { PaywallErrorBoundary } from "./PaywallErrorBoundary";
export { useFeature, type UseFeatureResult } from "./useFeature";
export { useCredits, type UseCreditsResult } from "./useCredits";
export { usePaywall } from "./usePaywall";

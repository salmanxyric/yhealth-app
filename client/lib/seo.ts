import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yhealth.app";
const SITE_NAME = "YHealth";

/**
 * Creates consistent metadata for any page.
 */
export function createMetadata({
  title,
  description,
  keywords,
  path = "",
  noIndex = false,
  ogImage,
  ogType = "website",
}: {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  noIndex?: boolean;
  ogImage?: string;
  ogType?: "website" | "article";
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    keywords: keywords?.join(", "),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: "en_US",
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

// ============================================
// PAGE METADATA DEFINITIONS
// ============================================

export const SEO = {
  home: createMetadata({
    title: "YHealth - AI-Powered Personal Health & Wellness Platform",
    description:
      "Transform your health with AI-driven fitness plans, smart nutrition tracking, mental wellness tools, and personalized coaching. Track workouts, monitor mood, build habits — all in one platform.",
    keywords: [
      "AI health platform",
      "personal wellness app",
      "AI fitness coach",
      "smart health tracking",
      "personalized workout plans",
      "nutrition tracking app",
      "mental wellness platform",
      "health goal tracker",
      "AI-powered wellness",
      "holistic health management",
    ],
    path: "/",
  }),

  about: createMetadata({
    title: "About YHealth - Revolutionizing Personal Health with AI",
    description:
      "YHealth combines artificial intelligence with health science to deliver personalized fitness, nutrition, and mental wellness plans. Discover our mission to make proactive healthcare accessible to everyone.",
    keywords: [
      "about YHealth",
      "AI health technology",
      "digital health innovation",
      "personalized healthcare",
      "health tech startup",
      "wellness technology company",
      "proactive healthcare platform",
    ],
    path: "/about",
  }),

  plans: createMetadata({
    title: "Plans & Pricing - YHealth",
    description:
      "Choose the right plan for your health journey. Starter, Pro, and Premium plans with AI coaching, analytics, and personalized support. Start free, upgrade anytime.",
    keywords: [
      "YHealth pricing",
      "health app plans",
      "subscription plans",
      "AI coaching pricing",
      "wellness app subscription",
    ],
    path: "/plans",
  }),

  subscription: createMetadata({
    title: "Subscription - YHealth",
    description:
      "Manage your yHealth subscription, view your current plan, and upgrade or change plans. Billing and usage in one place.",
    keywords: [
      "YHealth subscription",
      "manage subscription",
      "billing",
      "upgrade plan",
    ],
    path: "/subscription",
  }),

  // --- Blogs ---
  blogList: createMetadata({
    title: "Health & Wellness Blog - Expert Tips & AI-Driven Insights",
    description:
      "Read expert articles on fitness, nutrition, mental health, and wellness. Evidence-based tips, AI health insights, and actionable guides to improve your daily well-being.",
    keywords: [
      "health blog",
      "wellness articles",
      "fitness tips",
      "nutrition advice",
      "mental health articles",
      "AI health insights",
      "wellness guide",
      "healthy lifestyle blog",
      "exercise science articles",
      "mindfulness tips",
    ],
    path: "/blogs",
  }),

  // --- Auth ---
  signIn: createMetadata({
    title: "Sign In to YHealth - Access Your Health Dashboard",
    description:
      "Sign in to your YHealth account to access personalized workout plans, nutrition tracking, wellness insights, and your AI health coach.",
    keywords: [
      "YHealth login",
      "health app sign in",
      "wellness dashboard login",
    ],
    path: "/auth/signin",
    noIndex: true,
  }),

  signUp: createMetadata({
    title: "Create Your YHealth Account - Start Your Wellness Journey",
    description:
      "Join YHealth for free and get AI-powered fitness plans, personalized nutrition tracking, mood monitoring, and a smart health coach — tailored to your goals.",
    keywords: [
      "YHealth sign up",
      "create health account",
      "free wellness app",
      "start health journey",
      "AI health coach signup",
    ],
    path: "/auth/signup",
  }),

  forgotPassword: createMetadata({
    title: "Reset Your Password - YHealth",
    description: "Forgot your YHealth password? Reset it securely and regain access to your personalized health dashboard.",
    path: "/auth/forgot-password",
    noIndex: true,
  }),

  resetPassword: createMetadata({
    title: "Set New Password - YHealth",
    description: "Create a new secure password for your YHealth account.",
    path: "/auth/reset-password",
    noIndex: true,
  }),

  verify: createMetadata({
    title: "Verify Your Email - YHealth",
    description: "Verify your email address to activate your YHealth account and start tracking your health journey.",
    path: "/auth/verify",
    noIndex: true,
  }),

  // --- Dashboard & User ---
  dashboard: createMetadata({
    title: "Health Dashboard - Your Daily Wellness Overview",
    description:
      "View your daily health snapshot — workouts, nutrition intake, mood trends, habit streaks, and AI-generated insights all in one personalized dashboard.",
    keywords: [
      "health dashboard",
      "wellness overview",
      "daily health tracker",
      "fitness dashboard",
      "personal health summary",
    ],
    path: "/dashboard",
    noIndex: true,
  }),

  profile: createMetadata({
    title: "My Health Profile - YHealth",
    description: "View and manage your health profile, fitness stats, body metrics, and wellness achievements.",
    path: "/profile",
    noIndex: true,
  }),

  profileEdit: createMetadata({
    title: "Edit Profile - YHealth",
    description: "Update your personal information, health preferences, and profile settings.",
    path: "/profile/edit",
    noIndex: true,
  }),

  settings: createMetadata({
    title: "Account Settings - YHealth",
    description: "Manage your YHealth account settings, notification preferences, connected devices, and privacy controls.",
    path: "/settings",
    noIndex: true,
  }),

  notifications: createMetadata({
    title: "Notifications - YHealth",
    description: "Stay on top of your health goals with smart reminders, workout alerts, and wellness notifications.",
    path: "/notifications",
    noIndex: true,
  }),

  messages: createMetadata({
    title: "Messages - YHealth",
    description: "Connect with your health community, coaches, and support team through secure messaging.",
    path: "/messages",
    noIndex: true,
  }),

  chat: createMetadata({
    title: "AI Health Chat - Talk to Your Wellness Coach",
    description: "Chat with your AI-powered health coach for instant fitness advice, nutrition tips, and personalized wellness guidance.",
    keywords: [
      "AI health chat",
      "wellness chatbot",
      "health advice AI",
      "fitness coach chat",
    ],
    path: "/chat",
    noIndex: true,
  }),

  chatHistory: createMetadata({
    title: "Chat History - YHealth",
    description: "Review past conversations with your AI health coach and revisit personalized recommendations.",
    path: "/chat-history",
    noIndex: true,
  }),

  // --- Health Tracking ---
  goals: createMetadata({
    title: "Health Goals - Set & Track Personalized Targets",
    description:
      "Set personalized health goals for fitness, nutrition, sleep, and wellness. Track daily progress with AI-powered insights and adaptive milestones.",
    keywords: [
      "health goal setting",
      "fitness goal tracker",
      "wellness targets",
      "personalized health goals",
      "smart goal tracking",
    ],
    path: "/goals",
    noIndex: true,
  }),

  activity: createMetadata({
    title: "Activity Tracker - Daily Movement & Exercise Log",
    description:
      "Track your daily activity, steps, calories burned, and active minutes. View detailed exercise history and movement trends.",
    keywords: [
      "activity tracker",
      "daily exercise log",
      "movement tracking",
      "calories burned tracker",
      "fitness activity monitor",
    ],
    path: "/activity",
    noIndex: true,
  }),

  activityStatus: createMetadata({
    title: "Activity Status - Real-Time Health Monitoring",
    description: "Monitor your real-time activity status, heart rate zones, and daily movement patterns.",
    path: "/activity-status",
    noIndex: true,
  }),

  workouts: createMetadata({
    title: "Workout Planner - AI-Generated Exercise Programs",
    description:
      "Access AI-generated workout plans tailored to your fitness level, goals, and schedule. Log exercises, track sets and reps, and monitor progress.",
    keywords: [
      "AI workout planner",
      "personalized exercise plan",
      "fitness program generator",
      "workout tracker",
      "strength training log",
      "exercise routine builder",
    ],
    path: "/workouts",
    noIndex: true,
  }),

  nutrition: createMetadata({
    title: "Nutrition Tracker - Smart Meal Logging & Diet Plans",
    description:
      "Log meals, track macros, and get AI-powered diet recommendations. Monitor calorie intake, nutritional balance, and eating patterns for optimal health.",
    keywords: [
      "nutrition tracker",
      "meal logging app",
      "calorie counter",
      "macro tracker",
      "AI diet planner",
      "food tracking app",
      "personalized meal plans",
    ],
    path: "/nutrition",
    noIndex: true,
  }),

  progress: createMetadata({
    title: "Progress Reports - Visualize Your Health Transformation",
    description:
      "Visualize your health journey with detailed progress reports. Track body metrics, fitness milestones, weight trends, and overall wellness improvements.",
    keywords: [
      "health progress tracker",
      "fitness progress report",
      "body transformation tracker",
      "wellness improvement charts",
      "weight tracking graphs",
    ],
    path: "/progress",
    noIndex: true,
  }),

  achievements: createMetadata({
    title: "Achievements & Rewards - Celebrate Your Health Milestones",
    description:
      "Earn badges, unlock achievements, and celebrate milestones on your health journey. Gamified wellness tracking to keep you motivated.",
    keywords: [
      "health achievements",
      "fitness badges",
      "wellness milestones",
      "gamified health tracking",
      "fitness rewards system",
    ],
    path: "/achievements",
    noIndex: true,
  }),

  // --- Wellbeing ---
  wellbeing: createMetadata({
    title: "Mental Wellbeing Hub - Mood, Stress & Mindfulness Tools",
    description:
      "Comprehensive mental wellness tools — mood tracking, stress management, guided breathing, journaling, habit building, and emotional check-ins powered by AI.",
    keywords: [
      "mental wellbeing app",
      "mood tracker",
      "stress management tools",
      "mindfulness app",
      "emotional wellness platform",
      "mental health tracking",
      "daily wellbeing check-in",
    ],
    path: "/wellbeing",
    noIndex: true,
  }),

  wellbeingMood: createMetadata({
    title: "Mood Tracker - Log & Analyze Your Emotional Patterns",
    description:
      "Track your daily mood, identify emotional triggers, and discover patterns. AI-powered mood analysis with actionable insights for emotional balance.",
    keywords: [
      "mood tracker app",
      "emotional pattern analysis",
      "daily mood journal",
      "mood monitoring",
      "emotional health tracker",
    ],
    path: "/wellbeing/mood",
    noIndex: true,
  }),

  wellbeingEnergy: createMetadata({
    title: "Energy Level Tracker - Optimize Your Daily Vitality",
    description: "Log and track your energy levels throughout the day. Discover what boosts or drains your vitality with AI-powered patterns.",
    keywords: [
      "energy level tracker",
      "daily vitality monitor",
      "fatigue tracking",
      "energy optimization",
    ],
    path: "/wellbeing/energy",
    noIndex: true,
  }),

  wellbeingJournal: createMetadata({
    title: "Wellness Journal - Daily Reflections & Gratitude Log",
    description:
      "Write daily journal entries, practice gratitude, and process emotions with guided prompts. AI-powered sentiment analysis for deeper self-awareness.",
    keywords: [
      "wellness journal",
      "daily gratitude log",
      "guided journaling",
      "emotional processing",
      "self-reflection app",
    ],
    path: "/wellbeing/journal",
    noIndex: true,
  }),

  wellbeingHabits: createMetadata({
    title: "Habit Tracker - Build Healthy Routines That Stick",
    description:
      "Build and track healthy habits with streak tracking, reminders, and progress visualization. Science-backed habit formation with AI coaching.",
    keywords: [
      "habit tracker app",
      "healthy habit builder",
      "streak tracker",
      "daily routine builder",
      "habit formation tool",
    ],
    path: "/wellbeing/habits",
    noIndex: true,
  }),

  wellbeingStress: createMetadata({
    title: "Stress Management - Track & Reduce Your Stress Levels",
    description:
      "Monitor stress levels, identify triggers, and access guided relaxation techniques. Evidence-based stress reduction strategies personalized for you.",
    keywords: [
      "stress tracker",
      "stress management app",
      "anxiety monitor",
      "stress reduction techniques",
      "relaxation tools",
    ],
    path: "/wellbeing/stress",
    noIndex: true,
  }),

  wellbeingBreathing: createMetadata({
    title: "Guided Breathing Exercises - Calm Your Mind Instantly",
    description:
      "Practice guided breathing exercises for stress relief, focus, and relaxation. Multiple techniques including box breathing, 4-7-8, and diaphragmatic breathing.",
    keywords: [
      "guided breathing exercises",
      "breathing techniques app",
      "box breathing",
      "stress relief breathing",
      "meditation breathing",
    ],
    path: "/wellbeing/breathing",
    noIndex: true,
  }),

  wellbeingEmotionalCheckin: createMetadata({
    title: "Emotional Check-In - AI-Powered Wellness Assessment",
    description:
      "Complete quick emotional check-ins to track your mental state. Get AI-powered insights and personalized wellbeing recommendations.",
    keywords: [
      "emotional check-in",
      "mental health assessment",
      "wellness check",
      "emotional wellness tool",
    ],
    path: "/wellbeing/emotional-checkin",
    noIndex: true,
  }),

  wellbeingSchedule: createMetadata({
    title: "Wellness Schedule - Plan Your Daily Health Routine",
    description:
      "Plan and organize your daily wellness routine. Schedule workouts, meals, meditation, and self-care activities in one intelligent calendar.",
    keywords: [
      "wellness schedule planner",
      "daily health routine",
      "wellness calendar",
      "self-care scheduler",
    ],
    path: "/wellbeing/schedule",
    noIndex: true,
  }),

  // --- AI & Voice ---
  aiCoach: createMetadata({
    title: "AI Health Coach - Personalized Wellness Guidance 24/7",
    description:
      "Get instant, personalized health advice from your AI wellness coach. Science-backed recommendations for fitness, nutrition, sleep, and mental health.",
    keywords: [
      "AI health coach",
      "virtual wellness coach",
      "personalized health advice",
      "AI fitness guidance",
      "24/7 health assistant",
    ],
    path: "/ai-coach",
    noIndex: true,
  }),

  voiceAssistant: createMetadata({
    title: "Voice Health Assistant - Hands-Free Wellness Support",
    description: "Interact with your AI health coach through voice. Log meals, start workouts, check progress, and get wellness tips — completely hands-free.",
    keywords: [
      "voice health assistant",
      "hands-free fitness",
      "voice-controlled health app",
      "AI voice wellness",
    ],
    path: "/voice-assistant",
    noIndex: true,
  }),

  voiceCall: createMetadata({
    title: "Voice Call - Talk to Your AI Health Coach",
    description: "Have a real-time voice conversation with your AI health coach for in-depth wellness consultations and personalized health guidance.",
    path: "/voice-call",
    noIndex: true,
  }),

  // --- Admin ---
  admin: createMetadata({
    title: "Admin Dashboard - YHealth",
    description: "YHealth administration panel for managing users, content, and platform settings.",
    path: "/admin",
    noIndex: true,
  }),

  adminBlogs: createMetadata({
    title: "Blog Management - YHealth Admin",
    description: "Create, edit, and manage blog posts. Track engagement, publish content, and use AI to generate health articles.",
    path: "/admin/blogs",
    noIndex: true,
  }),

  adminBlogCreate: createMetadata({
    title: "Create Blog Post - YHealth Admin",
    description: "Write and publish a new health and wellness blog post with AI-assisted content generation.",
    path: "/admin/blogs/create",
    noIndex: true,
  }),

  // --- Onboarding ---
  onboarding: createMetadata({
    title: "Welcome to YHealth - Personalize Your Health Journey",
    description: "Set up your health profile, define your wellness goals, and let our AI create a personalized plan tailored to your lifestyle.",
    path: "/onboarding",
    noIndex: true,
  }),

  // --- Legal ---
  privacy: createMetadata({
    title: "Privacy Policy - How YHealth Protects Your Health Data",
    description:
      "Learn how YHealth collects, uses, and protects your personal health information. Our commitment to data privacy, GDPR compliance, and transparent data practices.",
    keywords: [
      "YHealth privacy policy",
      "health data privacy",
      "GDPR compliance",
      "data protection",
      "health app privacy",
      "personal data security",
    ],
    path: "/privacy",
  }),

  terms: createMetadata({
    title: "Terms of Service - YHealth Platform Agreement",
    description:
      "Review the terms and conditions governing your use of the YHealth AI health platform. Understand your rights, responsibilities, and our service commitments.",
    keywords: [
      "YHealth terms of service",
      "user agreement",
      "platform terms",
      "health app terms",
      "service agreement",
    ],
    path: "/terms",
  }),

  cookies: createMetadata({
    title: "Cookie Policy - How YHealth Uses Cookies & Tracking",
    description:
      "Understand how YHealth uses cookies, local storage, and similar technologies to enhance your health platform experience and respect your privacy preferences.",
    keywords: [
      "YHealth cookie policy",
      "cookies usage",
      "tracking technologies",
      "cookie preferences",
      "browser cookies health app",
    ],
    path: "/cookies",
  }),

  hipaa: createMetadata({
    title: "HIPAA Compliance - YHealth Health Data Protection Standards",
    description:
      "Learn about YHealth's HIPAA compliance measures, protected health information (PHI) safeguards, and our commitment to healthcare data security standards.",
    keywords: [
      "HIPAA compliance",
      "health data protection",
      "PHI security",
      "healthcare compliance",
      "health information privacy",
      "HIPAA certified health app",
    ],
    path: "/hipaa",
  }),

  security: createMetadata({
    title: "Security - How YHealth Safeguards Your Data",
    description:
      "Explore YHealth's enterprise-grade security infrastructure, encryption standards, SOC 2 compliance, penetration testing, and comprehensive data protection measures.",
    keywords: [
      "YHealth security",
      "data encryption",
      "SOC 2 compliance",
      "health app security",
      "cybersecurity",
      "secure health platform",
    ],
    path: "/security",
  }),

  // --- Resources ---
  helpCenter: createMetadata({
    title: "Help Center - YHealth Support & Guides",
    description:
      "Find answers to your questions about YHealth. Browse our help articles, tutorials, and guides to get the most out of your AI-powered health platform.",
    keywords: [
      "YHealth help",
      "support center",
      "health app help",
      "YHealth FAQ",
      "user guides",
      "YHealth tutorials",
      "health platform support",
    ],
    path: "/help",
  }),

  community: createMetadata({
    title: "Community - Connect with Health Enthusiasts",
    description:
      "Join the YHealth community. Share your wellness journey, ask questions, exchange tips, and connect with thousands of health-conscious individuals.",
    keywords: [
      "health community",
      "wellness forum",
      "fitness community",
      "health discussions",
      "wellness support group",
      "health tips sharing",
      "fitness social network",
    ],
    path: "/community",
  }),

  webinars: createMetadata({
    title: "Webinars - Live Health & Wellness Sessions",
    description:
      "Attend live webinars and watch replays on fitness, nutrition, mental health, and wellness. Learn from experts and get your questions answered in real-time.",
    keywords: [
      "health webinars",
      "wellness workshops",
      "fitness webinars",
      "nutrition talks",
      "mental health sessions",
      "online health events",
      "wellness education",
    ],
    path: "/webinars",
  }),

  // --- Company ---
  careers: createMetadata({
    title: "Careers at YHealth - Join Our Mission to Transform Health",
    description:
      "Explore exciting career opportunities at YHealth. Join our team of innovators building the future of AI-powered personal health and wellness.",
    keywords: [
      "YHealth careers",
      "health tech jobs",
      "AI health jobs",
      "wellness startup careers",
      "health technology careers",
      "join YHealth team",
    ],
    path: "/careers",
  }),

  press: createMetadata({
    title: "Press & Media - YHealth News & Coverage",
    description:
      "Stay updated with the latest YHealth news, media coverage, press releases, and company announcements. Download brand assets and press kit.",
    keywords: [
      "YHealth press",
      "YHealth news",
      "health tech news",
      "YHealth media",
      "press releases",
      "YHealth announcements",
    ],
    path: "/press",
  }),
} as const;

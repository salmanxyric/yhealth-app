// Icon allowlist for server-driven menus. The server sends an icon *name* (string);
// the client resolves it to a Lucide component via this map. NEVER use dynamic
// `import()` by name or `eval` — this map is intentionally explicit so adding an
// icon requires a code change.

import {
    Activity,
    AlertTriangle,
    Apple,
    Bell,
    BookOpen,
    Bot,
    Compass,
    CreditCard,
    Crown,
    DollarSign,
    Dumbbell,
    Flame,
    Flower2,
    Handshake,
    Heart,
    HeartPulse,
    HelpCircle,
    History,
    LayoutDashboard,
    Lock,
    Mail,
    MessageSquare,
    Mic,
    Music2,
    Network,
    Phone,
    Presentation,
    Settings,
    Sliders,
    Sparkles,
    Target,
    TrendingUp,
    Trophy,
    User,
    Users,
    Zap,
    type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
    Activity,
    AlertTriangle,
    Apple,
    Bell,
    BookOpen,
    Bot,
    Compass,
    CreditCard,
    Crown,
    DollarSign,
    Dumbbell,
    Flame,
    Flower2,
    Handshake,
    Heart,
    HeartPulse,
    HelpCircle,
    History,
    LayoutDashboard,
    Lock,
    Mail,
    MessageSquare,
    Mic,
    Music2,
    Network,
    Phone,
    Presentation,
    Settings,
    Sliders,
    Sparkles,
    Target,
    TrendingUp,
    Trophy,
    User,
    Users,
    Zap,
};

/**
 * Resolve an icon name string into a Lucide component.
 * Unknown names fall back to `HelpCircle` so the UI never crashes on a typo.
 */
export function resolveIcon(name: string | null | undefined): LucideIcon {
    if (!name) return HelpCircle;
    return ICON_MAP[name] ?? HelpCircle;
}

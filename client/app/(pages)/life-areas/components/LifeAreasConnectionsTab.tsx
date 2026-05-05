'use client';

import Link from 'next/link';
import {
  Calendar,
  Wallet,
  Dumbbell,
  Settings,
  BookOpen,
  HeartPulse,
} from 'lucide-react';

const items = [
  {
    title: 'Daily schedule & prayer',
    desc: 'See today\'s blocks, prayer times, and completions.',
    href: '/wellbeing/schedule',
    icon: Calendar,
    accent: 'text-violet-300',
  },
  {
    title: 'Money Map',
    desc: 'Budgets, transactions, and savings goals.',
    href: '/money-map',
    icon: Wallet,
    accent: 'text-emerald-300',
  },
  {
    title: 'Workouts',
    desc: 'Plans and logs from the dashboard.',
    href: '/dashboard',
    icon: Dumbbell,
    accent: 'text-rose-300',
  },
  {
    title: 'Prayer times (settings)',
    desc: 'Connect location-based prayer times.',
    href: '/settings',
    icon: Settings,
    accent: 'text-cyan-300',
  },
  {
    title: 'Wellbeing',
    desc: 'Mood, stress, journal, and habits.',
    href: '/wellbeing',
    icon: HeartPulse,
    accent: 'text-amber-300',
  },
  {
    title: 'Learning & habits',
    desc: 'Use the coach to layer study blocks on your schedule.',
    href: '/ai-coach',
    icon: BookOpen,
    accent: 'text-sky-300',
  },
];

export function LifeAreasConnectionsTab() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href + item.title}
            href={item.href}
            className="group rounded-2xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/70 hover:border-white/15 backdrop-blur-xl p-5 transition flex gap-4"
          >
            <div className={`rounded-xl bg-white/5 p-3 h-fit ${item.accent}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-blue-100 transition">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

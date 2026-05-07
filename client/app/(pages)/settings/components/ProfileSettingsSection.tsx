/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Settings,
  User,
  Shield,
  Mail,
  Sparkles,
  Check,
  ExternalLink,
  CreditCard,
  Phone,
  Calendar,
  BadgeCheck,
  Copy,
  Hash,
  Cake,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Crosshair,
  Crown as CrownIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ProfileUser } from './settings-types';
import { formatProfileDate, calculateAge, calculateProfileCompletion } from './settings-utils';
import { GlassCard, SectionHeader, ProfileInfoTile } from './SettingsSharedUI';

// Alias to keep ProfileInfoTile gender icon explicit (lucide doesn't have a gender icon)
const UserIcon = User;

export function ProfileSettingsSection({ user }: { user: ProfileUser }) {
  const [copied, setCopied] = useState(false);

  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : "Unnamed User";
  const initials =
    `${(user?.firstName?.[0] ?? "").toUpperCase()}${(user?.lastName?.[0] ?? "").toUpperCase()}` ||
    "U";
  const completion = user ? calculateProfileCompletion(user) : 0;
  const age = calculateAge(user?.dateOfBirth);
  const memberSince = formatProfileDate(user?.createdAt);
  const lastUpdated = formatProfileDate(user?.updatedAt);
  const dobDisplay = user?.dateOfBirth
    ? `${formatProfileDate(user.dateOfBirth)}${age !== null ? ` · ${age} yrs` : ""}`
    : null;

  const accountAgeDays = (() => {
    if (!user?.createdAt) return null;
    const created = new Date(user.createdAt);
    if (Number.isNaN(created.getTime())) return null;
    const diff = Math.floor(
      (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff >= 0 ? diff : null;
  })();

  const handleCopyId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      toast.success("User ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const quickLinks = [
    {
      label: "View Public Profile",
      desc: "How others see you",
      href: "/profile",
      icon: <User className="w-4 h-4" />,
      gradient: "from-blue-500/20 to-indigo-500/20",
      color: "text-blue-400",
    },
    {
      label: "Edit Preferences",
      desc: "Customize your experience",
      href: "/preferences",
      icon: <Settings className="w-4 h-4" />,
      gradient: "from-emerald-500/20 to-teal-500/20",
      color: "text-emerald-400",
    },
    {
      label: "Manage Goals",
      desc: "Set and track targets",
      href: "/goals",
      icon: <Crosshair className="w-4 h-4" />,
      gradient: "from-amber-500/20 to-orange-500/20",
      color: "text-amber-400",
    },
    {
      label: "Subscription",
      desc: "Plan & billing",
      href: "/subscription",
      icon: <CreditCard className="w-4 h-4" />,
      gradient: "from-violet-500/20 to-purple-500/20",
      color: "text-violet-400",
    },
    {
      label: "Security",
      desc: "Password & privacy",
      href: "/security",
      icon: <Shield className="w-4 h-4" />,
      gradient: "from-rose-500/20 to-pink-500/20",
      color: "text-rose-400",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 sm:space-y-6"
    >
      {/* ============= Card 1: Profile Hero ============= */}
      <GlassCard className="relative overflow-hidden !p-0">
        {/* Decorative gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.08] via-indigo-500/[0.04] to-transparent pointer-events-none" />
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"
          aria-hidden
        />

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 blur-md opacity-60" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold ring-4 ring-slate-950/40 overflow-hidden">
                {user?.avatarUrl ? (

                  <img
                    src={user.avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials || "U"}</span>
                )}
              </div>
              {user?.isEmailVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-slate-950 shadow-lg">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {fullName}
                </h2>
                {user?.role && user.role !== "user" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                    <CrownIcon className="w-3 h-3" />
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{user?.email || "No email set"}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                Member since {memberSince}
              </p>
            </div>

            {/* CTA */}
            <div className="flex sm:flex-col gap-2 justify-center sm:justify-start sm:items-end">
              <Link
                href="/profile/edit"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 hover:scale-[1.02]"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-sm font-medium border border-white/[0.06] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View</span>
              </Link>
            </div>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 pt-6 border-t border-white/[0.06]">
            <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Profile
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold text-white">
                  {completion}
                </span>
                <span className="text-xs text-slate-500">%</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completion}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Account Age
              </p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {accountAgeDays !== null ? accountAgeDays : "—"}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  days
                </span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Email
              </p>
              <div className="flex items-center gap-1.5">
                {user?.isEmailVerified ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-emerald-400 truncate">
                      Verified
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-amber-400 truncate">
                      Unverified
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Onboarding
              </p>
              <p className="text-sm font-semibold text-white capitalize truncate">
                {user?.onboardingStatus?.toLowerCase() || "—"}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ============= Card 2: Personal Information ============= */}
      <GlassCard>
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <SectionHeader
            icon={<User className="w-5 h-5" />}
            title="Personal Information"
            gradient="from-blue-500 to-indigo-500"
          />
          <Link
            href="/profile/edit"
            className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            Edit
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-sm text-slate-400 -mt-3 mb-5">
          Your personal details and account information.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProfileInfoTile
            icon={<User className="w-4 h-4" />}
            label="First Name"
            value={user?.firstName || "Not set"}
            empty={!user?.firstName}
          />
          <ProfileInfoTile
            icon={<User className="w-4 h-4" />}
            label="Last Name"
            value={user?.lastName || "Not set"}
            empty={!user?.lastName}
          />
          <ProfileInfoTile
            icon={<Mail className="w-4 h-4" />}
            label="Email Address"
            value={
              <span className="flex items-center gap-1.5">
                <span className="truncate">{user?.email || "Not set"}</span>
                {user?.isEmailVerified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
              </span>
            }
            empty={!user?.email}
            iconGradient="from-emerald-500/20 to-teal-500/20"
            iconColor="text-emerald-400"
          />
          <ProfileInfoTile
            icon={<Phone className="w-4 h-4" />}
            label="Phone Number"
            value={user?.phone || "Add phone number"}
            empty={!user?.phone}
            iconGradient="from-violet-500/20 to-purple-500/20"
            iconColor="text-violet-400"
          />
          <ProfileInfoTile
            icon={<Cake className="w-4 h-4" />}
            label="Date of Birth"
            value={dobDisplay || "Not set"}
            empty={!user?.dateOfBirth}
            iconGradient="from-pink-500/20 to-rose-500/20"
            iconColor="text-pink-400"
          />
          <ProfileInfoTile
            icon={<UserIcon className="w-4 h-4" />}
            label="Gender"
            value={user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1).toLowerCase() : "Not set"}
            empty={!user?.gender}
            iconGradient="from-cyan-500/20 to-sky-500/20"
            iconColor="text-cyan-400"
          />
        </div>
      </GlassCard>

      {/* ============= Card 3: Account Snapshot + Quick Links ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        {/* Account Snapshot */}
        <GlassCard className="lg:col-span-2">
          <SectionHeader
            icon={<Hash className="w-5 h-5" />}
            title="Account Details"
            gradient="from-slate-500 to-slate-700"
          />
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Member Since
              </p>
              <p className="text-sm font-semibold text-white">{memberSince}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3" />
                Last Updated
              </p>
              <p className="text-sm font-semibold text-white">{lastUpdated}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <CrownIcon className="w-3 h-3" />
                Account Type
              </p>
              <p className="text-sm font-semibold text-white capitalize">
                {user?.role || "Standard"}
              </p>
            </div>

            <button
              onClick={handleCopyId}
              className="w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all text-left group"
            >
              <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                User ID
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-mono text-slate-300 truncate">
                  {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : "—"}
                </p>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                )}
              </div>
            </button>
          </div>
        </GlassCard>

        {/* Quick Links */}
        <GlassCard className="lg:col-span-3">
          <SectionHeader
            icon={<Sparkles className="w-5 h-5" />}
            title="Quick Links"
            gradient="from-violet-500 to-fuchsia-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
              >
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${link.gradient} ${link.color} flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  {link.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {link.label}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {link.desc}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}

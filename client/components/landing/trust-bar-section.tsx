"use client";

import { Star, Shield, Watch, Smartphone, Users } from "lucide-react";
import { GSAPMarquee } from "./shared";

const trustItems = [
  { icon: Users, value: "150K+", label: "Lives Transformed" },
  { icon: Star, value: "4.9/5", label: "User Rating" },
  { icon: Shield, value: "SOC 2", label: "HIPAA Compliant" },
  { icon: Watch, label: "Apple Watch & Wearables" },
  { icon: Smartphone, label: "Whoop Integration" },
  { icon: Watch, label: "Garmin & Fitbit Ready" },
];

const pressLogos = ["TechCrunch", "Forbes Health", "Men's Health", "WIRED", "The Verge"];

function TrustItem({ item }: { item: (typeof trustItems)[number] }) {
  return (
    <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <item.icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        {"value" in item && item.value && (
          <span className="font-bold text-foreground tabular-nums">
            {item.value}
          </span>
        )}
        <span className="text-sm ml-1">{item.label}</span>
      </div>
    </div>
  );
}

export function TrustBarSection() {
  return (
    <section className="relative py-10 overflow-hidden border-y border-white/10 bg-background/50">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <GSAPMarquee speed={60} pauseOnHover scrollSensitive>
        {trustItems.map((item, i) => (
          <TrustItem key={i} item={item} />
        ))}
        {pressLogos.map((name) => (
          <span
            key={name}
            className="text-sm font-medium text-muted-foreground opacity-80 shrink-0"
          >
            {name}
          </span>
        ))}
      </GSAPMarquee>
    </section>
  );
}

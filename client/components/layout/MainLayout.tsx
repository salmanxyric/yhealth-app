"use client";

import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

interface MainLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  headerVariant?: "default" | "transparent" | "solid";
  className?: string;
}

export function MainLayout({
  children,
  showHeader = true,
  showFooter = true,
  className = "",
}: MainLayoutProps) {
  useSmoothScroll();

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {showHeader && <Header />}
      <main className="flex-1 mt-14">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}

export default MainLayout;

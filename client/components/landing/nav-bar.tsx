"use client";

import { useState, useEffect } from "react";

/**
 * NavBar -- sticky navigation bar with scroll-aware styling.
 *
 * Adds the `.scrolled` class to the `<nav>` element once the user has
 * scrolled more than 30 px, matching the original vanilla JS behavior.
 *
 * Contains:
 *  - Nav pill with Balencia brand icon, name, meta, and "Download" CTA
 *  - Main "Download app" CTA button
 */
export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Check initial state in case the page loads already scrolled.
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`} id="nav">
      <div className="nav-inner">
        <div className="nav-pill">
          <div className="nav-pill-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: 18, height: 18 }}
            >
              <path
                d="M12 5C13.5 5 14.7 6.2 14.7 7.7C14.7 9.2 13.5 10.4 12 10.4C10.5 10.4 9.3 9.2 9.3 7.7C9.3 6.2 10.5 5 12 5Z"
                fill="#fff"
              />
              <path
                d="M4 13C4 13 7 16 12 16C17 16 20 13 20 13C20 17 16.4 20 12 20C7.6 20 4 17 4 13Z"
                fill="#fff"
              />
            </svg>
          </div>
          <div className="nav-pill-info">
            <div className="nav-pill-name">Balencia</div>
            <div className="nav-pill-meta">Life Coach &middot; 4.8&#9733;</div>
          </div>
          <a href="#download" className="nav-pill-cta">
            Download
          </a>
        </div>
        <a href="#download" className="nav-cta-btn">
          <span>Download app</span>
        </a>
      </div>
    </nav>
  );
}

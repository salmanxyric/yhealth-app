"use client";

/**
 * Site footer — brand, tagline, three link columns (Cia, Domains, Support),
 * and bottom row with copyright and social links. No GSAP animations.
 */

const FOOTER_COLUMNS = [
  {
    heading: "Cia",
    links: ["Voice mode", "Video calls", "Person chat", "Competitions"],
  },
  {
    heading: "Domains",
    links: ["Health", "Finance", "Career", "Relationships"],
  },
  {
    heading: "Support",
    links: ["Help", "Privacy", "Terms", "Contact"],
  },
] as const;

const SOCIAL_LINKS = ["Twitter", "Instagram", "YouTube", "LinkedIn"] as const;

export default function FooterSection() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-brand">
              Balencia<span className="footer-brand-dot" />
            </div>
            <div className="footer-tag">
              Your AI life coach. Health, finance, career, relationships — all
              in one mind.
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div className="footer-col" key={col.heading}>
              <h5>{col.heading}</h5>
              <ul>
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <div>&copy; 2026 Balencia, Inc.</div>
          <div className="footer-bottom-links">
            {SOCIAL_LINKS.map((name) => (
              <a href="#" key={name}>
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

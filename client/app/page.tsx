import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import { SEO } from '@/lib/seo';
import { MainLayout } from '@/components/layout';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { ScrollLine } from './ScrollLine';
import styles from './landing.module.css';

const serif = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});
const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata = SEO.home;

const LIFE_AREAS = [
  'Career',
  'Relationships',
  'Creativity',
  'Spirituality',
  'Finance',
  'Fitness',
  'Learning',
  'Custom',
];

export default function HomePage() {
  return (
    <MainLayout>
      <div className={`${serif.variable} ${sans.variable} ${mono.variable} ${styles.page}`}>
        <ScrollLine />

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}>YHEALTH · 2026</div>
            <h1 className={styles.headline}>
              I got tired of apps that watched my health and said nothing useful.
            </h1>
            <div className={styles.byline}>— Salman, founder</div>
            <p className={styles.sub}>
              A health companion that actually talks back. It watches the signal, schedules the
              work, follows up tomorrow. Not a tracker. A coach who shows up.
            </p>
            <div className={styles.actions}>
              <Link href="/auth/signup" className={styles.primaryLink}>
                Try it free →
              </Link>
              <Link href="#why" className={styles.secondaryLink}>
                read why I built this →
              </Link>
            </div>
          </div>
          <div className={styles.heroCard}>
            <article className={styles.productCard}>
              <div className={styles.cardEyebrow}>CAREER</div>
              <h3 className={styles.cardTitle}>
                Apply daily, follow up weekly, land the next role.
              </h3>
              <div className={styles.cardMeta}>
                7-day streak · 12 applications · next: Thursday 7 AM
              </div>
            </article>
          </div>
        </section>

        {/* WHY */}
        <section id="why" className={styles.why}>
          <div className={styles.sectionLabel}>WHY I BUILT THIS</div>
          <div className={styles.proseCol}>
            <p>
              <em>Every health app I used had the same problem.</em> They showed me graphs. Heart
              rate, sleep score, stress index — beautiful charts, zero accountability. I&rsquo;d
              open the app, nod at the numbers, and close it. Nothing changed.
            </p>
            <aside className={styles.pullQuote}>&ldquo;Nothing changed.&rdquo;</aside>
            <p>
              <em>The thing that actually changed my habits was a friend texting me.</em> &ldquo;Did
              you go to the gym?&rdquo; &ldquo;Did you call your mom this week?&rdquo; A human who
              cared enough to follow up. That&rsquo;s what yHealth is. Software that texts you. Not
              a dashboard.
            </p>
            <p>
              <em>I don&rsquo;t want your biometric data.</em> I want to know if you did the thing
              you said you&rsquo;d do, and if not, why not. Everything else is just plumbing.
            </p>
          </div>
        </section>

        {/* PRODUCT — three stories */}
        <section id="product" className={styles.stories}>
          <div className={styles.sectionLabel}>WHAT IT ACTUALLY DOES</div>
          <article className={`${styles.story} ${styles.storyLeft}`}>
            <h2 className={styles.storyHead}>The 7 AM accountability text.</h2>
            <p>
              Aisha said she&rsquo;d apply to two jobs a day. yHealth doesn&rsquo;t track
              applications — it asks her, every morning at 7:15, if she did it. Three weeks later,
              she had an offer.
            </p>
          </article>
          <article className={`${styles.story} ${styles.storyRight}`}>
            <h2 className={styles.storyHead}>The guilt-free Sunday.</h2>
            <p>
              David told it he wanted to call his mother every Sunday. On Sundays it nudges him. On
              Tuesdays it doesn&rsquo;t. It never guilt-trips him on Mondays because he told it he
              hates that.
            </p>
          </article>
          <article className={`${styles.story} ${styles.storyLeft}`}>
            <h2 className={styles.storyHead}>
              The 40-day streak that actually meant something.
            </h2>
            <p>
              Priya practiced guitar for 40 days straight. yHealth kept count. On day 41 she was
              sick. It said &ldquo;Rest. The streak isn&rsquo;t the point.&rdquo; Then it stopped
              nagging.
            </p>
          </article>
        </section>

        {/* AREAS */}
        <section id="areas" className={styles.areas}>
          <div className={styles.sectionLabel}>EIGHT AREAS · ONE APP</div>
          <h2 className={styles.areasHead}>
            Career. Mom. Guitar. Whatever you&rsquo;re working on.
          </h2>
          <p className={styles.areasBody}>
            yHealth covers 8 life areas out of the box, and you can add anything that isn&rsquo;t on
            this list.
          </p>
          <div className={styles.areasList}>
            {LIFE_AREAS.map((name, i) => (
              <span key={name} className={styles.areaItem}>
                <span className={styles.areaNum}>{String(i + 1).padStart(2, '0')}</span>
                <em>{name}</em>
              </span>
            ))}
          </div>
          <Link href="/life-areas" className={styles.secondaryLink}>
            See how it works →
          </Link>
        </section>

        {/* PROMISE */}
        <section id="promise" className={styles.promise}>
          <div className={styles.promiseBox}>
            <div className={styles.promiseHead}>A note on data.</div>
            <p>
              yHealth stores what you tell it. It does not sell anything. It does not &ldquo;anonymize
              and aggregate&rdquo;. If you delete your account the data is gone in 30 days. I&rsquo;m
              one person, you can email me:{' '}
              <a href="mailto:salman@xyric.com">salman@xyric.com</a>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <h2 className={styles.ctaHead}>Try it. Tell me what doesn&rsquo;t work.</h2>
          <div className={styles.byline}>
            <em>— Salman</em>
          </div>
          <Link href="/auth/signup" className={styles.primaryLink}>
            Start → /auth/signup
          </Link>
          <Link href="#pricing" className={styles.secondaryLink}>
            or read the pricing →
          </Link>
        </section>
      </div>

      {/* Keep functional SaaS sections below — not part of the editorial narrative */}
      <div id="pricing">
        <PricingSection />
      </div>
      <FAQSection />
    </MainLayout>
  );
}

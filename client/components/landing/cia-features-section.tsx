"use client";

import { useRef, useState } from "react";
import { useGSAP, gsap, ScrollTrigger } from "@/hooks/use-gsap";

/* ------------------------------------------------------------------ */
/*  Stage data – drives the label counter + dot indicator              */
/* ------------------------------------------------------------------ */
const STAGE_LABELS = [
  "Always proactive",
  "Voice · Chat · Photo",
  "Video coaching",
  "Person-to-person",
  "Finance coach",
  "Career coach",
  "AI Competitions",
  "Intelligent",
] as const;

const TOTAL_STAGES = STAGE_LABELS.length;

/* ------------------------------------------------------------------ */
/*  Shared sub-components (iPhone / MacBook chrome)                    */
/* ------------------------------------------------------------------ */

function IPhoneChrome({
  className,
  children,
  appStyle,
}: {
  className?: string;
  children: React.ReactNode;
  appStyle?: React.CSSProperties;
}) {
  return (
    <div className="iphone">
      <div className={`iphone-screen${className ? ` ${className}` : ""}`}>
        <div className="iphone-notch" />
        <div className="iphone-status">
          <span>9:41</span>
          <div className="iphone-status-icons">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>
        <div className="iphone-app" style={appStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STAGE 1 — Proactive Life Coach                                     */
/* ================================================================== */
function Stage1_ProactiveCoach() {
  return (
    <section className="cia-feature dark-section">
      <div className="cia-feature-grid">
        {/* ---- content ---- */}
        <div className="cia-feature-content">
          <div className="cia-feature-tag">
            <span className="cia-tag-orb" />
            Always proactive
          </div>
          <h3>
            She knows you, <span className="serif">before you ask.</span>
          </h3>
          <p>
            Cia notices what&rsquo;s slipping and what&rsquo;s working &mdash;
            across health, work, money, and relationships &mdash; and reaches
            out at the right moment.
          </p>
          <ul>
            <li>
              <div>
                <strong>Morning briefings</strong> &mdash; your day, your
                numbers, your priorities.
              </div>
            </li>
            <li>
              <div>
                <strong>Cross-domain pattern alerts</strong> &mdash; &ldquo;Your
                sleep drops 30% during high-spend weeks.&rdquo;
              </div>
            </li>
            <li>
              <div>
                <strong>Smart reminders</strong> &mdash; finances, fitness,
                calls, deadlines, gifts.
              </div>
            </li>
          </ul>
        </div>

        {/* ---- visual ---- */}
        <div className="cia-feature-visual">
          <div className="cia-glow" />
          <IPhoneChrome className="cia-bg">
            <div className="app-notif">
              <div className="app-notif-time">Today</div>

              <div className="app-notif-card cia">
                <div className="app-notif-icon" />
                <div className="app-notif-info">
                  <div className="app-notif-title">
                    Cia &middot; Morning briefing
                  </div>
                  <div className="app-notif-desc">
                    HRV up 12%. Push today. 3 calls scheduled. $80 left in food
                    budget.
                  </div>
                </div>
              </div>

              <div className="app-notif-card cia">
                <div className="app-notif-icon" />
                <div className="app-notif-info">
                  <div className="app-notif-title">
                    Cia &middot; Pattern alert
                  </div>
                  <div className="app-notif-desc">
                    You sleep 23% worse during high-spend weeks. Want to talk?
                  </div>
                </div>
              </div>

              <div className="app-notif-card">
                <div className="app-notif-icon">&hearts;</div>
                <div className="app-notif-info">
                  <div className="app-notif-title">
                    Sarah&rsquo;s birthday Wednesday
                  </div>
                  <div className="app-notif-desc">
                    Cia booked Lupa&rsquo;s at 7. Gift idea?
                  </div>
                </div>
              </div>

              <div className="app-notif-card">
                <div className="app-notif-icon">$</div>
                <div className="app-notif-info">
                  <div className="app-notif-title">Salary just landed</div>
                  <div className="app-notif-desc">
                    $2,400 auto-allocated to your goals.
                  </div>
                </div>
              </div>

              <div className="app-notif-card cia">
                <div className="app-notif-icon" />
                <div className="app-notif-info">
                  <div className="app-notif-title">
                    Cia &middot; Career check-in
                  </div>
                  <div className="app-notif-desc">
                    2 weeks since your last 1:1 prep. Ready?
                  </div>
                </div>
              </div>
            </div>
          </IPhoneChrome>

          <div
            className="float-widget purple-grad"
            style={{ top: "6%", right: "-10%" }}
          >
            <div className="fw-label">This week</div>
            <div className="fw-big" style={{ fontSize: 22 }}>
              14 nudges
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
              All useful, none spam
            </div>
          </div>

          <div
            className="float-widget"
            style={{ bottom: "16%", left: "-10%" }}
          >
            <div className="fw-label">Insight</div>
            <div style={{ fontSize: 12, lineHeight: 1.4, maxWidth: 160 }}>
              &ldquo;You spend more on weeks you sleep less.&rdquo;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  STAGE 2 — Voice + Chat                                             */
/* ================================================================== */
function Stage2_VoiceChat() {
  return (
    <section className="cia-feature dark-section">
      <div className="cia-feature-grid reverse">
        {/* ---- content ---- */}
        <div className="cia-feature-content">
          <div className="cia-feature-tag">
            <span className="cia-tag-orb" />
            Voice &middot; Chat &middot; Photo
          </div>
          <h3>
            Talk to her <span className="serif">like a friend.</span>
          </h3>
          <p>
            Three ways to reach Cia. She remembers everything &mdash; your
            goals, your week, your worries.
          </p>
          <ul>
            <li>
              <div>
                <strong>Voice mode</strong> &mdash; hold the orb, ask anything.
                12 languages, native voice.
              </div>
            </li>
            <li>
              <div>
                <strong>Smart chat</strong> &mdash; type, send, get answers
                grounded in your data.
              </div>
            </li>
            <li>
              <div>
                <strong>Photo input</strong> &mdash; snap a meal, receipt,
                contract. Cia gets it.
              </div>
            </li>
          </ul>
        </div>

        {/* ---- visual ---- */}
        <div className="cia-feature-visual">
          <div className="cia-glow purple" />
          <IPhoneChrome
            appStyle={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 24,
                paddingBottom: 12,
                borderBottom: "1px solid var(--line-light)",
              }}
            >
              <div className="cia-orb-sm" />
              <div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  Cia
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--lime-soft)",
                    marginTop: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      background: "var(--lime)",
                      borderRadius: "50%",
                    }}
                  />
                  Active &middot; remembers you
                </div>
              </div>
            </div>

            <div className="app-chat" style={{ flex: 1 }}>
              <div className="app-chat-msg">
                Morning. Sarah&rsquo;s birthday is Wednesday. Did you grab a
                gift yet?
              </div>
              <div className="app-chat-msg user">
                Not yet. She loves jazz and pottery.
              </div>
              <div className="app-chat-msg">
                I&rsquo;ll pull options under $80. The Blue Note has a show
                Wednesday &mdash; want me to book?
              </div>
              <div className="app-chat-msg user">Yes please</div>
              <div className="app-chat-msg">
                Done. 8pm, two tickets. Synced to your calendar &#x1F3B7;
              </div>
            </div>

            <div className="app-chat-input">
              <span style={{ fontSize: 12 }}>&#x1F4F7;</span>
              <span className="app-chat-input-text">
                Type or hold to talk...
              </span>
              <span style={{ fontSize: 12 }}>&#x1F3A4;</span>
            </div>
          </IPhoneChrome>

          <div
            className="float-widget"
            style={{ top: "8%", left: "-12%" }}
          >
            <div className="fw-label">Cia remembers</div>
            <div className="fw-small">
              Sarah loves jazz. Birthday April 30. Vegan.
            </div>
          </div>

          <div
            className="float-widget dark"
            style={{ bottom: "14%", right: "-10%" }}
          >
            <div className="fw-row">
              <span style={{ fontSize: 18 }}>&#x1F3A4;</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>Voice mode</div>
                <div style={{ fontSize: 10, color: "var(--muted-light)" }}>
                  12 languages
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  STAGE 3 — Video Call                                               */
/* ================================================================== */
function Stage3_VideoCall() {
  return (
    <section className="cia-feature dark-section">
      <div className="cia-feature-grid">
        {/* ---- content ---- */}
        <div className="cia-feature-content">
          <div className="cia-feature-tag">
            <span className="cia-tag-orb" />
            Video coaching
          </div>
          <h3>
            Face-to-face <span className="serif">with Cia.</span>
          </h3>
          <p>
            One tap to start a video session. Form check, breathing exercises,
            career coaching &mdash; face to face.
          </p>
          <ul>
            <li>
              <div>
                <strong>Live form correction</strong> &mdash; Cia sees you and
                gives real-time feedback.
              </div>
            </li>
            <li>
              <div>
                <strong>Guided sessions</strong> &mdash; yoga, mobility,
                meditation in real time.
              </div>
            </li>
            <li>
              <div>
                <strong>Career roleplay</strong> &mdash; practice interviews,
                salary talks, hard conversations.
              </div>
            </li>
          </ul>
        </div>

        {/* ---- visual ---- */}
        <div className="cia-feature-visual">
          <div className="cia-glow" />
          <IPhoneChrome className="cia-bg">
            <div className="app-video">
              <div className="app-video-main">
                <div className="app-video-cia-name">Cia</div>
                <div className="app-video-cia" />
                <div className="app-video-self">&#x1F9D8;</div>
                <div className="app-video-caption">
                  &ldquo;Lower your shoulders. Breathe deeper.&rdquo;
                </div>
              </div>
              <div className="app-video-controls">
                <div className="app-video-btn">&#x1F3A4;</div>
                <div className="app-video-btn">&#x1F4F9;</div>
                <div className="app-video-btn">&#x1F4AC;</div>
                <div className="app-video-btn end">&#x1F4DE;</div>
              </div>
            </div>
          </IPhoneChrome>

          <div
            className="float-widget"
            style={{ top: "10%", left: "-12%" }}
          >
            <div className="fw-label">Form score</div>
            <div
              className="fw-big"
              style={{ color: "var(--lime)", fontSize: 26 }}
            >
              94%
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>
              Squat depth &mdash; perfect
            </div>
          </div>

          <div
            className="float-widget dark"
            style={{ bottom: "12%", right: "-10%" }}
          >
            <div className="fw-label">Live session</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              Yoga Flow &middot; 24:18
            </div>
            <div
              style={{
                height: 4,
                background: "rgba(245,239,226,0.1)",
                borderRadius: 99,
                marginTop: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "60%",
                  background: "var(--orange)",
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  STAGE 4 — Person-to-Person Chat                                    */
/* ================================================================== */
function Stage4_P2PChat() {
  return (
    <section className="cia-feature dark-section">
      <div className="cia-feature-grid reverse">
        {/* ---- content ---- */}
        <div className="cia-feature-content">
          <div className="cia-feature-tag">
            <span className="cia-tag-orb" />
            Person-to-person
          </div>
          <h3>
            Chat with friends,{" "}
            <span className="serif">not just Cia.</span>
          </h3>
          <p>
            End-to-end encrypted messaging built right in. Talk to anyone, share
            workouts, plan dinners &mdash; Cia helps where it matters.
          </p>
          <ul>
            <li>
              <div>
                <strong>1:1 and group chats</strong> &mdash; like WhatsApp, but
                private by default.
              </div>
            </li>
            <li>
              <div>
                <strong>Shared goals</strong> &mdash; train, save, meditate
                together with friends.
              </div>
            </li>
            <li>
              <div>
                <strong>Cia in chat</strong> &mdash; tag her in any conversation
                for instant help.
              </div>
            </li>
          </ul>
        </div>

        {/* ---- visual ---- */}
        <div className="cia-feature-visual">
          <div className="cia-glow lime" />
          <IPhoneChrome>
            <div className="app-p2p-header">
              <div className="app-p2p-title">Messages</div>
              <div style={{ fontSize: 14 }}>&#x270F;&#xFE0F;</div>
            </div>
            <div className="app-p2p-search">
              <span>&#x1F50D;</span>
              <span>Search chats...</span>
            </div>
            <div className="app-p2p-list">
              {/* Cia */}
              <div className="app-p2p-row unread">
                <div className="app-p2p-avatar cia" />
                <div className="app-p2p-info">
                  <div className="app-p2p-name">
                    Cia <span className="app-p2p-name-tag">AI</span>
                  </div>
                  <div className="app-p2p-preview">
                    Sarah&rsquo;s birthday is Wednesday...
                  </div>
                </div>
                <div className="app-p2p-meta">
                  <div className="app-p2p-time">now</div>
                  <div className="app-p2p-badge">2</div>
                </div>
              </div>

              {/* Sarah */}
              <div className="app-p2p-row unread">
                <div
                  className="app-p2p-avatar"
                  style={{
                    background: "linear-gradient(135deg, #E8765A, #B5523B)",
                  }}
                >
                  S
                </div>
                <div className="app-p2p-info">
                  <div className="app-p2p-name">Sarah</div>
                  <div className="app-p2p-preview">
                    Can&rsquo;t wait for Wednesday &#x1F389;
                  </div>
                </div>
                <div className="app-p2p-meta">
                  <div className="app-p2p-time">12m</div>
                  <div className="app-p2p-badge">1</div>
                </div>
              </div>

              {/* Morning Crew */}
              <div className="app-p2p-row">
                <div
                  className="app-p2p-avatar"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--lime), #7DBA1F)",
                    color: "var(--ink)",
                  }}
                >
                  M
                </div>
                <div className="app-p2p-info">
                  <div className="app-p2p-name">Morning Crew &middot; 5</div>
                  <div className="app-p2p-preview">
                    Daniel: Pace was insane today
                  </div>
                </div>
                <div className="app-p2p-meta">
                  <div className="app-p2p-time">1h</div>
                </div>
              </div>

              {/* Daniel */}
              <div className="app-p2p-row">
                <div
                  className="app-p2p-avatar offline"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--purple), #2D2799)",
                  }}
                >
                  D
                </div>
                <div className="app-p2p-info">
                  <div className="app-p2p-name">Daniel</div>
                  <div className="app-p2p-preview">
                    You: Let&rsquo;s hit the trail Saturday
                  </div>
                </div>
                <div className="app-p2p-meta">
                  <div className="app-p2p-time">3h</div>
                </div>
              </div>

              {/* Priya */}
              <div className="app-p2p-row">
                <div
                  className="app-p2p-avatar"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--orange), #A04408)",
                  }}
                >
                  P
                </div>
                <div className="app-p2p-info">
                  <div className="app-p2p-name">Priya</div>
                  <div className="app-p2p-preview">
                    Sent you the meal plan &#x2764;&#xFE0F;
                  </div>
                </div>
                <div className="app-p2p-meta">
                  <div className="app-p2p-time">5h</div>
                </div>
              </div>
            </div>
          </IPhoneChrome>

          <div
            className="float-widget lime"
            style={{ top: "8%", right: "-10%" }}
          >
            <div className="fw-label">Encryption</div>
            <div className="fw-big" style={{ fontSize: 22 }}>
              End-to-end
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              Always on &#x1F512;
            </div>
          </div>

          <div
            className="float-widget dark"
            style={{ bottom: "14%", left: "-10%" }}
          >
            <div className="fw-label">Active chats</div>
            <div
              className="fw-big"
              style={{ color: "var(--lime)", fontSize: 22 }}
            >
              12
            </div>
            <div
              style={{ fontSize: 10, color: "var(--muted-light)", marginTop: 2 }}
            >
              3 with Cia in
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  STAGE 5 — Finance Coach                                            */
/* ================================================================== */
function Stage5_FinanceCoach() {
  return (
    <section className="cia-feature dark-section">
      <div className="cia-feature-grid">
        {/* ---- content ---- */}
        <div className="cia-feature-content">
          <div className="cia-feature-tag">
            <span className="cia-tag-orb" />
            Finance coach
          </div>
          <h3>
            Money, <span className="serif">handled.</span>
          </h3>
          <p>
            Connect your accounts. Cia tracks spending, finds savings, plans for
            goals &mdash; without judgment.
          </p>
          <ul>
            <li>
              <div>
                <strong>Auto-budgeting</strong> &mdash; Cia builds a budget that
                fits how you actually live.
              </div>
            </li>
            <li>
              <div>
                <strong>Goal tracking</strong> &mdash; emergency fund, vacation,
                retirement, all visible.
              </div>
            </li>
            <li>
              <div>
                <strong>Smart alerts</strong> &mdash; &ldquo;You spent 40% more
                on takeout this month.&rdquo;
              </div>
            </li>
          </ul>
        </div>

        {/* ---- visual ---- */}
        <div className="cia-feature-visual">
          <div className="cia-glow purple" />
          <IPhoneChrome>
            <div className="app-finance-balance">
              <div className="app-finance-label">Total balance</div>
              <div className="app-finance-amount">$24,580</div>
              <div className="app-finance-trend">
                &#x2191; $1,240 this month
              </div>
            </div>

            <div className="app-finance-cards">
              <div className="app-finance-card">
                <div className="app-finance-card-label">Saved</div>
                <div
                  className="app-finance-card-val"
                  style={{ color: "var(--lime)" }}
                >
                  $3,420
                </div>
              </div>
              <div className="app-finance-card">
                <div className="app-finance-card-label">Spent</div>
                <div
                  className="app-finance-card-val"
                  style={{ color: "var(--orange-soft)" }}
                >
                  $2,180
                </div>
              </div>
            </div>

            <div className="app-finance-list">
              {/* Salary */}
              <div className="app-finance-tx">
                <div
                  className="app-finance-tx-icon"
                  style={{ background: "rgba(163, 230, 53, 0.2)" }}
                >
                  &darr;
                </div>
                <div>
                  <div className="app-finance-tx-name">
                    Salary &middot; Acme Inc.
                  </div>
                  <div className="app-finance-tx-cat">
                    Income &middot; Today
                  </div>
                </div>
                <div className="app-finance-tx-amt income">+$5,200</div>
              </div>

              {/* Coffee */}
              <div className="app-finance-tx">
                <div
                  className="app-finance-tx-icon"
                  style={{ background: "rgba(217, 95, 14, 0.2)" }}
                >
                  &#x2615;
                </div>
                <div>
                  <div className="app-finance-tx-name">Blue Bottle</div>
                  <div className="app-finance-tx-cat">
                    Coffee &middot; 8:14 AM
                  </div>
                </div>
                <div className="app-finance-tx-amt">&minus;$6.50</div>
              </div>

              {/* Jazz */}
              <div className="app-finance-tx">
                <div
                  className="app-finance-tx-icon"
                  style={{ background: "rgba(79, 70, 229, 0.2)" }}
                >
                  &#x1F3AB;
                </div>
                <div>
                  <div className="app-finance-tx-name">Blue Note Jazz</div>
                  <div className="app-finance-tx-cat">
                    Date night &middot; Wed
                  </div>
                </div>
                <div className="app-finance-tx-amt">&minus;$120</div>
              </div>
            </div>
          </IPhoneChrome>

          <div
            className="float-widget purple-grad"
            style={{ top: "6%", right: "-10%" }}
          >
            <div className="fw-label">Goal progress</div>
            <div className="fw-big" style={{ fontSize: 22 }}>
              $12k / $15k
            </div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>
              Emergency fund &mdash; 80%
            </div>
          </div>

          <div
            className="float-widget lime"
            style={{ bottom: "14%", left: "-10%" }}
          >
            <div className="fw-label">Cia found</div>
            <div className="fw-big" style={{ fontSize: 22 }}>
              $340/mo
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              Subscriptions to cut
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  STAGE 6 — Career Coach (MacBook)                                   */
/* ================================================================== */
function Stage6_CareerCoach() {
  return (
    <section className="cia-feature dark-section">
      <div className="cia-feature-grid reverse">
        {/* ---- content ---- */}
        <div className="cia-feature-content">
          <div className="cia-feature-tag">
            <span className="cia-tag-orb" />
            Career coach
          </div>
          <h3>
            Climb, <span className="serif">on purpose.</span>
          </h3>
          <p>
            Cia tracks your career goals, preps you for hard conversations, and
            reminds you why you&rsquo;re doing this.
          </p>
          <ul>
            <li>
              <div>
                <strong>Quarterly goals</strong> &mdash; broken into weekly
                actions Cia tracks for you.
              </div>
            </li>
            <li>
              <div>
                <strong>1:1 prep</strong> &mdash; wins, blockers, asks &mdash;
                drafted before every meeting.
              </div>
            </li>
            <li>
              <div>
                <strong>Salary intel</strong> &mdash; know what you&rsquo;re
                worth, when to ask, how to negotiate.
              </div>
            </li>
          </ul>
        </div>

        {/* ---- visual ---- */}
        <div className="cia-feature-visual">
          <div className="cia-glow" />
          <div className="macbook">
            <div className="macbook-screen">
              <div className="macbook-notch" />
              <div className="macbook-display">
                <div className="macbook-traffic">
                  <div />
                  <div />
                  <div />
                </div>

                {/* Career OKR dashboard - 2-col grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    marginTop: 18,
                    flex: 1,
                  }}
                >
                  {/* Left col: Goal + progress */}
                  <div
                    style={{
                      background: "rgba(245,239,226,0.04)",
                      border: "1px solid var(--line-light)",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--orange)",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      Q2 Goal
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 18,
                        marginTop: 4,
                        lineHeight: 1.15,
                      }}
                    >
                      Ship Series B platform
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 14,
                        fontSize: 9,
                        color: "var(--muted-light)",
                      }}
                    >
                      <span>Progress</span>
                      <span
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: 13,
                          color: "var(--cream)",
                        }}
                      >
                        72%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: "rgba(245,239,226,0.08)",
                        borderRadius: 99,
                        overflow: "hidden",
                        marginTop: 4,
                      }}
                    >
                      <div
                        style={{
                          width: "72%",
                          height: "100%",
                          background:
                            "linear-gradient(90deg, var(--orange), var(--purple))",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginTop: 14,
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(245,239,226,0.04)",
                          borderRadius: 8,
                          padding: "6px 8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8,
                            color: "var(--muted-light)",
                            textTransform: "uppercase" as const,
                            letterSpacing: "0.1em",
                          }}
                        >
                          Days left
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--serif)",
                            fontSize: 14,
                            marginTop: 2,
                          }}
                        >
                          23
                        </div>
                      </div>
                      <div
                        style={{
                          background: "rgba(245,239,226,0.04)",
                          borderRadius: 8,
                          padding: "6px 8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8,
                            color: "var(--muted-light)",
                            textTransform: "uppercase" as const,
                            letterSpacing: "0.1em",
                          }}
                        >
                          On track
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--serif)",
                            fontSize: 14,
                            marginTop: 2,
                            color: "var(--lime-soft)",
                          }}
                        >
                          Yes
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right col: Tasks list */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--muted-light)",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase" as const,
                        marginBottom: 2,
                      }}
                    >
                      This week
                    </div>

                    {/* Done: Architecture review */}
                    <div
                      style={{
                        background: "rgba(163,230,53,0.08)",
                        border: "1px solid rgba(163,230,53,0.3)",
                        borderRadius: 8,
                        padding: 8,
                        display: "grid",
                        gridTemplateColumns: "14px 1fr",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "var(--lime)",
                          position: "relative" as const,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute" as const,
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%,-50%)",
                            color: "var(--ink)",
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                        >
                          &#x2713;
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600 }}>
                          Architecture review
                        </div>
                        <div
                          style={{
                            fontSize: 8,
                            color: "var(--muted-light)",
                          }}
                        >
                          Done &middot; Mon
                        </div>
                      </div>
                    </div>

                    {/* Done: Hire 2 engineers */}
                    <div
                      style={{
                        background: "rgba(163,230,53,0.08)",
                        border: "1px solid rgba(163,230,53,0.3)",
                        borderRadius: 8,
                        padding: 8,
                        display: "grid",
                        gridTemplateColumns: "14px 1fr",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "var(--lime)",
                          position: "relative" as const,
                        }}
                      >
                        <span
                          style={{
                            position: "absolute" as const,
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%,-50%)",
                            color: "var(--ink)",
                            fontSize: 8,
                            fontWeight: 700,
                          }}
                        >
                          &#x2713;
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600 }}>
                          Hire 2 engineers
                        </div>
                        <div
                          style={{
                            fontSize: 8,
                            color: "var(--muted-light)",
                          }}
                        >
                          Done &middot; Last week
                        </div>
                      </div>
                    </div>

                    {/* In progress: Board prep */}
                    <div
                      style={{
                        background: "rgba(217,95,14,0.08)",
                        border: "1px solid rgba(217,95,14,0.3)",
                        borderRadius: 8,
                        padding: 8,
                        display: "grid",
                        gridTemplateColumns: "14px 1fr",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "var(--orange)",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600 }}>
                          Board prep
                        </div>
                        <div
                          style={{
                            fontSize: 8,
                            color: "var(--muted-light)",
                          }}
                        >
                          Cia drafted notes &middot; Fri
                        </div>
                      </div>
                    </div>

                    {/* Upcoming: 1:1 with VP Eng */}
                    <div
                      style={{
                        background: "rgba(245,239,226,0.04)",
                        border: "1px solid var(--line-light)",
                        borderRadius: 8,
                        padding: 8,
                        display: "grid",
                        gridTemplateColumns: "14px 1fr",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: "1.5px solid rgba(245,239,226,0.2)",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600 }}>
                          1:1 with VP Eng
                        </div>
                        <div
                          style={{
                            fontSize: 8,
                            color: "var(--muted-light)",
                          }}
                        >
                          Tomorrow &middot; talking points ready
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom: Velocity chart */}
                <div
                  style={{
                    background: "rgba(245,239,226,0.04)",
                    border: "1px solid var(--line-light)",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--muted-light)",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      Velocity &middot; last 8 weeks
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--serif)",
                        color: "var(--lime-soft)",
                      }}
                    >
                      +24% vs Q1
                    </div>
                  </div>
                  <svg
                    viewBox="0 0 400 60"
                    preserveAspectRatio="none"
                    style={{ width: "100%", height: 50, display: "block" }}
                  >
                    <defs>
                      <linearGradient
                        id="careerGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#A3E635"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="#A3E635"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <polyline
                      points="0,42 50,38 100,40 150,28 200,30 250,18 300,22 350,12 400,8"
                      fill="none"
                      stroke="#A3E635"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <polygon
                      points="0,42 50,38 100,40 150,28 200,30 250,18 300,22 350,12 400,8 400,60 0,60"
                      fill="url(#careerGrad)"
                    />
                    <circle cx="400" cy="8" r="3" fill="#A3E635" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="macbook-base" />
          </div>

          <div
            className="float-widget"
            style={{ top: "8%", left: "-6%" }}
          >
            <div className="fw-label">Cia drafted</div>
            <div style={{ fontSize: 12, lineHeight: 1.4, maxWidth: 160 }}>
              &ldquo;3 wins, 2 blockers, 1 ask&rdquo; &mdash; ready for
              tomorrow&rsquo;s 1:1.
            </div>
          </div>

          <div
            className="float-widget purple-grad"
            style={{ bottom: "12%", right: "-6%" }}
          >
            <div className="fw-label">Salary intel</div>
            <div className="fw-big" style={{ fontSize: 22 }}>
              +18%
            </div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
              Above your role&rsquo;s median
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  STAGE 7 — AI Competitions + Leaderboard                            */
/* ================================================================== */
function Stage7_Competitions() {
  return (
    <section className="cia-feature dark-section">
      <div className="cia-feature-grid">
        {/* ---- content ---- */}
        <div className="cia-feature-content">
          <div className="cia-feature-tag">
            <span className="cia-tag-orb" />
            AI Competitions
          </div>
          <h3>
            Compete in <span className="serif">your own life.</span>
          </h3>
          <p>
            Cia generates personalized competitions based on your goals. Climb
            leaderboards. Earn crowns. Stay accountable.
          </p>
          <ul>
            <li>
              <div>
                <strong>AI-generated challenges</strong> &mdash; fresh
                competitions tuned to your goals.
              </div>
            </li>
            <li>
              <div>
                <strong>Friend leaderboards</strong> &mdash; global, country,
                and friends-only podiums.
              </div>
            </li>
            <li>
              <div>
                <strong>Live chat &amp; streams</strong> &mdash; talk trash,
                share wins, watch others go.
              </div>
            </li>
          </ul>
        </div>

        {/* ---- visual ---- */}
        <div className="cia-feature-visual">
          <div className="cia-glow lime" />
          <IPhoneChrome className="cia-bg">
            <div className="app-leaderboard">
              <div className="app-leaderboard-tabs">
                <div className="app-leaderboard-tab active">Global</div>
                <div className="app-leaderboard-tab">Country</div>
                <div className="app-leaderboard-tab">Friends</div>
              </div>

              <div className="app-podium">
                <div className="app-podium-spot second">
                  <div className="app-podium-avatar">S</div>
                  <div className="app-podium-name">Salman</div>
                  <div className="app-podium-score">16</div>
                  <div className="app-podium-block">2</div>
                </div>
                <div className="app-podium-spot first">
                  <div className="app-podium-avatar">H</div>
                  <div className="app-podium-name">Harris</div>
                  <div className="app-podium-score">16</div>
                  <div className="app-podium-block">1</div>
                </div>
                <div className="app-podium-spot third">
                  <div className="app-podium-avatar">A</div>
                  <div className="app-podium-name">Cia</div>
                  <div className="app-podium-score">15</div>
                  <div className="app-podium-block">3</div>
                </div>
              </div>

              <div className="app-leaderboard-you">
                <div className="app-leaderboard-you-rank">4</div>
                <div className="app-leaderboard-you-avatar">X</div>
                <div className="app-leaderboard-you-info">
                  <div className="app-leaderboard-you-label">You</div>
                  <div className="app-leaderboard-you-name">
                    Climbing &#x1F4C8;
                  </div>
                </div>
                <div className="app-leaderboard-you-score">11</div>
              </div>

              <div className="app-comp-card">
                <div className="app-comp-tag">AI Generated</div>
                <div className="app-comp-title">Total Health Challenge</div>
                <div className="app-comp-desc">
                  Combine workout, nutrition, wellbeing, biometrics for the
                  highest score.
                </div>
                <div className="app-comp-progress">
                  <div className="app-comp-progress-fill" />
                </div>
                <div className="app-comp-meta">
                  <span>29 active</span>
                  <span style={{ color: "var(--lime)" }}>2 days left</span>
                </div>
              </div>
            </div>
          </IPhoneChrome>

          <div
            className="float-widget purple-grad"
            style={{ top: "6%", left: "-10%" }}
          >
            <div className="fw-row">
              <span style={{ fontSize: 22 }}>&#x1F3C6;</span>
              <div>
                <div className="fw-label">Active</div>
                <div className="fw-big" style={{ fontSize: 22 }}>
                  29
                </div>
              </div>
            </div>
          </div>

          <div
            className="float-widget lime"
            style={{ bottom: "12%", right: "-10%" }}
          >
            <div className="fw-label">Cia says</div>
            <div style={{ fontSize: 12, lineHeight: 1.4, maxWidth: 160 }}>
              &ldquo;5 more steps to overtake Cia.&rdquo;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  STAGE 8 — Intelligence                                             */
/* ================================================================== */
function Stage8_Intelligence() {
  return (
    <section className="cia-feature dark-section">
      <div className="cia-feature-grid reverse">
        {/* ---- content ---- */}
        <div className="cia-feature-content">
          <div className="cia-feature-tag">
            <span className="cia-tag-orb" />
            Intelligent
          </div>
          <h3>
            Answers grounded in <span className="serif">your life.</span>
          </h3>
          <p>
            Cia doesn&rsquo;t guess. She reads your data across health, finance,
            work, and relationships &mdash; then explains what&rsquo;s actually
            going on.
          </p>
          <ul>
            <li>
              <div>
                <strong>Cited research</strong> &mdash; every recommendation
                backed by trusted sources.
              </div>
            </li>
            <li>
              <div>
                <strong>Cross-domain insights</strong> &mdash; connects sleep to
                spending, stress to performance.
              </div>
            </li>
            <li>
              <div>
                <strong>Plain English</strong> &mdash; no jargon, no
                medical-speak.
              </div>
            </li>
          </ul>
        </div>

        {/* ---- visual ---- */}
        <div className="cia-feature-visual">
          <div className="cia-glow" />
          <IPhoneChrome className="cia-bg">
            <div style={{ marginTop: 22 }}>
              {/* User question */}
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 14,
                  background: "rgba(245,239,226,0.06)",
                  padding: "10px 12px",
                  borderRadius: "12px 12px 12px 2px",
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                &ldquo;Why am I exhausted this week?&rdquo;
              </div>

              {/* Cross-domain analysis */}
              <div
                style={{
                  background: "rgba(245,239,226,0.05)",
                  border: "1px solid var(--line-light)",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.1em",
                    color: "var(--purple-glow)",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  &mdash; Cia &middot; Cross-domain analysis
                </div>
                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: "var(--cream)",
                  }}
                >
                  Three things are stacking:
                </div>
                <div
                  style={{
                    marginTop: 8,
                    paddingLeft: 8,
                    borderLeft: "2px solid var(--orange)",
                    fontSize: 10,
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    <strong>1.</strong> Sleep down <strong>18%</strong> from
                    baseline.
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>2.</strong> Spending up <strong>40%</strong> &mdash;
                    financial stress.
                  </div>
                  <div>
                    <strong>3.</strong> 4 late-night work calls.
                  </div>
                </div>
              </div>

              {/* My take */}
              <div
                style={{
                  background: "rgba(245,239,226,0.05)",
                  border: "1px solid var(--line-light)",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.1em",
                    color: "var(--lime)",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  My take
                </div>
                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: "var(--cream)",
                  }}
                >
                  Skip tonight&rsquo;s call. Pause one subscription. Sleep
                  early. Talk Friday.
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 10,
                    flexWrap: "wrap" as const,
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      background: "rgba(245,239,226,0.08)",
                      padding: "3px 8px",
                      borderRadius: 99,
                      color: "var(--muted-light)",
                    }}
                  >
                    &#x1F4C4; sleep-journal.org
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      background: "rgba(245,239,226,0.08)",
                      padding: "3px 8px",
                      borderRadius: 99,
                      color: "var(--muted-light)",
                    }}
                  >
                    &#x1F4C4; hbr.org
                  </div>
                </div>
              </div>
            </div>
          </IPhoneChrome>

          <div
            className="float-widget"
            style={{ top: "6%", left: "-10%" }}
          >
            <div className="fw-label">Sources cited</div>
            <div className="fw-row">
              <span className="fw-row-icon">&#x1F4C4;</span>
              <span className="fw-big" style={{ fontSize: 22 }}>
                3 studies
              </span>
            </div>
          </div>

          <div
            className="float-widget purple-grad"
            style={{ bottom: "12%", right: "-8%" }}
          >
            <div className="fw-label">Confidence</div>
            <div className="fw-big" style={{ fontSize: 22 }}>
              92%
            </div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>
              Based on your data
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Stage registry                                                     */
/* ================================================================== */
const STAGES: React.FC[] = [
  Stage1_ProactiveCoach,
  Stage2_VoiceChat,
  Stage3_VideoCall,
  Stage4_P2PChat,
  Stage5_FinanceCoach,
  Stage6_CareerCoach,
  Stage7_Competitions,
  Stage8_Intelligence,
];

/* ================================================================== */
/*  Main exported component                                            */
/* ================================================================== */
export function CiaFeaturesSection() {
  const pinWrapRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const stageNumRef = useRef<HTMLSpanElement>(null);
  const stageNameRef = useRef<HTMLSpanElement>(null);
  const [activeStage, setActiveStage] = useState(0);

  /* ---- GSAP: pin + scroll-driven stage switching ---- */
  useGSAP(
    () => {
      const pinWrap = pinWrapRef.current;
      const pin = pinRef.current;
      if (!pinWrap || !pin) return;

      // Only pin on desktop (> 880px)
      if (window.innerWidth <= 880) {
        // Mobile: make all stages visible, run float yoyo only
        const allFeatures = pin.querySelectorAll<HTMLElement>(
          ":scope > .cia-feature"
        );
        allFeatures.forEach((section) => {
          section.classList.add("cia-active");
          section.querySelectorAll<HTMLElement>(".float-widget").forEach(
            (widget, i) => {
              gsap.to(widget, {
                y: -10,
                duration: 2 + i * 0.3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
              });
            }
          );
        });
        return;
      }

      const ciaFeatures = pin.querySelectorAll<HTMLElement>(
        ":scope > .cia-feature"
      );
      const totalStages = ciaFeatures.length;

      // Build stage labels from each section's tag text
      const stageLabels = Array.from(ciaFeatures).map((s) => {
        const tag = s.querySelector(".cia-feature-tag");
        if (!tag) return "Stage";
        return tag.textContent?.trim() ?? "Stage";
      });

      // Set initial active
      ciaFeatures[0]?.classList.add("cia-active");

      // Dynamic height: each stage gets one viewport of scroll
      function setupHeight() {
        const totalHeight = totalStages * window.innerHeight;
        pinWrap!.style.height = `${totalHeight}px`;
      }
      setupHeight();

      // Continuously running float-widget yoyo (independent of pin state)
      ciaFeatures.forEach((section) => {
        section
          .querySelectorAll<HTMLElement>(".float-widget")
          .forEach((widget, i) => {
            gsap.to(widget, {
              y: -10,
              duration: 2 + i * 0.3,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            });
          });
      });

      let lastStage = -1;

      ScrollTrigger.create({
        trigger: pinWrap,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          const stage = Math.min(
            Math.floor(p * totalStages),
            totalStages - 1
          );

          // Top progress bar
          if (progressFillRef.current) {
            progressFillRef.current.style.width = `${p * 100}%`;
          }

          if (stage !== lastStage) {
            // Update sections: active / exiting
            ciaFeatures.forEach((s, i) => {
              s.classList.remove("cia-active", "cia-exiting");
              if (i === stage) s.classList.add("cia-active");
              else if (i < stage) s.classList.add("cia-exiting");
            });

            // Update label
            if (stageNumRef.current) {
              stageNumRef.current.textContent = String(stage + 1).padStart(
                2,
                "0"
              );
            }
            if (stageNameRef.current) {
              stageNameRef.current.textContent =
                stageLabels[stage] ?? "Cia";
            }

            // Update React state for dots
            setActiveStage(stage);

            lastStage = stage;
          }
        },
      });

      // Re-setup on resize
      let resizeTimer: ReturnType<typeof setTimeout>;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          setupHeight();
          ScrollTrigger.refresh();
        }, 200);
      };
      window.addEventListener("resize", onResize);

      // Cleanup handled by gsap.context().revert(), but also remove listener
      return () => {
        window.removeEventListener("resize", onResize);
      };
    },
    pinWrapRef,
    []
  );

  return (
    <section
      className="cia-features-pin-wrap"
      id="ciaFeaturesPinWrap"
      ref={pinWrapRef}
    >
      <div className="cia-features-pin" id="ciaFeaturesPin" ref={pinRef}>
        {/* Progress bar */}
        <div className="cia-stage-progress">
          <div
            className="cia-stage-progress-fill"
            id="ciaStageProgressFill"
            ref={progressFillRef}
          />
        </div>

        {/* Stage label */}
        <div className="cia-stage-label">
          <span
            className="cia-stage-label-num"
            id="ciaStageNum"
            ref={stageNumRef}
          >
            01
          </span>
          <span className="cia-stage-label-divider">/ 08 &mdash;</span>
          <span id="ciaStageName" ref={stageNameRef}>
            Always proactive
          </span>
        </div>

        {/* All 8 stages */}
        {STAGES.map((StageComponent, i) => (
          <StageComponent key={i} />
        ))}

        {/* Stage indicator dots */}
        <div
          className="cia-stage-indicator"
          id="ciaStageDots"
        >
          {Array.from({ length: TOTAL_STAGES }).map((_, i) => (
            <div
              key={i}
              className={`cia-stage-dot${i === activeStage ? " active" : ""}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CiaFeaturesSection;

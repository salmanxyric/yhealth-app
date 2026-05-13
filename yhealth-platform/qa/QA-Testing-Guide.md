---
type: qa-guide
title: QA Testing Guide
status: Draft
owner: hamza-muqeem
last_updated: 2026-02-17
kb_summary: Step-by-step testing guide for non-technical team members
---

# QA Testing Guide

> You don't need to be technical. You need to be honest about your experience using the product.

## Before You Start

**What you need:**
- A browser (Chrome or Safari recommended)
- The app URL (provided in your round summary)
- Your feedback file (copy from [QA-Feedback-Template.md](QA-Feedback-Template.md))

**Time commitment:** 30-60 minutes

**No dev setup required.** You're testing the live app like a real user would.

**How to create your feedback file:**
1. Open [QA-Feedback-Template.md](QA-Feedback-Template.md)
2. Copy its entire contents
3. Create a new file in the current round folder named `QA-Feedback-[YourFirstName].md`
4. Paste the template and fill in your details in the frontmatter
5. You're ready to test

---

## The Two Hats You Wear

Every tester wears two hats simultaneously during testing.

### Hat 1: End User (Everyone Wears This)

**You ARE a real user.** This is the primary lens.

Ask yourself:
- Does this feel good to use? Is it intuitive?
- Would I use this daily? Would I recommend it to a friend?
- Are the features actually producing great results, or falling flat?
- Is anything confusing, broken, or missing?
- Where did I get stuck? Where did I feel delighted?
- Does the product deliver on its promise?

Don't filter your reactions. If something feels off, it IS a finding. Your gut reaction as a user is exactly what we need.

### Hat 2: Professional Lens (Your Unique Expertise)

After testing as a user, put on your department hat and look deeper.

| Your Role | Your Professional Lens | Look For |
|-----------|----------------------|----------|
| **Co-Founder (Strategy)** | Strategic alignment | Does this match our vision? Is the value proposition clear? Would this win in the market? Any business model concerns? |
| **CTO** | Technical quality | Error handling quality, loading states, data consistency, security red flags, architecture concerns visible from UI |
| **Software Engineer** | Edge cases & robustness | What breaks when you try weird inputs? Empty states? Back button behavior? Rapid clicking? Performance under load? |
| **UI/UX Designer** | Design consistency | Spacing inconsistencies, color mismatches, font issues, alignment problems, interaction patterns that feel off, accessibility gaps |
| **Marketing Manager** | Brand & messaging | Is the copy compelling? Brand-consistent? Would this screenshot well for marketing? Any messaging that would confuse prospects? |
| **BI Engineer** | Data & analytics | Are numbers accurate? Do charts make sense? Is data presented clearly? Any metrics that seem wrong or misleading? |
| **Financial Analyst** | Business logic | Are calculations correct? Do pricing or scoring flows make sense? Any business logic that seems off? |

---

## What to Test

Work through these paths in order. You don't have to complete all of them — do what you can in 30-60 minutes and note which paths you covered.

### Path 1: First-Time User Flow

Pretend you've never seen the app before.

1. Land on the app — what's your first impression?
2. Go through onboarding / sign-up
3. Complete any initial assessment or setup
4. Arrive at the home screen — do you know what to do next?
5. **Ask yourself:** Would a new user feel welcomed and guided, or lost and confused?

### Path 2: Daily Usage Flow

You're a returning user checking in for the day.

1. Open the dashboard — does it show useful information at a glance?
2. Navigate to the health pillars — are they clear and actionable?
3. Try the AI coach — ask it something. Is the response helpful?
4. Log an activity or health data point — is the process smooth?
5. **Ask yourself:** Would I do this every day, or would I abandon it after a week?

### Path 3: Navigation & Discovery

Explore without a specific goal.

1. Try to find your settings or profile
2. Look for your goals or progress history
3. Navigate between major sections — is it obvious how to get around?
4. Use any search or filter features
5. **Ask yourself:** Can I find what I need without thinking too hard?

### Path 4: Data & Content Quality

Focus on what the app says and shows.

1. Read the health insights — are they accurate and useful?
2. Check all copy for typos, awkward phrasing, or unclear language
3. Look at any charts, scores, or metrics — do the numbers make sense?
4. Review any AI-generated content — is it high quality?
5. **Ask yourself:** Does the content feel trustworthy and professional?

### Path 5: Edge Cases & Stress Testing

Try to break things (gently).

1. Submit empty forms — what happens?
2. Enter unusual data (very long text, special characters, extreme numbers)
3. Use the back button mid-flow — does it handle it gracefully?
4. Try the same action twice rapidly
5. Test on a slow connection if you can (throttle in browser dev tools)
6. **Ask yourself:** Does the app handle the unexpected, or does it crumble?

---

## How to Report Findings

### One finding per row in your feedback table.

For each issue, capture:

| Field | What to Write |
|-------|--------------|
| **Category** | BUG, UX, CONTENT, SUGGESTION, MISSING, PRAISE, or FEATURE-VALIDATION |
| **Severity** | Critical, Major, Minor, or Nitpick |
| **Page/Area** | Where in the app (e.g., "Dashboard", "Onboarding Step 2", "AI Coach") |
| **Description** | What happened — be specific |
| **Expected vs Actual** | What you expected to happen vs what actually happened |

### Category Codes

| Code | Meaning | Example |
|------|---------|---------|
| **BUG** | Something is broken | Button doesn't work, page crashes, data not saving |
| **UX** | Works but feels wrong | Confusing flow, hard to find feature, unintuitive interaction |
| **CONTENT** | Text/copy issues | Typo, unclear label, misleading description, tone mismatch |
| **SUGGESTION** | Improvement idea | "It would be better if..." — concrete improvement proposals |
| **MISSING** | Expected feature absent | Something you expected to find but couldn't |
| **PRAISE** | Something done well | Features, flows, or details that impressed you |
| **FEATURE-VALIDATION** | Feature not delivering value | The feature exists but isn't producing great results |

### Severity Levels

| Level | Meaning | Example |
|-------|---------|---------|
| **Critical** | Blocks usage, data loss, security issue | Can't complete sign-up, data disappears, crash |
| **Major** | Significant impact on experience | Key feature confusing, important flow broken, major visual bug |
| **Minor** | Noticeable but workaround exists | Slight misalignment, minor copy issue, slow but functional |
| **Nitpick** | Polish item, low impact | Pixel-level spacing, font weight preference, subtle animation |

---

## Tips for Great Feedback

- **Be specific.** "The dashboard is confusing" is less useful than "On the dashboard, I couldn't tell what the health score number (73) means or how to improve it."
- **Screenshots help.** If you can grab a screenshot, paste the filename or describe what you see.
- **Your confusion IS a finding.** If you hesitated or wondered "what does this do?", that's a UX issue worth reporting.
- **Praise matters too.** Knowing what works well is just as important as knowing what doesn't. Use the PRAISE category.
- **Don't self-censor.** No finding is too small or too obvious. If you noticed it, other users will too.

---

## FAQ

**"I'm not technical — can I really find useful issues?"**
Absolutely. Your confusion, frustration, or delight as a non-technical user is the most valuable feedback we can get. Technical people often can't see usability problems because they understand how things work under the hood.

**"How detailed should my descriptions be?"**
Describe three things: (1) what you did, (2) what you expected to happen, (3) what actually happened. That's enough.

**"What if I find the same issue multiple times?"**
Report it once, but note that it appears in multiple places (e.g., "Seen on Dashboard, Profile, and Settings pages").

**"What if I'm not sure if something is a bug or intentional?"**
Report it anyway. Add a note: "Not sure if intentional." We'd rather review a false positive than miss a real issue.

**"I only had 20 minutes — is that enough?"**
Yes. Even partial coverage is valuable. Just note which test paths you completed in your feedback file.

**"What's FEATURE-VALIDATION?"**
This is for features that technically work but aren't delivering value. For example: "The AI coach responds, but the advice is too generic to be useful." The feature isn't broken — it's just not good enough yet.

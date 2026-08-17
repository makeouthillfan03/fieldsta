// Content source for the programmatic SEO pages (see scripts/generate-seo.mjs).
//
// These are real landing pages, not doorway pages. Google's own guidance
// kills "large numbers of pages with little unique value" — 20 templates
// with a swapped noun would rank for nothing and can earn a manual action,
// so every entry below carries content that is only true of THAT trade:
// what actually arrives in their inbox, who is answering it today, and why
// a slow reply specifically loses THAT job. If a field could be copied
// verbatim to another vertical, it isn't finished.
//
// HARD RULE, same as the rest of the site: no invented statistics, no
// customer counts, no response-time guarantees, no case studies. Every
// claim here is either a description of how the product works or a
// qualitative statement about the trade that a practitioner would agree
// with. "Leads go cold" is fine. "78% of leads go cold in 5 minutes" is
// not, and is exactly what a cold-call prospect would check.

// The www host, NOT the apex: fieldsta.com 308-redirects to
// www.fieldsta.com, so apex canonicals and sitemap entries would every one
// of them point at a redirect. Google resolves that, but it wastes crawl
// budget and hands the indexer an ambiguous canonical signal on the pages
// whose whole job is to be indexed cleanly. Verified against the live
// response, not assumed — CLAUDE.md and the marketing copy both say
// "fieldsta.com", which is what made this easy to get wrong.
export const SITE = "https://www.fieldsta.com";

export const PRODUCTS = {
  lead: {
    key: "lead",
    name: "AI lead response",
    priceLine: "$500/month",
    base: "ai-lead-response",
    blurb:
      "Fieldsta replies to every inbound lead, qualifies it against criteria you set, and books the meeting — with a human reviewing every booking before it's confirmed.",
    assurance: "human review on every booking · cancel anytime",
    demoLabel: "See it work on a real lead",
    demoHref: "/try",
  },
  support: {
    key: "support",
    name: "AI support agent",
    priceLine: "$200/month",
    base: "ai-support-agent",
    blurb:
      "A 24/7 chat agent on your own website that answers your customers from facts you give it, and hands off to a real person the moment it isn't sure.",
    // Deliberately NOT "human review on every booking" — this product does
    // not book anything, and /try is the lead-response demo. Shipping the
    // lead product's assurance line and demo link on a support page is a
    // promise about a feature that doesn't exist here.
    assurance: "answers only from facts you write · escalates anything else · cancel anytime",
    // /support-demo (a vercel.json redirect to the app server, same
    // mechanism as /grader) is the live widget itself — the product's own
    // demo, not the lead product's grader, which is what sat here before.
    demoLabel: "Talk to it live",
    demoHref: "/support-demo",
  },
};

export const VERTICALS = [
  {
    slug: "marketing-agencies",
    name: "Marketing Agencies",
    noun: "marketing agency",
    products: ["lead"],
    intent: "AI lead response for marketing agencies",
    todayReality:
      "An agency runs two lead flows at once and they compete for the same person's attention: inbound for the agency itself, and inbound for whichever client is currently spending the most. The client's leads win, because those are billable and visible on a report. The agency's own new-business inbox is what goes quiet for three days.",
    whoAnswersNow:
      "Usually a founder or an account lead between calls — the two people whose calendars are already full. There is rarely a person whose actual job is answering new-business email.",
    whatComesIn:
      "Contact-form fills from the agency site, referrals arriving as a forwarded email, RFP invitations with a deadline attached, and inbound from whatever content or ads the agency runs for itself.",
    stakes:
      "Agency buyers shop in parallel — they email four shops the same week and take the one that engages first seriously. A reply on day three arrives after the shortlist already formed. It isn't that the lead said no; it's that the conversation never started.",
    fitNotes:
      "This is the customer Fieldsta was built for first. The qualifying criteria are yours — budget floor, retainer vs project, in-scope services, industries you won't take — and the agent applies them the same way at 9pm as at 9am.",
    limits:
      "It will not invent pricing, promise a scope, or agree to an RFP timeline. Anything resembling a commitment is drafted and waits for you.",
    faqs: [
      {
        q: "Will it sound like a template to someone who writes copy for a living?",
        a: "It writes from your own voice settings and the specifics of what the person actually asked, not a mail-merge. It's also the fair objection to have — the honest answer is to read the drafts it produces on your real leads during the pilot and judge them yourself, which is what the review step exists for.",
      },
      {
        q: "Can it handle leads for our clients, not just for us?",
        a: "Yes — each account has its own qualifying criteria, voice, and sign-off, so a client's lead flow is configured separately from your own new-business flow rather than sharing one set of rules.",
      },
      {
        q: "Does every reply need approval?",
        a: "That's your call per account. You can review everything, or let routine replies send automatically while bookings and rejections always wait for a human.",
      },
    ],
  },
  {
    slug: "hvac-contractors",
    name: "HVAC Contractors",
    noun: "HVAC company",
    products: ["lead", "support"],
    intent: "AI lead response and after-hours answering for HVAC contractors",
    todayReality:
      "HVAC demand arrives in weather-driven spikes. The first hot week of summer produces more inbound in four days than the previous six weeks combined, and it lands precisely when every tech is already booked and the office is fielding calls from customers who are currently uncomfortable.",
    whoAnswersNow:
      "Whoever is at the desk, between dispatch calls — and after 5pm, an answering service that takes a name and number, or voicemail.",
    whatComesIn:
      "No-cool and no-heat emergencies, replacement-quote requests on a system that finally died, maintenance-plan questions, and warranty follow-ups on work already done.",
    stakes:
      "A homeowner with no AC in August is calling down a list, and they stop at the first company that gives them a real answer about today. This is the clearest case in the trades where response speed and revenue are the same variable.",
    fitNotes:
      "The distinction that matters is emergency versus quote. Your criteria decide what counts as urgent enough to interrupt someone, so a no-heat call in January routes differently from a spring maintenance question.",
    limits:
      "It does not dispatch a truck, quote a system, or commit to an arrival window. It gets the job qualified and in front of the person who owns the schedule.",
    faqs: [
      {
        q: "Can it tell a real emergency from a routine request?",
        a: "It sorts against criteria you write, in your words — including what makes something urgent for your business. It does not decide on its own what an emergency is, and it escalates anything ambiguous rather than guessing.",
      },
      {
        q: "What happens on a summer spike when volume triples?",
        a: "Software capacity doesn't change with the weather — the hundredth lead on the busiest day of the year gets the same handling as the first. The constraint moves back to your schedule, which is where it should be.",
      },
      {
        q: "Will it give a price over chat?",
        a: "No. Pricing depends on the equipment and the house, and a number given in chat becomes an expectation you're then arguing with. It gathers what a real quote needs and hands it over.",
      },
    ],
  },
  {
    slug: "plumbers",
    name: "Plumbers",
    noun: "plumbing company",
    products: ["lead", "support"],
    intent: "AI lead response and after-hours answering for plumbers",
    todayReality:
      "Plumbing splits into two businesses sharing one phone line: emergencies that cannot wait an hour, and planned work — a repipe, a water heater, a bathroom — that a homeowner is quietly getting three quotes on. The emergency always interrupts the quote, so the quote gets answered last or not at all.",
    whoAnswersNow:
      "Often the owner, from a truck, between jobs, with wet hands. After hours it's voicemail or a call service reading from a script.",
    whatComesIn:
      "Active leaks and backups, water-heater failures, quote requests for planned replacements, and questions from homeowners trying to figure out whether what they're looking at is urgent.",
    stakes:
      "The emergency call is won on speed and lost to whoever picks up. The planned-work quote is lost more quietly — the homeowner got three replies, yours came Thursday, and they'd already booked.",
    fitNotes:
      "The planned-work side is where this earns its keep. Emergencies find you regardless; it's the repipe quote that silently leaks out of the business, and that's the one nobody notices losing.",
    limits:
      "It never tells someone their situation is or isn't an emergency, and never talks a homeowner through a repair. Urgency claims get a person, fast.",
    faqs: [
      {
        q: "Someone messages at 2am with water coming through the ceiling. What happens?",
        a: "They get an immediate, honest response that a person is being reached — not a promise of an arrival time it can't keep — and the escalation fires to you right then. The point is that they're not sitting in silence deciding to call the next company.",
      },
      {
        q: "Will it try to diagnose the problem?",
        a: "No. It collects what's happening and hands it to you. Anything that sounds like remote diagnosis is exactly the failure mode the escalation rules exist to prevent.",
      },
      {
        q: "Can it book the job?",
        a: "It gets the job qualified and can move toward a booking, but a booking is confirmed by a human. Your schedule is real and the agent doesn't have it.",
      },
    ],
  },
  {
    slug: "electricians",
    name: "Electricians",
    noun: "electrical contractor",
    products: ["lead", "support"],
    intent: "AI lead response for electricians and electrical contractors",
    todayReality:
      "Electrical inbound skews toward projects with a decision behind them — a panel upgrade, an EV charger, a generator, a remodel's rough-in. These are researched purchases where the homeowner is comparing, and the comparison starts with who replied and whether the reply sounded like it understood the job.",
    whoAnswersNow:
      "The owner or an estimator, usually after the day's work is done — which is the same time the homeowner has stopped thinking about it.",
    whatComesIn:
      "Panel and service-upgrade quotes, EV charger installs, generator inquiries, GC coordination on remodels, and the occasional genuine safety call.",
    stakes:
      "A panel upgrade is a real ticket and the homeowner is getting three numbers. Being first to engage isn't about being cheapest — it buys the conversation where you get to scope the job before anyone else frames it.",
    fitNotes:
      "Works well when your criteria separate residential service, project work, and GC-driven jobs, since those want different questions asked up front.",
    limits:
      "It gives no electrical guidance of any kind. Anything mentioning burning, sparking, or shock escalates to a person immediately and is never handled by an automated reply.",
    faqs: [
      {
        q: "Can it quote an EV charger install?",
        a: "No. That price depends on the panel, the run, and the permit, and a wrong number in writing is worse than no number. It gathers those details so your quote is right the first time.",
      },
      {
        q: "What about a genuine safety issue at 11pm?",
        a: "It doesn't attempt to advise. It escalates to you immediately and tells the person plainly that they're being connected to someone — with the standard advice to call emergency services if there's active danger.",
      },
      {
        q: "Do we have to change how we work?",
        a: "No. It sits on your existing inbound — form, email, chat — and drafts replies. Nothing about your scheduling or field process changes.",
      },
    ],
  },
  {
    slug: "roofing-companies",
    name: "Roofing Companies",
    noun: "roofing company",
    products: ["lead", "support"],
    intent: "AI lead response for roofing companies and contractors",
    todayReality:
      "Roofing inbound is event-driven and brutally time-boxed. A storm passes and a neighborhood generates weeks of demand in about 72 hours, while out-of-town crews are already knocking doors on the same streets. Whoever engages inside that window gets the inspection.",
    whoAnswersNow:
      "Sales reps who are out on inspections during exactly the hours the leads come in, and an office that's already buried.",
    whatComesIn:
      "Storm and leak calls, insurance-claim questions, full-replacement quote requests, and inspection scheduling.",
    stakes:
      "The storm window closes. A lead answered a week later is a lead that already signed with someone who knocked. This is a vertical where slow response doesn't reduce close rate, it eliminates the opportunity.",
    fitNotes:
      "Strong fit because volume is spiky and the reps who'd normally reply are the ones physically on roofs. Capacity that doesn't compete with fieldwork is the whole point here.",
    limits:
      "It will not assess damage, comment on whether something is covered, or discuss an insurance claim's merits. Claims talk is a person's job and a legal exposure.",
    faqs: [
      {
        q: "Can it answer insurance questions?",
        a: "No, and that's deliberate. Coverage opinions from an automated system are a liability with no upside. It collects the claim details and routes them to whoever handles claims for you.",
      },
      {
        q: "Does it help during a storm surge?",
        a: "That's the case it's built for — a hundred leads in a day get handled identically, while your reps stay on roofs instead of triaging an inbox at night.",
      },
      {
        q: "Will it schedule an inspection?",
        a: "It qualifies and moves toward one, but a human confirms. Your crews' real availability isn't something the agent can see.",
      },
    ],
  },
  {
    slug: "remodeling-contractors",
    name: "Remodeling Contractors",
    noun: "remodeling company",
    products: ["lead", "support"],
    intent: "AI lead response for remodeling and general contractors",
    todayReality:
      "Remodeling has the longest and most fragile front end in the trades. A kitchen or addition inquiry is the start of a months-long relationship worth a great deal, and the homeowner is nervous, comparison-shopping, and reading responsiveness as a proxy for whether you'll disappear mid-project.",
    whoAnswersNow:
      "The owner, almost always, in the evening — the same person running current jobs, ordering materials, and managing subs.",
    whatComesIn:
      "Kitchen, bath, and addition inquiries, budget-range questions, timeline questions, and referral introductions from past clients or designers.",
    stakes:
      "Homeowners openly say they picked the contractor who communicated best. On a project this size, a slow first reply isn't just a lost lead — it confirms the exact fear that makes people hesitant to hire a remodeler at all.",
    fitNotes:
      "Especially useful for filtering budget fit early. A criteria set that names your realistic project floor spares everyone the tour that was never going to happen.",
    limits:
      "It doesn't estimate, commit to a start date, or discuss allowances. Its job is to establish fit and get a real conversation booked.",
    faqs: [
      {
        q: "Can it screen out projects below our minimum?",
        a: "Yes, and doing it early is kind to both sides. You write the criteria; it asks the budget question in your voice rather than after you've driven across town.",
      },
      {
        q: "Won't automation feel wrong for a relationship-heavy sale?",
        a: "It's a fair concern. The framing that holds up: it makes sure the first reply happens at all and happens fast, then hands you a qualified conversation. It isn't trying to sell the remodel — that was always going to be you.",
      },
      {
        q: "Can it give a ballpark price?",
        a: "No. A ballpark on a remodel becomes the number you're negotiating against for the rest of the project, and it can't see the house.",
      },
    ],
  },
  {
    slug: "landscaping-companies",
    name: "Landscaping Companies",
    noun: "landscaping company",
    products: ["lead", "support"],
    intent: "AI lead response for landscaping and lawn care companies",
    todayReality:
      "Landscaping is seasonal in a way that makes the office the bottleneck exactly once a year. Spring produces a wall of maintenance signups and design inquiries in a few weeks, and the crews — including whoever normally answers — are all in the field because the season just started.",
    whoAnswersNow:
      "The owner from a truck, or a single office person handling scheduling, billing, and new inquiries at the same time.",
    whatComesIn:
      "Recurring maintenance signups, one-off cleanups, design and install projects, irrigation and lighting questions, and renewal questions from last year's customers.",
    stakes:
      "Recurring maintenance is an annuity — losing one to a slow reply costs a season, not a job. And the spring window is short: a homeowner who doesn't hear back signs with whoever answers, then stays with them for years.",
    fitNotes:
      "The recurring-revenue math makes the response-speed argument unusually strong here, since each lost signup compounds across the whole season.",
    limits:
      "It doesn't price by the yard or promise a start week during the spring backlog, when the honest answer changes daily.",
    faqs: [
      {
        q: "Can it handle the spring rush?",
        a: "That's the specific problem it solves here — the rush is a volume spike against fixed office capacity, and software capacity doesn't have a busy season.",
      },
      {
        q: "Can it sign someone up for weekly maintenance?",
        a: "It qualifies and moves it forward, but a person confirms. Route density is real and only you know whether that address fits a crew's day.",
      },
      {
        q: "What about design projects versus mowing?",
        a: "Those get different criteria and different questions, so a design inquiry isn't handled like a maintenance signup.",
      },
    ],
  },
  {
    slug: "pest-control-companies",
    name: "Pest Control Companies",
    noun: "pest control company",
    products: ["lead", "support"],
    intent: "AI lead response for pest control companies",
    todayReality:
      "Pest inbound carries urgency that is emotional as much as practical. Someone who just found bed bugs or saw a rodent is not comparison shopping in a calm way — they want it handled today, and they are calling in sequence until a human responds.",
    whoAnswersNow:
      "A small office team during business hours; after hours, voicemail — which for this particular customer is when the problem feels worst.",
    whatComesIn:
      "Emergency infestations, recurring service plan signups, real-estate closing inspections with a deadline, and commercial accounts with compliance requirements.",
    stakes:
      "This customer converts on the first real response and doesn't wait. Evening and weekend inbound is disproportionately valuable and disproportionately unanswered.",
    fitNotes:
      "Good fit for the after-hours support agent specifically — a large share of the emotionally urgent inbound arrives outside business hours by nature.",
    limits:
      "It gives no treatment or safety guidance, and never comments on chemicals, pets, or children in the home. Those are licensed judgments.",
    faqs: [
      {
        q: "Will it tell someone how to handle it themselves?",
        a: "No. It collects what they're seeing and gets a person involved. Treatment advice from an automated system is both a licensing problem and a safety one.",
      },
      {
        q: "Can it book a same-day visit?",
        a: "It qualifies for urgency against your criteria and escalates, but scheduling is confirmed by someone who can see the route.",
      },
      {
        q: "Does it work for commercial accounts?",
        a: "Yes — commercial inquiries usually carry compliance context, so they're worth their own criteria rather than being treated as residential.",
      },
    ],
  },
  {
    slug: "moving-companies",
    name: "Moving Companies",
    noun: "moving company",
    products: ["lead", "support"],
    intent: "AI lead response for moving companies",
    todayReality:
      "Movers get shopped harder than almost any trade. A single customer fills out four or five quote forms in one sitting, often through a lead aggregator, and every mover receives the same lead at the same second. Response order effectively decides who gets considered.",
    whoAnswersNow:
      "A sales or dispatch person during business hours — while the customer, who is moving, is doing their research at night and on weekends.",
    whatComesIn:
      "Local and long-distance quote requests, date-availability questions, packing and storage add-ons, and last-minute moves with a hard deadline.",
    stakes:
      "When everyone receives the lead simultaneously, being third to respond is close to being invisible. This is the vertical where response latency most directly determines whether you're in the running at all.",
    fitNotes:
      "Aggregator leads make this unusually measurable — same lead, same moment, multiple recipients, and the differentiator is who engages first.",
    limits:
      "It doesn't quote a move. That needs an inventory and a date, and a wrong number quoted early is a dispute on moving day.",
    faqs: [
      {
        q: "Can it give a moving estimate?",
        a: "No. Estimates depend on inventory, access, and distance, and an early wrong number turns into a fight at the truck. It gathers what a real estimate needs.",
      },
      {
        q: "Does it help with aggregator leads?",
        a: "That's the clearest case — everyone gets the lead at once, and responding first is the entire advantage available to you.",
      },
      {
        q: "Can it confirm a date is available?",
        a: "No, because it can't see the truck and crew calendar. It captures the date and flags it so a person can confirm quickly.",
      },
    ],
  },
  {
    slug: "auto-repair-shops",
    name: "Auto Repair Shops",
    noun: "auto repair shop",
    products: ["support"],
    intent: "24/7 AI chat and after-hours answering for auto repair shops",
    todayReality:
      "A repair shop's phone is busy all day with customers already in progress — status checks, approvals, pickup timing — while new inquiries and appointment requests queue behind them. After close, the website goes silent, which is exactly when someone whose car is making a noise sits down to figure out what to do tomorrow.",
    whoAnswersNow:
      "A service advisor juggling the counter, the phone, and the techs. After hours, nobody.",
    whatComesIn:
      "Appointment requests, hours and location questions, 'is my car ready' status checks, and questions about whether the shop works on a particular make.",
    stakes:
      "Most of this is not sales, it's deflection — the same handful of questions consuming an advisor's day. Answering them automatically buys back the advisor's attention for the customers physically standing at the counter.",
    fitNotes:
      "The support agent is the better fit here than lead response. The volume problem is repetitive questions, not a slow sales follow-up.",
    limits:
      "It does not diagnose a noise, estimate a repair, or say when a car will be done. Those need a tech, and a guess creates a promise you have to break.",
    faqs: [
      {
        q: "Can it tell someone what's wrong with their car?",
        a: "No, and it's instructed not to guess. It captures the symptom and gets them scheduled, which is the actual next step anyway.",
      },
      {
        q: "Can it say whether a car is ready?",
        a: "Not unless that fact is something you've given it. It doesn't have live shop status, so it escalates rather than inventing an answer.",
      },
      {
        q: "What does it actually answer, then?",
        a: "Hours, location, makes you service, what to bring, how appointments work — whatever you type into its knowledge page. Those questions are most of the volume.",
      },
    ],
  },
  {
    slug: "dental-practices",
    name: "Dental Practices",
    noun: "dental practice",
    products: ["support"],
    intent: "24/7 AI chat and after-hours answering for dental practices",
    todayReality:
      "Dental front desks are saturated during business hours — checking in patients, handling insurance, and answering a phone that rings through appointments. Meanwhile a large share of new-patient research and after-hours pain questions arrive to a closed office and a website that can't respond.",
    whoAnswersNow:
      "A front-desk team already at capacity, and after hours an answering service or voicemail.",
    whatComesIn:
      "New-patient inquiries, insurance-acceptance questions, hours and location, appointment requests and reschedules, and after-hours discomfort questions.",
    stakes:
      "The single most common question — 'do you take my insurance?' — is pure administrative load with a clear answer, and it currently costs a person's attention every time. Meanwhile new-patient inquiries sitting unanswered overnight go to whichever practice replies first.",
    fitNotes:
      "Fits the support agent well because the highest-volume questions are factual and stable. It answers only from facts you write, so insurance and hours answers are yours, not guessed.",
    limits:
      "It gives no clinical guidance, ever — no advice about pain, medication, symptoms, or whether something can wait. Anything clinical escalates to a person, and urgent pain is told plainly to contact the practice or seek care.",
    faqs: [
      {
        q: "Will it give dental advice?",
        a: "No, categorically. It's built to answer administrative questions from facts you provide and to escalate anything clinical rather than attempt it. That boundary is the design, not a setting.",
      },
      {
        q: "Can it confirm we take a specific insurance?",
        a: "Only if you've told it which plans you accept. It answers from your written facts and escalates what isn't covered there, so it can't invent a plan you don't take.",
      },
      {
        q: "What about someone in pain at midnight?",
        a: "It doesn't assess or advise. It responds immediately, tells them clearly how to reach a person and to seek urgent care if it's serious, and notifies you.",
      },
    ],
  },
  {
    slug: "law-firms",
    name: "Law Firms",
    noun: "law firm",
    products: ["lead", "support"],
    intent: "AI lead response and intake for law firms",
    todayReality:
      "Legal intake is unusually unforgiving. A prospective client with a live problem contacts several firms and retains early, often within days, and the firms that respond slowly never learn they were in the running. Meanwhile attorney hours are the scarcest resource in the building, so intake gets pushed to whoever is free.",
    whoAnswersNow:
      "A paralegal or intake coordinator during business hours; smaller firms, the attorney directly. After hours, an answering service taking messages.",
    whatComesIn:
      "New-matter inquiries, consultation requests, questions about practice areas and whether the firm handles a matter type, and referrals from other attorneys.",
    stakes:
      "Prospective clients in distress retain the firm that engages first and makes them feel handled. A next-day callback frequently arrives after a retainer is already signed elsewhere.",
    fitNotes:
      "Most valuable for conflict-free triage: confirming matter type, jurisdiction, and timing before attorney time is spent, so consultations are with people you can actually help.",
    limits:
      "It never gives legal advice, never comments on the merits of a matter, and never states a deadline or limitations period. It gathers intake facts and routes them.",
    faqs: [
      {
        q: "Could it accidentally give legal advice?",
        a: "It's explicitly instructed not to, and to escalate anything approaching a legal question rather than answer it. Intake facts in, no opinions out — and the drafts are reviewable so you can verify that on your own matters.",
      },
      {
        q: "Does this create an attorney-client relationship?",
        a: "That's a judgment for your firm and your jurisdiction, and you control the disclaimer language it uses. The agent is designed to collect intake information and route it, not to accept a representation.",
      },
      {
        q: "Can it screen out matters we don't take?",
        a: "Yes — practice area, jurisdiction, and matter type are exactly the criteria it applies, which keeps attorney time on matters you'd actually accept.",
      },
    ],
  },
  {
    slug: "accounting-firms",
    name: "Accounting Firms",
    noun: "accounting firm",
    products: ["lead", "support"],
    intent: "AI lead response for accounting and CPA firms",
    todayReality:
      "Accounting inbound is violently seasonal. The weeks before a filing deadline generate the year's new-client inquiries at exactly the moment every person in the firm is billing at capacity and has the least attention available for a stranger's email.",
    whoAnswersNow:
      "An admin or a partner between client work — during busy season, effectively nobody.",
    whatComesIn:
      "New-client inquiries, questions about services and whether the firm handles a return type, deadline and extension questions, and bookkeeping or advisory inquiries.",
    stakes:
      "Busy-season inquiries are the highest-intent leads of the year and land when capacity is lowest. A prospect who doesn't hear back before the deadline files with someone else and is gone for a full year.",
    fitNotes:
      "The seasonality argument is the strongest one here — the constraint is human attention during a fixed window, and this adds capacity that doesn't consume billable hours.",
    limits:
      "It gives no tax advice, no filing guidance, and no opinion on a specific situation. It establishes fit and books the conversation.",
    faqs: [
      {
        q: "Will it answer tax questions?",
        a: "No. It handles scope and fit — what you do, whether a situation is something you take on, how to start — and escalates anything substantive to a person.",
      },
      {
        q: "Does it help during busy season?",
        a: "That's the case it's for. Inquiry volume peaks exactly when the firm has the least capacity to respond, and this decouples the first response from anyone's billable hours.",
      },
      {
        q: "Can it screen for the clients we want?",
        a: "Yes — entity type, return complexity, industry, and revenue floor are all things you can put in your criteria.",
      },
    ],
  },
  {
    slug: "real-estate-agencies",
    name: "Real Estate Agencies",
    noun: "real estate brokerage",
    products: ["lead", "support"],
    intent: "AI lead response for real estate agents and brokerages",
    todayReality:
      "Real estate leads arrive continuously from portals, and their value decays in minutes rather than days. Agents are the people who'd respond, and agents are at showings — meaning the leads arrive precisely when the person who should answer physically cannot.",
    whoAnswersNow:
      "The agent, from a phone, between showings and closings — or nobody, until the evening.",
    whatComesIn:
      "Portal inquiries on specific listings, showing requests, buyer and seller inquiries, valuation requests, and rental inquiries.",
    stakes:
      "Portal leads are shopped simultaneously and go to whoever responds first — often literally. This is the vertical where the industry itself already agrees speed-to-lead is the whole game, which makes it an easy argument and a hard standard.",
    fitNotes:
      "Works best when buyer, seller, and rental inquiries get separate criteria, since those want completely different first questions.",
    limits:
      "It does not give a valuation, comment on price, or confirm a showing time. It qualifies and gets the agent into a live conversation.",
    faqs: [
      {
        q: "Can it tell someone what their home is worth?",
        a: "No. A number given casually anchors the whole listing conversation before you've seen the property. It captures the address and intent and routes it to you.",
      },
      {
        q: "Can it schedule a showing?",
        a: "It moves toward one, but a person confirms — access and agent calendars are real constraints the agent can't see.",
      },
      {
        q: "Does it work with portal leads?",
        a: "Yes, and that's where the speed advantage is largest, since those are delivered to several agents at the same moment.",
      },
    ],
  },
  {
    slug: "veterinary-clinics",
    name: "Veterinary Clinics",
    noun: "veterinary clinic",
    products: ["support"],
    intent: "24/7 AI chat and after-hours answering for veterinary clinics",
    todayReality:
      "Vet front desks handle a phone that does not stop, and a meaningful share of it is the same administrative questions — hours, whether the clinic takes new patients, what a visit costs, whether a species is seen. After close, worried owners hit a website that can't answer anything.",
    whoAnswersNow:
      "Front-desk staff already stretched across check-ins, calls, and pharmacy; after hours, an emergency-referral voicemail message.",
    whatComesIn:
      "Appointment requests, new-patient questions, hours and services, prescription refill requests, and after-hours worry about a pet's symptoms.",
    stakes:
      "The administrative volume is the real cost — it consumes a front desk that should be handling the people and animals in the building. New-client inquiries going unanswered overnight is the secondary loss.",
    fitNotes:
      "Support agent only. The value is deflecting the repetitive factual questions, not selling anything.",
    limits:
      "It gives no medical guidance about an animal under any circumstances — no symptom assessment, no advice on whether to wait. Anything about a pet's condition escalates immediately and points to emergency care.",
    faqs: [
      {
        q: "Will it advise on symptoms?",
        a: "No, never. Any message about how an animal is doing is escalated to a person and pointed toward emergency care if it sounds urgent. It's not equipped to triage and isn't asked to.",
      },
      {
        q: "Can it handle refill requests?",
        a: "It can capture the request and route it. Approval is always a person's — it doesn't touch prescribing.",
      },
      {
        q: "What does it help with, concretely?",
        a: "Hours, location, species and services you see, whether you're taking new patients, what to bring, how appointments work — the questions that currently interrupt your front desk all day.",
      },
    ],
  },
  {
    slug: "gyms-and-fitness-studios",
    name: "Gyms & Fitness Studios",
    noun: "gym or fitness studio",
    products: ["lead", "support"],
    intent: "AI lead response and 24/7 chat for gyms and fitness studios",
    todayReality:
      "Membership interest arrives on a schedule that has nothing to do with staffing. People decide to join at night, on Sunday, and in the first week of January — and the desk is staffed for class times, so the inquiry sits until someone opens the inbox.",
    whoAnswersNow:
      "Front-desk staff during class hours, or an owner checking messages between sessions.",
    whatComesIn:
      "Membership and pricing inquiries, trial and intro-offer signups, class schedule questions, personal training inquiries, and cancellation or hold requests.",
    stakes:
      "The decision to join a gym is impulsive and perishable — it happens at 10pm and it fades. A reply on Monday reaches a person whose motivation has already passed, which is why intro offers convert so much better when answered immediately.",
    fitNotes:
      "Both products fit: lead response for membership and PT inquiries, support agent for the schedule and policy questions that dominate volume.",
    limits:
      "It doesn't give training or nutrition advice, and it doesn't process a cancellation. Billing changes are a person's decision.",
    faqs: [
      {
        q: "Can it sign someone up?",
        a: "It qualifies and moves the conversation to the point of signup, but a person confirms membership. Contracts and billing shouldn't be automated away.",
      },
      {
        q: "Can it answer schedule questions?",
        a: "Yes, from facts you write — classes, times, and policies. Those are the highest-volume questions and they're stable.",
      },
      {
        q: "Will it give workout advice?",
        a: "No. That's your trainers' job and there's real injury risk in an automated answer.",
      },
    ],
  },
];

/** ONE page per vertical, on its primary product — not one per (vertical,
 *  product) pair.
 *
 *  The pair version was written first and the duplicate-content check in
 *  scripts/check-seo.mjs rejected it: the lead-response and support-agent
 *  pages for the same trade shared 93% of their vocabulary, because the
 *  genuinely vertical-specific research (what arrives, who answers, what's
 *  at stake) is a property of the TRADE, not of which product you sell it.
 *  Two pages meant saying the same thing twice with the product name
 *  swapped, which is the textbook doorway pattern Google demotes and can
 *  penalise.
 *
 *  So `products[0]` is the primary — the product that genuinely fits that
 *  business best — and the secondary, if any, is cross-sold inside the
 *  page rather than given a near-identical page of its own. Splitting a
 *  vertical into two pages later means writing two genuinely different
 *  research bodies for it, and the check will hold that line. */
export function pagePairs() {
  return VERTICALS.map((v) => ({ vertical: v, product: PRODUCTS[v.products[0]] }));
}

/** The secondary product for a vertical, mentioned in-page. */
export function secondaryProduct(v) {
  return v.products[1] ? PRODUCTS[v.products[1]] : null;
}

// Comparison pages: "Fieldsta vs X" content, targeting people already
// comparison-shopping rather than cold research traffic.
//
// Deliberately compares against APPROACHES (doing nothing, hiring someone,
// a generic chatbot), never against a named competitor product. The site's
// standing rule is no invented statistics or claims — and a claim about a
// SPECIFIC competitor's actual features or pricing is a claim about facts
// we haven't verified and don't control the accuracy of. Comparing against
// an approach sidesteps that entirely: "what a dedicated hire costs and
// does" is something we can describe honestly without asserting anything
// about a company we don't work for.
//
// Same hard rules as verticals.mjs: no invented statistics, no customer
// counts, no guarantees. `whereItWins` exists specifically so this doesn't
// read as a hit piece — the honest comparison names what the alternative
// is actually good at, which is also what makes the case for Fieldsta
// credible instead of a strawman.

export const COMPARISONS = [
  {
    slug: "doing-nothing",
    name: "no formal system",
    forProduct: "lead",
    intent: "Fieldsta vs no formal lead-response system",
    whatItIs:
      "The default state at most small and mid-size businesses: a contact form that emails someone, or a shared inbox that everyone can see and no one specifically owns. There's no rule about who replies or how fast — it happens when someone has a free minute.",
    whereItWins:
      "It costs nothing to set up, because it's usually already there. No new tool, no new process, nothing to learn. For a business getting one or two leads a week, the gap this leaves may genuinely never matter.",
    whereItFalls:
      "The moment volume goes up or the team gets busy, replies start slipping — not from anyone being careless, just because nothing is actually watching the inbox at 9pm on a Tuesday. A shared inbox has the specific failure mode of everyone assuming someone else already answered it.",
    fieldstaFit:
      "Fieldsta replaces \"whoever's free\" with a rule: every inbound lead gets a first response inside a minute, qualified against criteria you set, with a human reviewing before anything commits to a booking. It doesn't require reorganizing how the team works — it sits in front of the same inbox and answers before anyone has to.",
    limits:
      "It will not invent a policy you haven't set, promise something outside what you've configured, or replace the judgment call on a lead that's genuinely ambiguous — those still come to a person.",
    faqs: [
      {
        q: "We're small — do we even have enough volume for this to matter?",
        a: "If leads currently sit for hours because whoever handles them is busy with something else, the gap exists regardless of volume. It matters most exactly when you're too busy to notice it.",
      },
      {
        q: "What if we just want to speed up our current process, not replace it?",
        a: "That's what most accounts do — Fieldsta answers first and drafts the reply; you still review and approve unless you turn on auto-send for the routine cases.",
      },
    ],
  },
  {
    slug: "hiring-an-sdr",
    name: "hiring a dedicated SDR",
    forProduct: "lead",
    intent: "Fieldsta vs hiring a dedicated SDR or inside sales rep",
    whatItIs:
      "Bringing on a person whose job is specifically to answer and qualify inbound leads — sourced, interviewed, trained on your product and your qualifying bar, then managed like anyone else on the team.",
    whereItWins:
      "A good SDR reads tone, handles genuinely ambiguous situations, and builds real rapport in a way nothing automated does. For complex, high-value inbound where every lead deserves a real conversation, a person is often the right call outright.",
    whereItFalls:
      "One person has one inbox and one set of working hours — a lead that arrives at 11pm waits until morning regardless of how good they are. Hiring, training and ramping takes real time, and turnover means doing it again.",
    fieldstaFit:
      "Fieldsta covers the hours a hire structurally can't — nights, weekends, the gap between someone leaving and the next hire starting — using the same qualifying criteria you'd train a person on. It isn't a replacement for judgment on a complicated lead; it's coverage for the ones that are actually routine, which is most of them, so the hours a person does work go further.",
    limits:
      "It will not build a relationship the way a person building rapport over a call does, and it defers anything genuinely ambiguous rather than guessing at what a skilled rep would say.",
    faqs: [
      {
        q: "Can we use both?",
        a: "That's the common setup — Fieldsta covers first response and qualification around the clock, and a person takes it from the qualified handoff, or reviews every draft before it sends if you'd rather keep full control.",
      },
      {
        q: "Does it replace the need to eventually hire?",
        a: "For a team that's genuinely outgrowing its lead volume, no — it buys time and covers the hours nobody's staffed for, not a permanent substitute for headcount once volume justifies it.",
      },
    ],
  },
  {
    slug: "a-generic-chatbot",
    name: "a rule-based website chatbot",
    forProduct: "lead",
    intent: "Fieldsta vs a rule-based lead-capture chatbot",
    whatItIs:
      "A scripted widget that walks a visitor through a fixed set of buttons or questions — \"What are you looking for?\" / \"When works for a call?\" — and hands the collected answers to a person, without actually reading or responding to what the person typed.",
    whereItWins:
      "It's cheap, fast to install, and predictable — a scripted flow never says something you didn't write. For a business that just needs to collect a name, number and one qualifying question, that's often genuinely enough.",
    whereItFalls:
      "The moment a real inbound lead writes an actual sentence — a real question, a specific situation, something that doesn't fit the buttons — a script has nothing to say back. It collects data; it doesn't answer.",
    fieldstaFit:
      "Fieldsta reads what the lead actually wrote and answers it, qualifies against your real criteria (not a fixed button flow), and drafts the reply a person would have sent — reviewed before it goes, or auto-sent for the routine cases if you turn that on.",
    limits:
      "It will not invent pricing or commitments outside what you've told it, and anything it isn't confident about goes to a person instead of guessing.",
    faqs: [
      {
        q: "We already have a chat widget — do we need this too?",
        a: "If the widget only collects contact info and hands it off, Fieldsta is answering a different question — actually replying to what a lead sent, not just capturing that they showed up.",
      },
      {
        q: "Is this a chat widget?",
        a: "No — Fieldsta answers inbound leads that arrive by form, email or webhook, not a live chat window on your site. That's a separate product (Fieldsta's AI support agent).",
      },
    ],
  },
  {
    slug: "doing-nothing",
    name: "no after-hours coverage",
    forProduct: "support",
    intent: "Fieldsta's support agent vs no after-hours coverage",
    whatItIs:
      "The default for most small businesses outside business hours: voicemail, an unanswered contact form, or nothing at all. Whoever visits the site at 9pm gets silence until the next business day.",
    whereItWins:
      "It costs nothing and there's nothing to set up or maintain. For a business whose customers only ever reach out during business hours anyway, the gap may not be a real one.",
    whereItFalls:
      "Evenings and weekends are exactly when people research who to call — the visitor who lands on your site at 9pm with a real question gets silence, and silence reads as \"nobody's going to get back to me\" whether or not that's true.",
    fieldstaFit:
      "A small chat bubble on your site answers customer questions 24/7 from facts you approve — hours, services, service area, whatever you write into it. Anything it shouldn't answer (pricing specifics, complaints) gets handed to a person instead of guessed at.",
    limits:
      "It only knows what you've told it — it will not invent answers about your business, and it escalates anything outside what you've configured rather than guessing.",
    faqs: [
      {
        q: "What if we don't have anyone to hand off to at night anyway?",
        a: "It still answers the routine questions immediately (hours, services, whether you cover their area) and records anything that needs a person for the next business day, instead of the visitor getting nothing at all.",
      },
      {
        q: "Do we have to write a full knowledge base first?",
        a: "No — it works from whatever you've written, however short, and it says so honestly when it doesn't know something rather than filling the gap with a guess.",
      },
    ],
  },
  {
    slug: "hiring-after-hours-staff",
    name: "hiring or scheduling after-hours staff",
    forProduct: "support",
    intent: "Fieldsta's support agent vs hiring or scheduling after-hours staff",
    whatItIs:
      "Paying someone — an answering service, a part-time hire, rotating on-call staff — specifically to be reachable outside normal business hours.",
    whereItWins:
      "A real person can genuinely help with anything, including situations nobody thought to write down. For a business where after-hours contact is frequent and often complex, staffing it properly is often the right call.",
    whereItFalls:
      "Staffing evenings and weekends is expensive relative to the actual volume most small businesses see after hours, and someone still has to be paid to sit and wait through the quiet stretches for the occasional real question.",
    fieldstaFit:
      "The chat agent handles the routine version of that coverage — the questions that come up repeatedly and have a knowable answer — for a fraction of what staffing the hours costs, and hands off anything real to a person instead of trying to be one.",
    limits:
      "It does not replace a person for anything genuinely complicated or sensitive; it's coverage for the routine questions that would otherwise just go unanswered until morning.",
    faqs: [
      {
        q: "Could we use both — staff during peak hours, the agent otherwise?",
        a: "Yes — that's a common setup: a person covers the hours where after-hours contact is frequent enough to justify it, and the agent covers the rest.",
      },
      {
        q: "What happens to something the agent can't answer?",
        a: "It says so honestly, records what was asked, and hands off to a person the next time someone's available — never guesses to avoid saying \"I don't know.\"",
      },
    ],
  },
  {
    slug: "a-generic-chatbot",
    name: "a rule-based FAQ chatbot",
    forProduct: "support",
    intent: "Fieldsta's support agent vs a rule-based FAQ chatbot",
    whatItIs:
      "A scripted widget offering a fixed menu of pre-written questions and canned answers — helpful if the visitor's question happens to be one of the ones on the list, silent or unhelpful otherwise.",
    whereItWins:
      "It's predictable and cheap — a fixed script never says something unapproved, and for a small, stable set of common questions it can genuinely cover most of what comes in.",
    whereItFalls:
      "Real questions rarely arrive phrased exactly like the menu options. A visitor asking something slightly different from the scripted list gets a dead end — \"sorry, I didn't understand that\" — which reads as unhelpful specifically at the moment they needed help.",
    fieldstaFit:
      "It reads what the visitor actually typed and answers from the facts you've written, in plain language, rather than requiring them to find the right button. Anything genuinely outside what it knows gets handed to a person, honestly, instead of a dead-end message.",
    limits:
      "It answers only from what you've written and approved — it will not invent hours, pricing or policy you haven't given it, and it escalates rather than guessing on anything sensitive.",
    faqs: [
      {
        q: "Is this harder to set up than a scripted chatbot?",
        a: "No — you write the same facts (hours, services, FAQs) you'd have written for a scripted menu; the difference is it can answer a version of the question you didn't anticipate, not that setup takes longer.",
      },
      {
        q: "Can it sound like a script if I want it to be brief?",
        a: "Replies are short by default — two to four sentences, chat-length, not an essay — configurable in voice but not in honesty: it won't claim something it isn't sure of just to sound more confident.",
      },
    ],
  },
];

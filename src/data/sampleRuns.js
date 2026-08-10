// Real results from the live Responder agent, captured 2026-08-10 by posting
// the samples in LiveDemo's VERTICALS to the same POST /api/demo-qualify the
// page calls at runtime. Not written by hand and not touched up -- these are
// verbatim responses, which is the only reason it's honest to show them as
// what the product does.
//
// They exist because the demo used to hide its entire payoff behind a 20-40
// second wait, so a visitor had to spend the time before seeing whether it
// was worth spending. Rendering a captured run on load means the product is
// visible in zero seconds and the live run becomes "now do it on your lead"
// rather than the only way to see anything.
//
// Also cheap in a way an auto-run wouldn't be: /api/demo-qualify allows 3
// runs per IP per hour and 100 globally per hour (fieldsta-agents
// src/demo-limiter.ts), so firing a real run on every pageview would burn
// that budget on bot traffic and lock out real visitors.
//
// legal is deliberately absent -- capturing it hit the per-IP rate limit and
// it must be a real captured run like the others, never a hand-written
// stand-in. hasSampleRun() is what the UI checks.

export const SAMPLE_RUNS = {
  "saas": {
    "qualification": "needs_more_info",
    "score": {
      "score": 88,
      "tier": "good",
      "tierLabel": "Good lead — confirm the rest"
    },
    "reasoning": "Sam clearly generates real inbound volume (400/mo) and describes an actual gap (hours-long delays, inconsistent follow-up), but it's unclear whether Sam's agency or the individual contractor clients own the actual response — that matters because it changes whether this is one account or a multi-client setup, and Sam asked for pricing which we can't give without knowing that.",
    "criteriaBreakdown": [
      {
        "criterion": "They actually receive inbound leads today (form, phone, chat, or referral)",
        "met": "yes",
        "evidence": "\"We run paid ads for about a dozen contractor clients and generate maybe 400 leads a month between them.\""
      },
      {
        "criterion": "Someone on their side is responsible for responding to those leads",
        "met": "unclear",
        "evidence": "\"leads sit for hours before anyone calls\" — doesn't say whether Sam's agency team makes those calls, or each contractor client handles their own follow-up once the lead is handed off."
      },
      {
        "criterion": "There is a real gap — leads wait, go unanswered, or get handled inconsistently",
        "met": "yes",
        "evidence": "\"Honestly our follow-up is inconsistent — leads sit for hours before anyone calls.\""
      },
      {
        "criterion": "They can name roughly how many inbound leads they get in a month",
        "met": "yes",
        "evidence": "\"maybe 400 leads a month between them\""
      }
    ],
    "missingInfo": [
      "Who is actually responsible for calling/responding to these leads today — Sam's agency team, or each contractor client individually"
    ],
    "needsHumanReview": true,
    "reviewReason": "Agency-with-multiple-end-clients structure is atypical for this product's usual single-business setup — a human should confirm how (or whether) we'd price/structure a multi-client reseller-style deal before this goes further, and pricing was explicitly asked for.",
    "subject": "Re: your question about cost",
    "draftReply": "Hey Sam,\n\n400 leads a month across a dozen contractor clients, with follow-up sitting for hours before anyone calls — that's exactly the kind of gap this is built for. Leads go cold fast when nobody's on them right away.\n\nBefore I can give you real numbers, I need to understand one thing: when a lead comes in, who's actually calling it — your team centrally, or each contractor client on their own end? That changes how this gets set up (one system running across all your clients vs. something separate per client), and it's what cost actually depends on.\n\nOnce I know how follow-up is structured today, happy to get on a quick call and walk through specifics, including cost.\n\nHarper"
  },
  "home-services": {
    "qualification": "needs_more_info",
    "score": {
      "score": 88,
      "tier": "good",
      "tierLabel": "Good lead — confirm the rest"
    },
    "reasoning": "Sam clearly has storm/hail damage and wants a roofer to come look before their Friday adjuster appointment — strong intent and a real visit request. The one thing we can't confirm from the message is where the property actually is, so service area is unconfirmed.",
    "criteriaBreakdown": [
      {
        "criterion": "The property is within roughly 45 miles of Raleigh–Durham",
        "met": "unclear",
        "evidence": "No address, city, or zip mentioned anywhere in the message."
      },
      {
        "criterion": "They need roofing work specifically — repair, replacement, or storm/leak damage",
        "met": "yes",
        "evidence": "\"We had that big hailstorm come through last week and I'm seeing dented gutters and shingles in the yard\" — clear storm/hail damage."
      },
      {
        "criterion": "They own the property or can authorize the work",
        "met": "yes",
        "evidence": "Describes the damage as their own property (\"the yard\") and says their own insurance adjuster is coming Friday, indicating they're the policyholder/homeowner."
      },
      {
        "criterion": "They want an actual estimate or visit, not just general information",
        "met": "yes",
        "evidence": "\"Can someone come take a look this week?\" — explicitly requesting an on-site visit."
      }
    ],
    "missingInfo": [
      "Property address or city/zip to confirm it's within the Raleigh–Durham service area"
    ],
    "needsHumanReview": true,
    "reviewReason": "Sam wants an inspection before Friday's adjuster visit, which is time-sensitive — a human should confirm scheduling availability quickly once the address comes back. Also worth a quick sanity check on the lead itself: email domain is example.com and source is listed as 'Interactive demo,' so confirm this is a genuine inbound lead before treating it as one.",
    "subject": "Re: hail damage, adjuster coming Friday",
    "draftReply": "Hi Sam,\n\nSorry to hear about the hail — dented gutters and shingles coming down in the yard is a good sign there's real damage up there, so it's smart to get a roofer's eyes on it before the adjuster comes Friday.\n\nCan you send me the address (or just city/zip) for the property? Once I know where you're located I can get you on the schedule for a look this week, ideally before Friday so you've got someone in your corner when the adjuster is out there.\n\nTalk soon,\nHarper"
  }
};

export function getSampleRun(vertical) {
  return SAMPLE_RUNS[vertical] ?? null;
}

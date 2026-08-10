// Verbatim responses from the live Responder agent, captured by
// scripts/capture-sample-runs.mjs posting the samples in LiveDemo's VERTICALS
// to the same POST /api/demo-qualify the page calls at runtime. Not written
// by hand and not touched up -- that is the only reason it is honest to show
// them as what the product does.
//
// They exist so /try can show its payoff on load instead of behind a 20-40
// second wait, and so the fixed-input actions (the example run and the
// rejection demo) cost nothing: /api/demo-qualify allows only 3 runs per IP
// per hour, and spending them to reproduce a result already on the page left
// nothing for the visitor's own lead.
//
// Regenerate whenever VERTICALS changes -- stale captures would be answering
// leads the page no longer shows.

export const SAMPLE_RUNS = {
  "saas": {
    "sample": {
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
    "weak": {
      "qualification": "not_a_fit",
      "score": {
        "score": 0,
        "tier": "low",
        "tierLabel": "Needs more info"
      },
      "reasoning": "Sam explicitly identifies as a student writing a coursework paper and says they're not looking to buy — there's no business, no inbound lead flow, and no gap to solve, so none of the qualifying criteria apply.",
      "criteriaBreakdown": [
        {
          "criterion": "They actually receive inbound leads today (form, phone, chat, or referral)",
          "met": "no",
          "evidence": "Sam is a second-year student writing a paper on AI in sales, not a business receiving leads."
        },
        {
          "criterion": "Someone on their side is responsible for responding to those leads",
          "met": "no",
          "evidence": "No business or lead-response role mentioned; this is academic research."
        },
        {
          "criterion": "There is a real gap — leads wait, go unanswered, or get handled inconsistently",
          "met": "no",
          "evidence": "No process or gap described; explicitly says 'not looking to buy anything.'"
        },
        {
          "criterion": "They can name roughly how many inbound leads they get in a month",
          "met": "no",
          "evidence": "No lead volume mentioned; not applicable to a student inquiry."
        }
      ],
      "missingInfo": [
        "Not applicable — lead is not a business inquiry"
      ],
      "needsHumanReview": false,
      "subject": "Re: your question about Demo — B2B Lead Response",
      "draftReply": "Hey Sam,\n\nThanks for reaching out, and good luck with the paper. We don't have a formal whitepaper or documentation packet to send over — we're a small operation focused on live client work, not published research.\n\nHappy to answer a couple of specific questions directly if that'd help your coursework, just reply here with what you're trying to figure out. Otherwise, our site has the plain-language rundown of what we do and how it works.\n\nBest,\nHarper"
    }
  },
  "home-services": {
    "sample": {
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
    },
    "weak": {
      "qualification": "not_a_fit",
      "score": {
        "score": 13,
        "tier": "low",
        "tierLabel": "Needs more info"
      },
      "reasoning": "This is a gift card inquiry, not a roofing service request — there's no roofing need, no property/authorization info, and no request for an estimate or visit. Summit Roofing doesn't sell gift cards, so this isn't something we can act on as a lead.",
      "criteriaBreakdown": [
        {
          "criterion": "The property is within roughly 45 miles of Raleigh–Durham",
          "met": "unclear",
          "evidence": "No location given for Sam or the brother-in-law's house."
        },
        {
          "criterion": "They need roofing work specifically — repair, replacement, or storm/leak damage",
          "met": "no",
          "evidence": "Message asks about gift cards, not roofing work: \"do you guys sell gift cards?\""
        },
        {
          "criterion": "They own the property or can authorize the work",
          "met": "no",
          "evidence": "Sam is asking on behalf of a brother-in-law as a gift idea, not requesting work on his own property."
        },
        {
          "criterion": "They want an actual estimate or visit, not just general information",
          "met": "no",
          "evidence": "No request for an estimate or site visit — just asking about gift card availability."
        }
      ],
      "missingInfo": [
        "Whether there is any actual roofing need for the property",
        "Property location",
        "Who owns/can authorize work on the property"
      ],
      "needsHumanReview": false,
      "subject": "Re: gift cards",
      "draftReply": "Hey Sam,\n\nThanks for reaching out, and congrats to your brother-in-law on the new house! We don't offer gift cards, unfortunately — we're a roofing company, so we handle repairs, replacements, and storm damage work for homeowners in the Raleigh-Durham area.\n\nIf he ever runs into a leak, storm damage, or just wants his roof looked at, have him give us a shout and we'll take good care of him.\n\nTake care,\nHarper"
    }
  },
  "legal": {
    "sample": {
      "qualification": "needs_more_info",
      "score": {
        "score": 88,
        "tier": "good",
        "tierLabel": "Good lead — confirm the rest"
      },
      "reasoning": "Strong case indicators — recent accident, clear liability, documented medical treatment — but Sam doesn't say whether they already have an attorney, so that needs to be confirmed before booking.",
      "criteriaBreakdown": [
        {
          "criterion": "The injury or accident happened recently (ideally within the statute of limitations window)",
          "met": "yes",
          "evidence": "\"rear ended on the highway last Tuesday\" - accident occurred within the last week"
        },
        {
          "criterion": "There is a potentially liable third party (other driver, property owner, etc.)",
          "met": "yes",
          "evidence": "\"Other driver admitted fault to the officer\" and \"their insurance is already lowballing me\""
        },
        {
          "criterion": "The person sought or plans to seek medical treatment for the injury",
          "met": "yes",
          "evidence": "\"went to urgent care same day, still getting neck pain\""
        },
        {
          "criterion": "The person is not already represented by another attorney for this claim",
          "met": "unclear",
          "evidence": "Sam mentions dealing with the other driver's insurance directly but doesn't say whether they've already hired an attorney"
        }
      ],
      "missingInfo": [
        "Whether Sam is already represented by an attorney for this claim"
      ],
      "needsHumanReview": true,
      "reviewReason": "Lead is otherwise strong; confirm representation status wasn't addressed and check tone before sending given insurer is already lowballing them.",
      "subject": "Following up on your accident",
      "draftReply": "Hi Sam,\n\nThanks for reaching out, and I'm sorry you're dealing with this — a neck injury on top of an insurance company already trying to lowball you is a lot to handle. It's good that you got checked out at urgent care the same day and have the police report; that documentation matters.\n\nBased on what you've shared, this sounds like something we can help with. One thing I want to check first — are you currently working with another attorney on this claim, or is this the first time you've reached out to a firm about it?\n\nIf you're not already represented, I'd like to set up a free consultation. What's the best number to reach you at, and is there a time this week that works?\n\nHarper"
    },
    "weak": {
      "qualification": "not_a_fit",
      "score": {
        "score": 13,
        "tier": "low",
        "tierLabel": "Needs more info"
      },
      "reasoning": "Sam's message describes a landlord rent increase dispute, which is a landlord-tenant/housing matter, not a personal injury claim (no accident, no injury, no medical treatment). This falls outside what the firm handles.",
      "criteriaBreakdown": [
        {
          "criterion": "The injury or accident happened recently (ideally within the statute of limitations window)",
          "met": "no",
          "evidence": "No injury or accident mentioned — this is about a rent increase."
        },
        {
          "criterion": "There is a potentially liable third party (other driver, property owner, etc.)",
          "met": "no",
          "evidence": "Landlord is involved but there's no injury or accident, just a rent increase dispute."
        },
        {
          "criterion": "The person sought or plans to seek medical treatment for the injury",
          "met": "no",
          "evidence": "No injury mentioned, so no medical treatment referenced."
        },
        {
          "criterion": "The person is not already represented by another attorney for this claim",
          "met": "unclear",
          "evidence": "Not mentioned, but moot since this isn't a personal injury matter."
        }
      ],
      "missingInfo": [],
      "needsHumanReview": false,
      "subject": "Your message about your rent increase",
      "draftReply": "Hi Sam,\n\nThanks for reaching out. This looks like a landlord-tenant issue rather than a personal injury matter, which unfortunately isn't something our firm handles — we focus on injury claims from things like car accidents or slip-and-falls.\n\nFor a rent dispute, you'd want to reach out to a landlord-tenant attorney or your local tenant's rights organization, who'll be much better positioned to help.\n\nWishing you the best with it.\n\nHarper"
    }
  }
};

// Null means "not captured yet", and callers must degrade rather than
// substitute another vertical's run -- it would be presented under this
// vertical's lead and would not be that lead's answer.
export function getSampleRun(vertical) {
  return SAMPLE_RUNS[vertical]?.sample ?? null;
}

export function getWeakRun(vertical) {
  return SAMPLE_RUNS[vertical]?.weak ?? null;
}

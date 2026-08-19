import { useEffect, useRef, useState } from "react";
import { Send, Loader2, ArrowRight } from "lucide-react";
import { track } from "@vercel/analytics/react";

// The support agent, embedded in the page as an actual conversation.
//
// This replaces an <iframe> of studio.fieldsta.com/support-demo, which was
// the wrong shape for the job in three compounding ways. That URL is a
// complete standalone landing page — its own hero, its own "how it gets onto
// your site" steps, its own $200/month CTA, its own footer — so framing it
// inside /support-agent rendered the same content twice on one page, the
// second copy inside a 560px scroll box. It shipped the REAL widget, whose
// bubble then pinned itself to the corner of that box rather than the
// corner of the page, so the frame's own instruction ("open the chat bubble
// and ask it anything") pointed at something the reader's eye never lands
// on — while the page's actual corner already held Harper, the sales
// widget. A page about a chat bubble, containing a page about a chat
// bubble, showing a chat bubble next to a different chat bubble.
//
// The lead product never had this problem because /try talks to its API
// directly and renders the result inline. Same thing here: POST
// /api/support-chat is CORS-open to any origin (it has to be — the widget
// runs on customers' own domains) and connect-src already allows this
// origin, so there is nothing an iframe was buying us.
//
// Deliberately NOT the floating bubble on this page. A second bubble beside
// the sales one is the confusion being removed, and an always-open panel
// also means the proof is visible instead of one click away.
const AGENTS_BASE = import.meta.env.VITE_AGENTS_BASE_URL || "https://studio.fieldsta.com";
const SESSION_KEY = "fieldsta_support_demo_session";

// The agent is told the visitor is on Fieldsta's own site, so it answers as
// Fieldsta about Fieldsta — the same honest framing the old page used
// ("this is the real thing, loaded with our facts") rather than inventing a
// fictitious plumber whose made-up answers would prove less.
const OPENER =
  "Ask me anything about Fieldsta — hours, pricing, what I will and won't answer. I'm the same agent that would sit on your site, running on facts Fieldsta wrote.";

// Chosen to demonstrate the differentiator, not just competence: the second
// one has no answer in the facts, so the agent visibly hands off instead of
// improvising. That refusal IS the product.
const SUGGESTIONS = [
  "What does this cost?",
  "Can I get a refund after 3 months?",
  "What happens when you don't know something?",
];

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function InlineSupportChat() {
  const [messages, setMessages] = useState([{ role: "assistant", content: OPENER }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [error, setError] = useState("");
  // The escalation banner below has always said "with your customer's
  // email captured so nobody is lost" -- true of the real embeddable
  // widget (support-widget.ts), which has its own capture bar, but this
  // component never actually asked for one. A real escalated visitor here
  // was unreachable no matter what they typed in the chat itself: nothing
  // parses a stray "email me at..." out of message text into
  // session.visitorEmail, only POST /api/support-chat/contact does that,
  // and nothing on this page ever called it. contactStatus tracks the
  // capture form's own state; separate from `escalated` because someone
  // can submit an email, then keep chatting, without the banner and form
  // needing to fight over the same boolean.
  const [contactEmail, setContactEmail] = useState("");
  const [contactStatus, setContactStatus] = useState("idle"); // idle | sending | sent | error
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  // Scrolling the transcript on the FIRST paint would yank the page to this
  // section before the visitor has read the heading above it. Only follow
  // the conversation once they've actually started one.
  const hasSent = useRef(false);

  useEffect(() => {
    if (!hasSent.current || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    hasSent.current = true;
    setInput("");
    setError("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content }]);
    track("support_demo_message");

    try {
      const res = await fetch(`${AGENTS_BASE}/api/support-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: "fieldsta", sessionId: getSessionId(), message: content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 429 and 503 both carry a real, human-readable reason from the
        // server (rate limit hit / agent capacity). Surfacing our own
        // generic line instead would tell the visitor less than the server
        // already knows.
        setError(data.message || "Something went wrong — try again in a moment.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.escalated) setEscalated(true);
    } catch {
      setError("Couldn't reach the agent — check your connection and try again.");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function submitContact(e) {
    e.preventDefault();
    const email = contactEmail.trim();
    if (!email || contactStatus === "sending") return;
    setContactStatus("sending");
    try {
      const res = await fetch(`${AGENTS_BASE}/api/support-chat/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: "fieldsta", sessionId: getSessionId(), email }),
      });
      setContactStatus(res.ok ? "sent" : "error");
    } catch {
      setContactStatus("error");
    }
  }

  return (
    <div className="overflow-hidden border border-[rgba(var(--text-rgb),0.14)]">
      <div className="flex items-center gap-2 border-b border-[rgba(var(--text-rgb),0.1)] bg-[rgba(var(--text-rgb),0.03)] px-4 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
          Live agent · no signup
        </span>
      </div>

      <div ref={scrollRef} className="max-h-[420px] min-h-[260px] overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] bg-[var(--text)] px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--bg)]"
                  : "max-w-[85%] border border-[rgba(var(--text-rgb),0.12)] px-3.5 py-2.5 text-[14px] leading-relaxed"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 border border-[rgba(var(--text-rgb),0.12)] px-3.5 py-2.5 text-[13px] opacity-60">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
        {escalated && (
          <div className="mt-1 border-l-2 border-[var(--accent)] bg-[rgba(var(--text-rgb),0.03)] px-3 py-2 text-[12.5px] leading-relaxed opacity-80">
            That one got handed to a person rather than guessed at — on your
            site, that&apos;s the moment it asks your customer for an email so
            nobody&apos;s lost. Since this is you talking to it, not them: want
            us to actually follow up with you?
            {contactStatus === "sent" ? (
              <div className="mt-1.5 font-semibold opacity-90">
                Got it — someone will reach out.
              </div>
            ) : (
              <form onSubmit={submitContact} className="mt-2 flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="min-w-0 flex-1 border border-[rgba(var(--text-rgb),0.16)] bg-[var(--bg)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={contactStatus === "sending" || !contactEmail.trim()}
                  className="flex-none bg-[var(--text)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--bg)] transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {contactStatus === "sending" ? "Sending…" : "Notify me"}
                </button>
              </form>
            )}
            {contactStatus === "error" && (
              <div className="mt-1.5 text-[var(--accent)]">Couldn&apos;t save that — try again.</div>
            )}
          </div>
        )}
        {error && <div className="mt-1 text-[12.5px] text-[var(--accent)]">{error}</div>}
      </div>

      {/* Hidden once the conversation is underway: their own questions are
          better than ours, and stale chips under a live transcript read as
          clutter. */}
      {!hasSent.current && (
        <div className="flex flex-wrap gap-2 border-t border-[rgba(var(--text-rgb),0.08)] px-4 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="border border-[rgba(var(--text-rgb),0.16)] px-2.5 py-1.5 text-[12.5px] opacity-75 transition-all hover:border-[var(--accent)] hover:opacity-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-[rgba(var(--text-rgb),0.1)] px-3 py-2.5"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask it something a customer would ask…"
          className="flex-1 bg-transparent px-1 py-1.5 text-[14px] outline-none placeholder:opacity-40"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="flex h-8 w-8 items-center justify-center bg-[var(--accent)] text-white transition-opacity hover:bg-[var(--accent-hover)] disabled:opacity-30"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

export function SupportChatFootnote() {
  return (
    <a
      href="/get-started?product=support-agent"
      onClick={() => track("support_demo_buy")}
      className="mt-3 inline-flex items-center gap-1.5 text-[13px] opacity-60 transition-opacity hover:opacity-100"
    >
      Put this on your own site <ArrowRight className="h-3.5 w-3.5" />
    </a>
  );
}

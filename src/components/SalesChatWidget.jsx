import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Mic, Square } from "lucide-react";
import { track } from "@vercel/analytics/react";
import VoiceWaveform from "@/components/VoiceWaveform";

// Talks to the real conversational sales agent (fieldsta-agents'
// src/agents/sales-agent.ts via POST /api/sales-chat) — not a scripted
// bot. It can hold a real back-and-forth, look up the visitor's website,
// and either book a real meeting on the operator's calendar or spin up a
// pilot account directly, gated on its own stated confidence.
//
// sessionId is per-browser-tab (sessionStorage, not localStorage) — a
// fresh visit gets a fresh conversation, but a page refresh mid-chat
// doesn't lose it. The backend is the source of truth for the transcript
// either way (POST /admin/sales-chats lets the operator/openclaw review
// it), so losing the local copy would only cost the visible history, not
// the actual conversation state the agent reasons from.
const AGENTS_BASE = import.meta.env.VITE_AGENTS_BASE_URL || "https://studio.fieldsta.com";
const SESSION_KEY = "fieldsta_chat_session";
// _v2: bumped to abandon any cached history saved before the greeting
// itself stopped being persisted (older caches had it baked into message
// zero, which would otherwise double up against the fresh GREETING below).
const HISTORY_KEY = "fieldsta_chat_history_v2";

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The backend (resilience.ts's tryRun) already waits up to
// INTERACTIVE_MAX_WAIT_MS (8s) server-side before returning a 503, so most
// momentary overlap between two visitors' chats is already absorbed inside
// a SINGLE request -- a 503 reaching this code means it was still busy
// after that whole wait. This retry is a thin safety net for genuinely
// sustained load, not a second full wait layer: keep attempts/delay small,
// since each attempt can itself take up to 8s. Multiply that out — 3
// attempts x 1.2s of extra delay used to mean a visitor could stare at a
// spinner for ~26s before ever seeing an error, which is worse than the
// plain instant-503 this replaced. Two attempts x 500ms keeps the worst
// case to roughly 16s while still catching sustained-but-brief spikes.
async function fetchWithBusyRetry(url, options, attempts = 2, delayMs = 500) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 503 || attempt === attempts) return res;
    await sleep(delayMs);
  }
}

// Harper's replies routinely include a real Stripe checkout link
// (collect_payment) or a booking URL -- rendered as plain text before, so
// the one thing a prospect actually needs to click was inert and, for long
// checkout URLs specifically, overflowed the bubble outright since nothing
// told the browser it was allowed to break mid-word. Splitting on the URL
// keeps every match as its own React child (never raw HTML), so this stays
// as safe as the plain-text rendering it replaces.
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function MessageContent({ text }) {
  return text.split(URL_PATTERN).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all underline underline-offset-2 hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const GREETING = {
  role: "assistant",
  content:
    "Hey — I'm Harper, Fieldsta's AI. This is your live demo: ask me anything about your business and I'll show you exactly how this saves you time and money.",
};

export default function SalesChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    // Only the actual back-and-forth is cached — the greeting always comes
    // fresh from the current build, so an old visitor's cached session
    // never gets stuck showing a greeting a code change has since replaced.
    const saved = sessionStorage.getItem(HISTORY_KEY);
    return [GREETING, ...(saved ? JSON.parse(saved) : [])];
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);
  const autoSentRef = useRef(false);
  // ?cid=<prospect.id> off a cold-email click-through link — read once on
  // mount, sent with only the visitor's first message so the backend can
  // greet them by company/offer instead of as a stranger. Not re-sent on
  // later turns (the ref is cleared after the first send): the backend
  // only uses it pre-greeting anyway, and dropping it after avoids paying
  // the lookup on every subsequent message.
  const cidRef = useRef(
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("cid") : null
  );

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(1)));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // One place for the event regardless of which of the three ways (button
    // click, nav/hero CTA, ?chat=1 link) actually opened it.
    if (open) track("chat_opened");
  }, [open]);

  useEffect(() => {
    // Lets CTA buttons elsewhere on the page (hero, nav, final CTA) launch
    // the live AI demo directly instead of scrolling to a form — the demo
    // IS Harper, not a "submit and wait for a callback" step. An optional
    // detail.autoMessage (e.g. from the /get-started "checkout now" card)
    // is sent on the visitor's behalf so they land straight in a live
    // Harper reply instead of a blank chat they have to prime themselves —
    // guarded by a ref so a re-dispatch mid-session (or StrictMode) can't
    // fire it twice.
    function handleOpenRequest(e) {
      sessionStorage.removeItem("fieldsta_chat_closed");
      setOpen(true);
      const autoMessage = e?.detail?.autoMessage;
      if (autoMessage && !autoSentRef.current) {
        autoSentRef.current = true;
        send(null, autoMessage);
      }
    }
    window.addEventListener("fieldsta:open-chat", handleOpenRequest);
    return () => window.removeEventListener("fieldsta:open-chat", handleOpenRequest);
  }, []);

  useEffect(() => {
    // Lets an external link (e.g. the dashboard's "Upgrade" button) open
    // straight into a live Harper conversation instead of landing on the
    // page cold — a query param survives a real navigation, unlike the
    // fieldsta:open-chat event above which only works for same-page clicks.
    const params = new URLSearchParams(window.location.search);
    if (params.get("chat") === "1" || params.get("cid")) {
      sessionStorage.removeItem("fieldsta_chat_closed");
      setOpen(true);
    }
  }, []);

  async function send(e, overrideText) {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;

    setInput("");
    setError("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);

    try {
      const res = await fetchWithBusyRetry(`${AGENTS_BASE}/api/sales-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          message: text,
          ...(cidRef.current ? { cid: cidRef.current } : {}),
        }),
      });
      cidRef.current = null;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      // Server only includes `outcome` the turn a pilot account or checkout
      // link actually gets created -- real conversion signal, not a page
      // view, so it fires exactly once per session per outcome.
      if (data.outcome) track(data.outcome);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  async function startRecording() {
    if (recording || voiceBusy) return;
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        sendVoiceTurn(new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError("Couldn't access your microphone — check browser permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  async function sendVoiceTurn(blob) {
    setVoiceBusy(true);
    setError("");
    try {
      const res = await fetchWithBusyRetry(`${AGENTS_BASE}/api/voice-chat?sessionId=${getSessionId()}`, {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm" },
        body: blob,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Voice chat failed.");

      setMessages((m) => [...m, { role: "user", content: data.transcript }, { role: "assistant", content: data.reply }]);

      if (data.audioBase64) {
        const audioSrc = `data:audio/mpeg;base64,${data.audioBase64}`;
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = audioSrc;
          audioPlayerRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      setError(err.message || "Voice chat failed. Try again.");
    } finally {
      setVoiceBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-[#F5F5F5]/15 bg-[#0a0a0b] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#F5F5F5]/10 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-[#F5F5F5]">Harper · Fieldsta Sales</div>
              <div className="text-[11px] text-[#6F6F75]">Pricing, plans & getting started</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-[#6F6F75] hover:text-[#F5F5F5]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed " +
                    (m.role === "user"
                      ? "bg-[#F5F5F5] text-[#0a0a0a]"
                      : "bg-[#F5F5F5]/[0.06] text-[#E5E5E7]")
                  }
                >
                  <MessageContent text={m.content} />
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-[#F5F5F5]/[0.06] px-3.5 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9A9A9E]" />
                </div>
              </div>
            )}
            {error && <div className="text-xs text-[#FF9A93]">{error}</div>}
          </div>

          <VoiceWaveform audioRef={audioPlayerRef} busy={voiceBusy} />
          <form onSubmit={send} className="flex items-center gap-2 border-t border-[#F5F5F5]/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recording ? "Listening…" : voiceBusy ? "Harper's responding…" : "Type a message…"}
              maxLength={2000}
              disabled={recording || voiceBusy}
              className="flex-1 rounded-full border border-[#F5F5F5]/15 bg-[#0d0d0f] px-4 py-2 text-[13.5px] text-[#F5F5F5] placeholder:text-[#4A4A50] focus-visible:border-[#F5F5F5]/35 focus-visible:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={() => recording && stopRecording()}
              onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
              disabled={voiceBusy}
              aria-label={recording ? "Release to send" : "Hold to talk to Harper"}
              title="Hold to talk"
              className={
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 " +
                (recording ? "bg-[#EF4444] text-white animate-pulse" : "bg-[#F5F5F5]/10 text-[#F5F5F5] hover:bg-[#F5F5F5]/20")
              }
            >
              {voiceBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || sending || recording || voiceBusy}
              aria-label="Send"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#0a0a0a] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <audio ref={audioPlayerRef} className="hidden" />
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with Harper, Fieldsta sales"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F5] text-[#0a0a0a] shadow-2xl transition-transform hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}

import { useRef, useState } from "react";

// Ported from the standalone fieldsta-lead-booker Vercel project — that
// project isn't supposed to exist on its own; this page + api/lead.js are
// its content, now living inside the main fieldsta app.
export default function DemoLanding() {
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const crmRef = useRef(null);
  const sourceRef = useRef(null);
  const [msg, setMsg] = useState({ text: "", color: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg({ text: "Submitting...", color: "" });

    const payload = {
      firstName: firstNameRef.current.value,
      lastName: lastNameRef.current.value,
      email: emailRef.current.value,
      crm: crmRef.current.value,
      source: sourceRef.current.value,
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMsg({ text: data.message || "Demo request received!", color: "#0a7d2c" });
      e.target.reset();
    } catch (err) {
      setMsg({ text: "Something went wrong. Try again.", color: "#c0392b" });
    }
  }

  return (
    <div className="demo-landing">
      <style>{`
        .demo-landing { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; background: #fff; line-height: 1.5; }
        .demo-landing * { box-sizing: border-box; }
        .demo-landing .container { max-width: 1000px; margin: 0 auto; padding: 0 24px; }
        .demo-landing header { padding: 20px 0; border-bottom: 1px solid #eee; }
        .demo-landing .logo { font-weight: 800; font-size: 22px; letter-spacing: -0.5px; }
        .demo-landing .hero { padding: 100px 0 80px; text-align: center; background: linear-gradient(180deg, #fafafa 0%, #fff 100%); }
        .demo-landing .hero h1 { font-size: 48px; font-weight: 800; letter-spacing: -1.5px; max-width: 780px; margin: 0 auto 24px; }
        .demo-landing .hero p { font-size: 20px; color: #555; max-width: 620px; margin: 0 auto 36px; }
        .demo-landing .btn { display: inline-block; background: #111; color: #fff; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 17px; border: none; cursor: pointer; }
        .demo-landing .btn:hover { background: #333; }
        .demo-landing section { padding: 80px 0; }
        .demo-landing .section-title { font-size: 34px; font-weight: 800; text-align: center; margin-bottom: 16px; letter-spacing: -1px; }
        .demo-landing .lead-form { max-width: 480px; margin: 0 auto; background: #fafafa; border-radius: 16px; padding: 40px; }
        .demo-landing .lead-form input, .demo-landing .lead-form select { width: 100%; padding: 14px; margin-bottom: 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; font-family: inherit; }
        .demo-landing .lead-form label { font-size: 13px; font-weight: 600; color: #555; display: block; margin-bottom: 6px; }
        .demo-landing #formMsg { margin-top: 16px; font-size: 14px; text-align: center; }
        .demo-landing footer { text-align: center; padding: 60px 0; color: #999; font-size: 14px; border-top: 1px solid #eee; }
      `}</style>

      <header>
        <div className="container">
          <div className="logo">Fieldsta</div>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h1>Never Lose a Lead to Slow Response Time Again</h1>
          <p>
            Fieldsta replies to every inbound lead in under 5 minutes, qualifies them, and
            books the meeting straight onto your calendar — with a human reviewing every
            booking.
          </p>
        </div>
      </section>

      <section id="demo">
        <div className="container">
          <div className="section-title">Get a Live Demo</div>
          <div className="lead-form">
            <form id="leadForm" onSubmit={handleSubmit}>
              <label>First Name</label>
              <input type="text" ref={firstNameRef} required />
              <label>Last Name</label>
              <input type="text" ref={lastNameRef} />
              <label>Business Email</label>
              <input type="email" ref={emailRef} required />
              <label>What CRM do you use?</label>
              <input type="text" ref={crmRef} placeholder="e.g. HubSpot, Salesforce, none" />
              <label>How did you hear about us?</label>
              <select ref={sourceRef} defaultValue="">
                <option value="">Select one</option>
                <option value="Referral">Referral</option>
                <option value="Google Search">Google Search</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Email/Cold Outreach">Email / Cold Outreach</option>
                <option value="Other">Other</option>
              </select>
              <button type="submit" className="btn" style={{ width: "100%" }}>
                Get a Live Demo
              </button>
            </form>
            <div id="formMsg" style={{ color: msg.color }}>
              {msg.text}
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">&copy; 2026 Fieldsta.</div>
      </footer>
    </div>
  );
}

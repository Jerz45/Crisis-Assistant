import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_PATH = "http://localhost:5005/webhooks/rest/webhook";
 // uses proxy -> http://localhost:5005
const DEFAULT_SENDER = "student-ui";

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [sender, setSender] = useState(DEFAULT_SENDER);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Hi — Do you have emergency?. Describe what’s happening.",
      time: nowTime(),
    },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

const quickPrompts = useMemo(
  () => [
    // start / trigger flood flow
    "flood",
    "my street is flooded",
    "water is entering my house",

    // location / hospital
    "Berlin",
    "Munich",
    "Hamburg",
    "nearest hospital",

    // severity
    "severity high",
    "severity medium",
    "severity low",

    // water level
    "water ankle",
    "water knee",
    "water waist",
    "water above",

    // injuries
    "injuries yes",
    "injuries no",

    // trapped
    "trapped yes",
    "trapped no",

    // general instructions
    "what should I do",
    "safety instructions",
  ],
  []
);


  function newChat() {
    setSender(`${DEFAULT_SENDER}-${Date.now()}`);
    setInput("");
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Hi — Do you have emergency?. Describe what’s happening.",
        time: nowTime(),
      },
    ]);
  }

  async function send(text) {
    const content = text.trim();
    if (!content || isSending) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: content,
      time: nowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, message: content }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const replies = (data || [])
        .map((m) => m.text)
        .filter(Boolean)
        .map((t) => ({
          id: crypto.randomUUID(),
          role: "assistant",
          text: t,
          time: nowTime(),
        }));

      setMessages((prev) => [
        ...prev,
        ...(replies.length ? replies : [{
          id: crypto.randomUUID(),
          role: "assistant",
          text: "I didn’t receive a reply. Please try again.",
          time: nowTime(),
        }]),
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "⚠️ I can’t reach the backend. Please confirm Rasa is running on localhost:5005 and actions on localhost:5055.",
          time: nowTime(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }

  return (
    <div className="appShell">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brandTitle">Crisis Assistant</div>
        </div>

        <button className="newChatBtn" onClick={newChat}>
          +
        </button>

        <div className="sidebarSection">
          <div className="sectionTitle">Suggestions</div>
          <div className="chips">
            {quickPrompts.map((p) => (
              <button
                key={p}
                className="chip"
                onClick={() => send(p)}
                disabled={isSending}
                title="Send"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main">
        <header className="topbar">
          <div className="topbarTitle">Conversation</div>
          <div className={`pill ${isSending ? "pillBusy" : "pillReady"}`}>
            {isSending ? "Thinking…" : "Ready"}
          </div>
        </header>

        <section className="chatArea">
          {messages.map((m) => (
            <div key={m.id} className={`msgRow ${m.role}`}>
              <div className="avatar">
                {m.role === "assistant" ? "CA" : "YOU"}
              </div>
              <div className={`bubble ${m.role}`}>
                <div className="bubbleText">{m.text}</div>
                <div className="bubbleMeta">{m.time}</div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="msgRow assistant">
              <div className="avatar">CA</div>
              <div className="bubble assistant">
                <div className="typing">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="bubbleMeta">{nowTime()}</div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </section>

        <footer className="composerWrap">
          <form className="composer" onSubmit={onSubmit}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Write a message."
              rows={1}
            />
            <button type="submit" disabled={isSending || !input.trim()}>
              Send
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

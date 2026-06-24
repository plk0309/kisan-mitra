"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

const sourceLabels: Record<string, string> = {
  wheat_guide: "गेहूं गाइड",
  disease_guide: "रोग गाइड",
  pest_guide: "कीट गाइड",
  pm_kisan: "PM-KISAN",
  kcc_guide: "KCC",
  soil_guide: "मिट्टी गाइड",
  msp_guide: "MSP गाइड",
};

const content = {
  hi: {
    title: "किसान मित्र",
    subtitle: "AI कृषि सहायक",
    online: "ऑनलाइन",
    greeting: "नमस्ते किसान भाई!",
    greetingSub: "अपनी फसल से जुड़ा कोई भी सवाल पूछें",
    placeholder: "अपना सवाल लिखें...",
    hint: "Enter भेजें · Shift+Enter नई लाइन · 🎤 दबाकर बोलें",
    error: "माफ़ करें, कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।",
    diagnoseBtn: "🔍 रोग जाँच",
    pricesBtn: "💰 मंडी भाव",
    suggestions: [
      "गेहूं में पीला रतुआ का इलाज?",
      "PM-KISAN में रजिस्ट्रेशन कैसे करें?",
      "गेहूं की बुवाई का सही समय?",
      "खाद की मात्रा कितनी डालें?",
    ],
  },
  en: {
    title: "Kisan Mitra",
    subtitle: "AI Agriculture Assistant",
    online: "Online",
    greeting: "Hello Farmer!",
    greetingSub: "Ask any question about your crops",
    placeholder: "Type your question...",
    hint: "Enter to send · Shift+Enter new line · 🎤 Hold to speak",
    error: "Sorry, something went wrong. Please try again.",
    diagnoseBtn: "🔍 Diagnose",
    pricesBtn: "💰 Prices",
    suggestions: [
      "How to treat yellow rust in wheat?",
      "How to register for PM-KISAN?",
      "Best time to sow wheat?",
      "How much fertilizer to apply?",
    ],
  },
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = content[lang];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await axios.post(`${API_URL}/chat`, { message: text, history });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.response, sources: res.data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t.error },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        try {
          const res = await axios.post(`${API_URL}/transcribe`, formData);
          if (res.data.text) sendMessage(res.data.text);
        } catch {
          alert("Voice transcription failed. Please type your message.");
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: "680px", margin: "0 auto", background: "#0f1117" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
          KM
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>{t.title}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{t.subtitle}</div>
        </div>

        {/* Diagnose button */}
        <Link
          href="/diagnose"
          style={{
            padding: "5px 11px",
            borderRadius: "99px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)",
            fontSize: "12px",
            textDecoration: "none",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {t.diagnoseBtn}
        </Link>

        <Link
  href="/prices"
  style={{
    padding: "5px 11px",
    borderRadius: "99px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.6)",
    fontSize: "12px",
    textDecoration: "none",
    flexShrink: 0,
    whiteSpace: "nowrap",
  }}
>
  {t.pricesBtn}
</Link>

        {/* Language toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "20px", padding: "3px", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
          {(["hi", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background: lang === l ? "#16a34a" : "transparent",
                color: lang === l ? "white" : "rgba(255,255,255,0.4)",
              }}
            >
              {l === "hi" ? "हिंदी" : "EN"}
            </button>
          ))}
        </div>

        {/* Online indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>{t.online}</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "20px", textAlign: "center", paddingTop: "60px" }}
          >
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(22,163,74,0.15)", border: "1px solid rgba(22,163,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
              🌾
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 600, fontSize: "18px", marginBottom: "6px" }}>{t.greeting}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>{t.greetingSub}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%", maxWidth: "420px" }}>
              {t.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "12px",
                    cursor: "pointer",
                    lineHeight: "1.4",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
            >
              <div style={{
                maxWidth: "80%",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "10px 14px",
                fontSize: "13px",
                lineHeight: "1.6",
                background: msg.role === "user" ? "#16a34a" : "rgba(255,255,255,0.06)",
                border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.9)",
              }}>
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    {msg.sources.map((s) => (
                      <span key={s} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
                        {sourceLabels[s] || s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: "5px", alignItems: "center" }}>
              {[0, 150, 300].map((delay) => (
                <div key={delay} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", animation: "bounce 1s infinite", animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", padding: "10px 16px", display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={t.placeholder}
              rows={1}
              style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,0.9)", fontSize: "13px", resize: "none", outline: "none", border: "none", maxHeight: "120px", lineHeight: "1.5", fontFamily: "inherit" }}
            />
          </div>

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            style={{
              width: "42px", height: "42px", borderRadius: "50%", border: recording ? "none" : "1px solid rgba(255,255,255,0.12)",
              background: recording ? "#ef4444" : "rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: "16px", flexShrink: 0,
              transform: recording ? "scale(1.1)" : "scale(1)", transition: "all 0.15s",
            }}
          >
            {recording ? "⏹" : "🎤"}
          </button>

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: "42px", height: "42px", borderRadius: "50%",
              background: input.trim() && !loading ? "#16a34a" : "rgba(255,255,255,0.06)",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed", flexShrink: 0, transition: "all 0.15s",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", textAlign: "center", marginTop: "8px" }}>{t.hint}</p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
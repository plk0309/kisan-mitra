"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Result = {
  disease: string;
  disease_hindi: string;
  confidence: number;
  severity: string;
  treatment_hi: string;
  treatment_en: string;
  is_healthy: boolean;
};

const severityColor: Record<string, string> = {
  none: "#22c55e",
  mild: "#eab308",
  moderate: "#f97316",
  severe: "#ef4444",
  unknown: "#6b7280",
};

const severityLabel: Record<string, { hi: string; en: string }> = {
  none: { hi: "कोई नहीं", en: "None" },
  mild: { hi: "हल्का", en: "Mild" },
  moderate: { hi: "मध्यम", en: "Moderate" },
  severe: { hi: "गंभीर", en: "Severe" },
  unknown: { hi: "अज्ञात", en: "Unknown" },
};

export default function DiagnosePage() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Only image files allowed");
      return;
    }
    setFile(f);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const diagnose = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API_URL}/diagnose`, formData);
      setResult(res.data);
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.detail : "Diagnosis failed";
      setError(msg || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setFile(null);
    setResult(null);
    setError("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", maxWidth: "680px", margin: "0 auto", padding: "0 16px 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "24px" }}>
        <Link href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "20px", lineHeight: 1 }}>←</Link>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "12px" }}>KM</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>
            {lang === "hi" ? "रोग पहचान" : "Disease Detection"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>
            {lang === "hi" ? "पत्ती की फोटो से रोग पहचानें" : "Identify disease from leaf photo"}
          </div>
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "20px", padding: "3px", border: "1px solid rgba(255,255,255,0.1)" }}>
          {(["hi", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{ padding: "4px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: 500, border: "none", cursor: "pointer", background: lang === l ? "#16a34a" : "transparent", color: lang === l ? "white" : "rgba(255,255,255,0.4)" }}>
              {l === "hi" ? "हिंदी" : "EN"}
            </button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      {!image && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed rgba(255,255,255,0.12)",
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            background: "rgba(255,255,255,0.02)",
          }}
          whileHover={{ borderColor: "rgba(22,163,74,0.5)", background: "rgba(22,163,74,0.04)" }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📷</div>
          <div style={{ color: "white", fontWeight: 500, fontSize: "15px", marginBottom: "8px" }}>
            {lang === "hi" ? "पत्ती की फोटो अपलोड करें" : "Upload a leaf photo"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: "20px" }}>
            {lang === "hi" ? "यहाँ खींचें या क्लिक करें" : "Drag here or click to browse"}
          </div>
          <div style={{ display: "inline-block", padding: "8px 20px", borderRadius: "99px", background: "#16a34a", color: "white", fontSize: "13px", fontWeight: 500 }}>
            {lang === "hi" ? "फोटो चुनें" : "Choose Photo"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px", marginTop: "16px" }}>
            JPG, PNG, WEBP · Max 5MB
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </motion.div>
      )}

      {/* Image preview + diagnose */}
      {image && !result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <img src={image} alt="leaf" style={{ width: "100%", maxHeight: "340px", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={reset} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer" }}>
              {lang === "hi" ? "दूसरी फोटो" : "Change Photo"}
            </button>
            <button
              onClick={diagnose}
              disabled={loading}
              style={{ flex: 2, padding: "12px", borderRadius: "12px", background: loading ? "rgba(22,163,74,0.4)" : "#16a34a", border: "none", color: "white", fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {loading ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  {lang === "hi" ? "जाँच हो रही है..." : "Analysing..."}
                </>
              ) : (
                lang === "hi" ? "🔍 रोग पहचानें" : "🔍 Diagnose"
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "8px" }}>

            {/* Image thumbnail */}
            {image && (
              <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "16px", height: "160px" }}>
                <img src={image} alt="leaf" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}

            {/* Disease card */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "22px", marginBottom: "4px" }}>
                    {result.is_healthy ? "✅" : "⚠️"}
                  </div>
                  <div style={{ color: "white", fontWeight: 600, fontSize: "18px" }}>
                    {lang === "hi" ? result.disease_hindi : result.disease.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
                    {lang === "hi" ? "सटीकता" : "Confidence"}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: result.is_healthy ? "#22c55e" : "#f97316" }}>
                    {Math.round(result.confidence * 100)}%
                  </div>
                </div>
              </div>

              {/* Severity bar */}
              {!result.is_healthy && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      {lang === "hi" ? "गंभीरता" : "Severity"}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: severityColor[result.severity] || "#6b7280" }}>
                      {severityLabel[result.severity]?.[lang] || result.severity}
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: "99px",
                      background: severityColor[result.severity] || "#6b7280",
                      width: result.severity === "mild" ? "33%" : result.severity === "moderate" ? "66%" : result.severity === "severe" ? "100%" : "0%",
                      transition: "width 0.6s ease"
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Treatment card */}
            <div style={{ background: result.is_healthy ? "rgba(22,163,74,0.08)" : "rgba(234,179,8,0.08)", border: `1px solid ${result.is_healthy ? "rgba(22,163,74,0.2)" : "rgba(234,179,8,0.2)"}`, borderRadius: "16px", padding: "16px 20px", marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: 500 }}>
                {lang === "hi" ? "उपचार सलाह" : "Treatment Advice"}
              </div>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                {lang === "hi" ? result.treatment_hi : result.treatment_en}
              </p>
            </div>

            {/* Warning */}
            {!result.is_healthy && (
              <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(255,255,255,0.5)", fontSize: "11px", marginBottom: "16px" }}>
                ⚠️ {lang === "hi" ? "कीटनाशक छिड़काव से पहले मास्क और दस्ताने पहनें। बच्चों को दूर रखें।" : "Wear mask and gloves before spraying pesticides. Keep children away."}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={reset} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer" }}>
                {lang === "hi" ? "नई फोटो" : "New Photo"}
              </button>
              <Link href="/" style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#16a34a", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {lang === "hi" ? "चैट करें" : "Ask More"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
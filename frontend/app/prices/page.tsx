"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type PriceRecord = {
  mandi: string;
  district: string;
  commodity: string;
  variety: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  date: string;
};

type PricesResponse = {
  crop: string;
  state: string;
  records: PriceRecord[];
  last_updated: string;
  total: number;
  average_modal: number;
};

const CROPS = [
  { key: "wheat", hi: "गेहूं", en: "Wheat", emoji: "🌾" },
  { key: "rice", hi: "चावल", en: "Rice", emoji: "🍚" },
  { key: "maize", hi: "मक्का", en: "Maize", emoji: "🌽" },
  { key: "mustard", hi: "सरसों", en: "Mustard", emoji: "🌿" },
  { key: "gram", hi: "चना", en: "Gram", emoji: "🫘" },
  { key: "potato", hi: "आलू", en: "Potato", emoji: "🥔" },
  { key: "onion", hi: "प्याज", en: "Onion", emoji: "🧅" },
  { key: "soybean", hi: "सोयाबीन", en: "Soybean", emoji: "🌱" },
];

const MSP: Record<string, number> = {
  wheat: 2275, rice: 2183, maize: 1850,
  soybean: 4600, mustard: 5650, gram: 5440,
  potato: 0, onion: 0,
};

const t = {
  hi: {
    title: "मंडी भाव",
    subtitle: "आज के बाजार भाव",
    lastUpdated: "अपडेट",
    avgPrice: "औसत भाव",
    mspLabel: "MSP",
    aboveMsp: "MSP से ऊपर",
    belowMsp: "MSP से नीचे",
    minLabel: "न्यूनतम",
    maxLabel: "अधिकतम",
    modalLabel: "मोडल",
    loading: "भाव लोड हो रहे हैं...",
    perQuintal: "₹/क्विंटल",
    noData: "डेटा उपलब्ध नहीं है",
    refresh: "ताज़ा करें",
  },
  en: {
    title: "Mandi Prices",
    subtitle: "Today's market rates",
    lastUpdated: "Updated",
    avgPrice: "Avg Price",
    mspLabel: "MSP",
    aboveMsp: "Above MSP",
    belowMsp: "Below MSP",
    minLabel: "Min",
    maxLabel: "Max",
    modalLabel: "Modal",
    loading: "Loading prices...",
    perQuintal: "₹/quintal",
    noData: "No data available",
    refresh: "Refresh",
  },
};

export default function PricesPage() {
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const [selectedCrop, setSelectedCrop] = useState("wheat");
  const [data, setData] = useState<PricesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const txt = t[lang];

  const fetchPrices = async (crop: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/prices`, {
        params: { crop, state: "Uttar Pradesh", limit: 15 },
      });
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices(selectedCrop);
  }, [selectedCrop]);

  const msp = MSP[selectedCrop] || 0;
  const aboveMspCount = data?.records.filter(r => r.modal_price >= msp).length || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", maxWidth: "680px", margin: "0 auto", padding: "0 16px 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "20px" }}>
        <Link href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: "20px", lineHeight: 1 }}>←</Link>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "12px" }}>KM</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 600, fontSize: "14px" }}>{txt.title}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{txt.subtitle}</div>
        </div>
        <button
          onClick={() => fetchPrices(selectedCrop)}
          style={{ padding: "5px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: "12px", cursor: "pointer" }}
        >
          🔄 {txt.refresh}
        </button>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "20px", padding: "3px", border: "1px solid rgba(255,255,255,0.1)" }}>
          {(["hi", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{ padding: "4px 10px", borderRadius: "16px", fontSize: "12px", fontWeight: 500, border: "none", cursor: "pointer", background: lang === l ? "#16a34a" : "transparent", color: lang === l ? "white" : "rgba(255,255,255,0.4)" }}>
              {l === "hi" ? "हिंदी" : "EN"}
            </button>
          ))}
        </div>
      </div>

      {/* Crop selector */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "20px" }}>
        {CROPS.map((crop) => (
          <button
            key={crop.key}
            onClick={() => setSelectedCrop(crop.key)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
              padding: "10px 14px", borderRadius: "12px", flexShrink: 0,
              background: selectedCrop === crop.key ? "rgba(22,163,74,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${selectedCrop === crop.key ? "rgba(22,163,74,0.4)" : "rgba(255,255,255,0.08)"}`,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "20px" }}>{crop.emoji}</span>
            <span style={{ fontSize: "11px", color: selectedCrop === crop.key ? "#4ade80" : "rgba(255,255,255,0.5)", fontWeight: selectedCrop === crop.key ? 600 : 400 }}>
              {lang === "hi" ? crop.hi : crop.en}
            </span>
          </button>
        ))}
      </div>

      {/* Stats row */}
      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}
        >
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>{txt.avgPrice}</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "white" }}>₹{Math.round(data.average_modal)}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{txt.perQuintal}</div>
          </div>
          {msp > 0 && (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>{txt.mspLabel} 2024-25</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#facc15" }}>₹{msp}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{txt.perQuintal}</div>
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>
              {msp > 0 ? txt.aboveMsp : txt.avgPrice}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#4ade80" }}>
              {msp > 0 ? `${aboveMspCount}/${data.total}` : data.total}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
              {lang === "hi" ? "मंडियां" : "Mandis"}
            </div>
          </div>
        </motion.div>
      )}

      {/* Last updated */}
      {data && (
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginBottom: "14px", textAlign: "right" }}>
          {txt.lastUpdated}: {data.last_updated}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "60px 0" }}>
          <div style={{ width: "32px", height: "32px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{txt.loading}</div>
        </div>
      )}

      {/* Price table */}
      {!loading && data && data.records.length > 0 && (
        <AnimatePresence>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.records.map((record, i) => {
              const aboveMsp = msp > 0 && record.modal_price >= msp;
              const belowMsp = msp > 0 && record.modal_price < msp;
              return (
                <motion.div
                  key={`${record.mandi}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${aboveMsp ? "rgba(74,222,128,0.15)" : belowMsp ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "12px",
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <div style={{ color: "white", fontWeight: 500, fontSize: "14px" }}>{record.mandi}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", marginTop: "2px" }}>
                        {record.variety} · {record.date}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: aboveMsp ? "#4ade80" : belowMsp ? "#f87171" : "white" }}>
                        ₹{Math.round(record.modal_price)}
                      </div>
                      {msp > 0 && (
                        <div style={{ fontSize: "10px", marginTop: "2px", color: aboveMsp ? "#4ade80" : "#f87171" }}>
                          {aboveMsp ? "▲" : "▼"} {txt.mspLabel} {aboveMsp ? "+" : ""}{Math.round(record.modal_price - msp)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price bar */}
                  <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>{txt.minLabel}</div>
                      <div style={{ color: "rgba(255,255,255,0.7)" }}>₹{Math.round(record.min_price)}</div>
                    </div>
                    <div style={{ flex: 2 }}>
                      <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", margin: "10px 0 4px", position: "relative" }}>
                        {record.max_price > record.min_price && (
                          <div style={{
                            position: "absolute",
                            left: `${((record.modal_price - record.min_price) / (record.max_price - record.min_price)) * 100}%`,
                            top: "-3px", width: "10px", height: "10px",
                            borderRadius: "50%", background: aboveMsp ? "#4ade80" : belowMsp ? "#f87171" : "#94a3b8",
                            transform: "translateX(-50%)",
                          }} />
                        )}
                      </div>
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>{txt.maxLabel}</div>
                      <div style={{ color: "rgba(255,255,255,0.7)" }}>₹{Math.round(record.max_price)}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {!loading && (!data || data.records.length === 0) && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
          {txt.noData}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
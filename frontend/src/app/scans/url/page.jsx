"use client";
import { useState, useEffect, useRef } from "react";
import { apiService } from "@/services/apiService";
// ─── Shared status config ─────────────────────────────────────
const STATUS_META = {
  safe:      { label: "SAFE",      color: "#00e676", glow: "#00e67640", icon: "✓" },
  warning:   { label: "WARNING",   color: "#ffab00", glow: "#ffab0040", icon: "⚠" },
  malicious: { label: "MALICIOUS", color: "#ff1744", glow: "#ff174440", icon: "✕" },
};
function deriveStatus(result) {
  const m = parseInt(result.malicious ?? 0);
  const s = parseInt(result.suspicious ?? 0);
  if (m > 0) return "malicious";
  if (s > 0) return "warning";
  return "safe";
}
// ─── Animated counter ─────────────────────────────────────────
function Counter({ value, duration = 1000 }) {
  const n = parseInt(value) || 0;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (n === 0) { setDisplay(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setDisplay(Math.floor(p * n));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [n, duration]);
  return <>{display}</>;
}
// ─── Score bar ────────────────────────────────────────────────
function ScoreBar({ score, animate }) {
  const match = (score ?? "").match(/(\d+)/);
  const pct = match ? parseInt(match[1]) : null;
  if (pct === null) return null;
  const color = pct >= 80 ? "#00e676" : pct >= 50 ? "#ffab00" : "#ff1744";
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Security Score
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'JetBrains Mono',monospace" }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 8, background: "#0d2137", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: animate ? `${pct}%` : "0%",
          background: `linear-gradient(90deg,${color}88,${color})`,
          borderRadius: 999,
          transition: "width 1.2s cubic-bezier(.22,1,.36,1) 0.1s",
          boxShadow: `0 0 12px ${color}`,
        }} />
      </div>
    </div>
  );
}
// ─── Structured report ────────────────────────────────────────
function parseReport(text) {
  if (!text) return null;
  const get = (label) => {
    const m = text.match(new RegExp(`${label}\\s*[:|=]\\s*(.+)`, "i"));
    return m ? m[1].trim() : null;
  };
  return {
    verdict:     get("VERDICT"),
    riskLevel:   get("Risk Level"),
    score:       get("Security Score"),
    ratio:       get("Detection Ratio"),
    malicious:   get("Malicious Engines"),
    suspicious:  get("Suspicious Engines"),
    harmless:    get("Harmless Engines"),
    undetected:  get("Undetected Engines"),
    total:       get("Total Engines"),
    scanStatus:  get("Scan Status"),
    fileName:    get("File Name"),
    recommend:   get("Recommendation"),
  };
}
function ReportBadge({ value }) {
  if (!value) return null;
  const upper = value.toUpperCase();
  const color =
    upper.includes("SAFE")      ? "#00e676" :
    upper.includes("MALICIOUS") ? "#ff1744" :
    upper.includes("LOW")       ? "#00e676" :
    upper.includes("HIGH")      ? "#ff1744" :
    upper.includes("MEDIUM")    ? "#ffab00" : "#00e5ff";
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 999,
      fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
      color, background: color + "18",
      border: `1px solid ${color}44`,
      boxShadow: `0 0 8px ${color}22`,
    }}>{value}</span>
  );
}
function EngineBar({ label, value, total, color }) {
  const n = parseInt(value) || 0;
  const t = parseInt(total) || 91;
  const pct = Math.min((n / t) * 100, 100);
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(pct), 120); }, [pct]);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace" }}>{n}</span>
      </div>
      <div style={{ height: 4, background: "#0d2137", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${w}%`,
          background: `linear-gradient(90deg,${color}66,${color})`,
          borderRadius: 999,
          transition: "width 0.9s cubic-bezier(.22,1,.36,1)",
          boxShadow: n > 0 ? `0 0 6px ${color}` : "none",
        }} />
      </div>
    </div>
  );
}
function RawOutput({ text }) {
  const [open, setOpen] = useState(false);
  const [vis,  setVis]  = useState(false);
  const report = parseReport(text);
  if (!report) return null;
  const handleOpen = () => {
    if (open) { setOpen(false); setVis(false); return; }
    setOpen(true);
    setTimeout(() => setVis(true), 30);
  };
  const verdictColor =
    (report.verdict ?? "").toUpperCase().includes("SAFE")      ? "#00e676" :
    (report.verdict ?? "").toUpperCase().includes("MALICIOUS") ? "#ff1744" : "#ffab00";
  return (
    <div style={{ marginTop: 4 }}>
      {/* Toggle */}
      <button
        onClick={handleOpen}
        style={{
          width: "100%", padding: "11px 18px",
          display: "flex", alignItems: "center", gap: 10,
          background: open ? "#060f1a" : "transparent",
          border: `1px solid ${open ? "#00e5ff55" : "#00e5ff22"}`,
          borderRadius: open ? "14px 14px 0 0" : 14,
          cursor: "pointer", transition: "all 0.2s",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = "#00e5ff55"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = "#00e5ff22"; }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
        <span style={{
          fontSize: 10, fontWeight: 700, color: "#00e5ffb3",
          letterSpacing: "0.12em", textTransform: "uppercase",
          fontFamily: "'JetBrains Mono',monospace", flex: 1, textAlign: "left",
        }}>Full Scan Report</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#00e5ff88", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", display: "inline-block" }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div style={{
          background: "#030c18",
          border: "1px solid #00e5ff1a",
          borderTop: "none",
          borderRadius: "0 0 14px 14px",
          padding: "20px 22px",
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          fontFamily: "'JetBrains Mono',monospace",
        }}>
          {/* ── Verdict banner ── */}
          {report.verdict && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 10, marginBottom: 18,
              background: verdictColor + "0f",
              border: `1px solid ${verdictColor}33`,
              boxShadow: `0 0 20px ${verdictColor}0a`,
            }}>
              <span style={{ fontSize: 10, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.1em" }}>Verdict</span>
              <span style={{
                fontSize: 14, fontWeight: 900, color: verdictColor,
                letterSpacing: "0.15em",
                textShadow: `0 0 12px ${verdictColor}88`,
                animation: "verdict-glow 2s ease-in-out infinite",
              }}>{report.verdict}</span>
            </div>
          )}
          {/* ── Two column grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Risk Level",      value: report.riskLevel,  badge: true  },
              { label: "Security Score",  value: report.score,      badge: false },
              { label: "Detection Ratio", value: report.ratio,      badge: false },
              { label: "Scan Status",     value: report.scanStatus, badge: false },
              { label: "File Name",       value: report.fileName,   badge: false },
            ].filter(r => r.value).map(({ label, value, badge }) => (
              <div key={label} style={{
                background: "#0a1929", borderRadius: 10,
                padding: "10px 14px",
                border: "1px solid #00ffff0a",
              }}>
                <div style={{ fontSize: 9, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  {label}
                </div>
                {badge
                  ? <ReportBadge value={value} />
                  : <span style={{ fontSize: 12, color: "#b2ebf2", wordBreak: "break-all" }}>{value}</span>
                }
              </div>
            ))}
          </div>
          {/* ── Engine breakdown bars ── */}
          <div style={{
            background: "#0a1929", borderRadius: 10,
            padding: "14px 16px", marginBottom: 18,
            border: "1px solid #00ffff0a",
          }}>
            <div style={{ fontSize: 9, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Engine Breakdown
            </div>
            <EngineBar label="Malicious"  value={report.malicious}  total={report.total} color="#ff1744" />
            <EngineBar label="Suspicious" value={report.suspicious} total={report.total} color="#ffab00" />
            <EngineBar label="Harmless"   value={report.harmless}   total={report.total} color="#00e676" />
            <EngineBar label="Undetected" value={report.undetected} total={report.total} color="#cfd8dc" />
            <div style={{
              marginTop: 10, paddingTop: 10,
              borderTop: "1px solid #00ffff0a",
              display: "flex", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 10, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Engines</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#cfd8dc", fontFamily: "'JetBrains Mono',monospace" }}>
                {report.total ?? "—"}
              </span>
            </div>
          </div>
          {/* ── Recommendation ── */}
          {report.recommend && (
            <div style={{
              background: verdictColor + "08",
              border: `1px solid ${verdictColor}22`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              {verdictColor === "#00e676" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
              ) : verdictColor === "#ff1744" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff1744" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, animation: "beacon-pulse 1.5s infinite" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffab00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              )}
              <div>
                <div style={{ fontSize: 9, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                  Recommendation
                </div>
                <div style={{ fontSize: 12, color: "#e0f2f1", lineHeight: 1.6 }}>{report.recommend}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ─── Result card ─────────────────────────────────────────────
function ResultCard({ result }) {
  const [vis, setVis] = useState(false);
  const status = deriveStatus(result);
  const meta = STATUS_META[status];
  useEffect(() => {
    setTimeout(() => setVis(true), 60);
  }, []);
  return (
    <div style={{
      background: "linear-gradient(160deg,#0d2137ee,#08111fee)",
      border: `1px solid ${meta.color}44`,
      borderRadius: 22,
      padding: "32px 28px",
      boxShadow: `0 0 80px ${meta.glow}, 0 24px 64px #00000088`,
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(28px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
      backdropFilter: "blur(16px)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: 20,
            background: "linear-gradient(90deg,#00e5ff,#00b0ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontFamily: "'Syne',sans-serif", fontWeight: 800,
          }}>Scan Report</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#cfd8dc", fontFamily: "'JetBrains Mono',monospace" }}>
            {result.target}
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 18px", borderRadius: 999,
          fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
          color: meta.color, background: meta.glow,
          border: `1px solid ${meta.color}66`,
          boxShadow: `0 0 20px ${meta.glow}`,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: meta.color,
            boxShadow: `0 0 8px ${meta.color}`,
            animation: status === "malicious" ? "blink 1s infinite" : "none",
          }} />
          {meta.label}
        </div>
      </div>
      {/* Score bar */}
      <ScoreBar score={result.score} animate={vis} />
      {/* Engine stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Malicious",  value: result.malicious,  color: "#ff1744" },
          { label: "Suspicious", value: result.suspicious, color: "#ffab00" },
          { label: "Harmless",   value: result.harmless,   color: "#00e676" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, background: "#060f1a",
            border: `1px solid ${color}22`,
            borderRadius: 14, padding: "16px 12px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 28, fontWeight: 800, color,
              fontFamily: "'JetBrains Mono',monospace",
              marginBottom: 4,
            }}>
              <Counter value={value} />
            </div>
            <div style={{ fontSize: 9, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
      {/* Info rows */}
      <div style={{
        background: "#060f1a", borderRadius: 14,
        padding: "6px 18px", marginBottom: 20,
        border: "1px solid #00ffff1a",
      }}>
        {[
          ["Risk Level",      result.riskLevel],
          ["Detection Ratio", result.ratio],
          ["Recommendation",  result.recommendation],
        ].filter(([, v]) => v && v !== "N/A").map(([label, value]) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", gap: 16,
            padding: "11px 0",
            borderBottom: "1px solid #00ffff10",
          }}>
            <span style={{ fontSize: 10, color: "#cfd8dc", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
              {label}
            </span>
            <span style={{ fontSize: 13, color: "#e0f7fa", textAlign: "right", wordBreak: "break-word" }}>
              {value}
            </span>
          </div>
        ))}
      </div>
      {/* Raw output */}
      {result.rawOutput && <RawOutput text={result.rawOutput} />}
    </div>
  );
}
// ─── Scanning animation ───────────────────────────────────────
function ScanningIndicator({ url }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      background: "linear-gradient(160deg,#0d2137ee,#08111fee)",
      border: "1px solid #00e5ff22",
      borderRadius: 22, padding: "40px 28px",
      textAlign: "center",
      backdropFilter: "blur(16px)",
      animation: "float-up 0.5s ease forwards",
    }}>
      {/* Radar rings */}
      <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 24px" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: "1px solid #00e5ff",
            opacity: 0,
            animation: `radar-ring 2s ease-out ${i * 0.65}s infinite`,
          }} />
        ))}
        <div style={{
          position: "absolute", inset: "50%",
          transform: "translate(-50%,-50%)",
          width: 32, height: 32, borderRadius: "50%",
          background: "radial-gradient(circle,#00e5ff44,transparent)",
          border: "2px solid #00e5ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin-slow 6s linear infinite" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
      </div>
      <p style={{
        fontSize: 15, fontWeight: 700, color: "#00e5ff",
        fontFamily: "'Syne',sans-serif", marginBottom: 6,
      }}>
        Scanning{".".repeat(dots)}
      </p>
      <p style={{
        fontSize: 11, color: "#cfd8dc",
        fontFamily: "'JetBrains Mono',monospace",
        maxWidth: 280, margin: "0 auto",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {url}
      </p>
    </div>
  );
}
// ─── Page ─────────────────────────────────────────────────────
export default function UrlScanPage() {
  const [url, setUrl]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);
  const [ready, setReady]   = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    setTimeout(() => setReady(true), 60);
    inputRef.current?.focus();
  }, []);
  const handleScan = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await apiService.scanUrl(url.trim());
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleKey = (e) => {
    if (e.key === "Enter") handleScan();
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes float-up {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes scan-line {
          0%   { top:-2px; opacity:0.5; }
          100% { top:100vh; opacity:0; }
        }
        @keyframes radar-ring {
          0%   { transform:scale(0.4); opacity:0.8; }
          100% { transform:scale(2.8); opacity:0; }
        }
        @keyframes blink {
          0%,100% { opacity:1; }
          50%      { opacity:0.2; }
        }
        @keyframes input-glow {
          0%,100% { box-shadow:0 0 20px #00e5ff15; }
          50%      { box-shadow:0 0 32px #00e5ff30; }
        }
        @keyframes verdict-glow {
          0%,100% { opacity:1; }
          50%      { opacity:0.75; }
        }
        @keyframes beacon-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px #ff174488); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 8px #ff1744ff); }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#060f1a; }
        ::-webkit-scrollbar-thumb { background:#00e5ff22; border-radius:3px; }
      `}</style>
      <div style={{
        minHeight: "100vh", background: "#060f1a",
        fontFamily: "'JetBrains Mono',monospace",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grid */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(#00ffff06 1px,transparent 1px),
            linear-gradient(90deg,#00ffff06 1px,transparent 1px)
          `,
          backgroundSize: "44px 44px",
        }} />
        {/* Glow blobs */}
        <div style={{
          position: "fixed", top: -160, left: "50%",
          transform: "translateX(-50%)",
          width: 500, height: 300, borderRadius: "50%",
          background: "radial-gradient(ellipse,#00e5ff09,transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Scan line */}
        <div style={{
          position: "fixed", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg,transparent,#00e5ff44,transparent)",
          animation: "scan-line 7s linear infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 680, margin: "0 auto",
          padding: "64px 24px 80px",
        }}>
          {/* Header */}
          <div style={{
            textAlign: "center", marginBottom: 48,
            opacity: ready ? 1 : 0,
            animation: ready ? "float-up 0.6s ease forwards" : "none",
          }}>
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "radial-gradient(circle,#00e5ff18,transparent)",
              border: "1px solid #00e5ff33",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 30px #00e5ff18",
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px #00e5ff66)" }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </div>
            <h1 style={{
              fontSize: "clamp(28px,5vw,42px)", fontWeight: 800,
              background: "linear-gradient(90deg,#00e5ff,#00b0ff,#00e5ff)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: "'Syne',sans-serif", letterSpacing: "-0.02em",
              marginBottom: 10,
            }}>URL Scanner</h1>
            <p style={{ color: "#cfd8dc", fontSize: 13 }}>
              Analyse any URL for malware, phishing & threats
            </p>
          </div>
          {/* Input card */}
          <div style={{
            background: "linear-gradient(160deg,#0d2137ee,#08111fee)",
            border: "1px solid #00ffff18",
            borderRadius: 22, padding: "28px 24px",
            marginBottom: 28,
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 60px #00e5ff06",
            opacity: ready ? 1 : 0,
            animation: ready ? "float-up 0.6s ease 0.1s forwards" : "none",
          }}>
            <label style={{
              display: "block", fontSize: 10,
              color: "#00e5ffb3", textTransform: "uppercase",
              letterSpacing: "0.12em", marginBottom: 10,
            }}>
              Target URL
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                ref={inputRef}
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKey}
                placeholder="https://example.com"
                style={{
                  flex: 1,
                  background: "#060f1a",
                  border: "1px solid #00e5ff22",
                  borderRadius: 12,
                  padding: "13px 16px",
                  color: "#e0f7fa",
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono',monospace",
                  outline: "none",
                  animation: "input-glow 3s ease infinite",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#00e5ff55"}
                onBlur={e => e.target.style.borderColor = "#00e5ff22"}
              />
              <button
                onClick={handleScan}
                disabled={loading || !url.trim()}
                style={{
                  padding: "13px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: loading || !url.trim()
                    ? "#0d2137"
                    : "linear-gradient(135deg,#005f7a,#00a0c0)",
                  color: loading || !url.trim() ? "#cfd8dc" : "#fff",
                  fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.06em",
                  cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  boxShadow: loading || !url.trim() ? "none" : "0 0 20px #00e5ff33",
                }}
                onMouseEnter={e => {
                  if (!loading && url.trim()) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 0 25px #00e5ff66";
                  }
                }}
                onMouseLeave={e => {
                  if (!loading && url.trim()) {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 0 20px #00e5ff33";
                  }
                }}
              >
                {loading ? "Scanning…" : "Scan →"}
              </button>
            </div>
            {/* Example chips */}
            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: "#cfd8dc", lineHeight: "26px" }}>Try:</span>
              {["https://google.com", "https://github.com"].map(ex => (
                <button
                  key={ex}
                  onClick={() => setUrl(ex)}
                  style={{
                    padding: "4px 12px", borderRadius: 6,
                    border: "1px solid #00e5ff22",
                    background: "transparent",
                    color: "#00e5ffb3", fontSize: 10,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono',monospace",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#00e5ff88"; e.currentTarget.style.color = "#00e5ff"; e.currentTarget.style.background = "#00e5ff0d"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#00e5ff22"; e.currentTarget.style.color = "#00e5ffb3"; e.currentTarget.style.background = "transparent"; }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
          {/* States */}
          {loading && <ScanningIndicator url={url} />}
          {error && !loading && (
            <div style={{
              background: "#ff174411", border: "1px solid #ff174433",
              borderRadius: 16, padding: "20px 24px",
              color: "#ff1744d0", fontSize: 13, textAlign: "center",
              animation: "float-up 0.4s ease forwards",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 8, color: "#ff1744" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              {error}
            </div>
          )}
          {result && !loading && <ResultCard result={result} />}
        </div>
      </div>
    </>
  );
}



"use client";

import { useState, useEffect, useRef } from "react";
import { apiService } from "@/services/apiService";

const STATUS_META = {
  safe:      { label: "SAFE",      color: "#00e676", glow: "#00e67640" },
  warning:   { label: "WARNING",   color: "#ffab00", glow: "#ffab0040" },
  malicious: { label: "MALICIOUS", color: "#ff1744", glow: "#ff174440" },
};

function deriveStatus(result) {
  const m = parseInt(result.malicious ?? 0);
  const s = parseInt(result.suspicious ?? 0);
  if (m > 0) return "malicious";
  if (s > 0) return "warning";
  return "safe";
}

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

function ScoreBar({ score, animate }) {
  const match = (score ?? "").match(/(\d+)/);
  const pct = match ? parseInt(match[1]) : null;
  if (pct === null) return null;
  const color = pct >= 80 ? "#00e676" : pct >= 50 ? "#ffab00" : "#ff1744";
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#546e7a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Security Score</span>
        <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'JetBrains Mono',monospace" }}>{pct}%</span>
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
    verdict: get("VERDICT"), riskLevel: get("Risk Level"),
    score: get("Security Score"), ratio: get("Detection Ratio"),
    malicious: get("Malicious Engines"), suspicious: get("Suspicious Engines"),
    harmless: get("Harmless Engines"), undetected: get("Undetected Engines"),
    total: get("Total Engines"), scanStatus: get("Scan Status"),
    fileName: get("File Name"), recommend: get("Recommendation"),
  };
}

function ReportBadge({ value }) {
  if (!value) return null;
  const upper = value.toUpperCase();
  const color = upper.includes("SAFE") ? "#00e676" : upper.includes("MALICIOUS") ? "#ff1744" : upper.includes("LOW") ? "#00e676" : upper.includes("HIGH") ? "#ff1744" : upper.includes("MEDIUM") ? "#ffab00" : "#00e5ff";
  return (
    <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color, background: color + "18", border: `1px solid ${color}44`, boxShadow: `0 0 8px ${color}22` }}>{value}</span>
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
        <span style={{ fontSize: 10, color: "#546e7a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace" }}>{n}</span>
      </div>
      <div style={{ height: 4, background: "#0d2137", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: `linear-gradient(90deg,${color}66,${color})`, borderRadius: 999, transition: "width 0.9s cubic-bezier(.22,1,.36,1)", boxShadow: n > 0 ? `0 0 6px ${color}` : "none" }} />
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

  const verdictColor = (report.verdict ?? "").toUpperCase().includes("SAFE") ? "#00e676" : (report.verdict ?? "").toUpperCase().includes("MALICIOUS") ? "#ff1744" : "#ffab00";

  return (
    <div style={{ marginTop: 4 }}>
      <button onClick={handleOpen}
        style={{ width: "100%", padding: "11px 18px", display: "flex", alignItems: "center", gap: 10, background: open ? "#060f1a" : "transparent", border: `1px solid ${open ? "#00e5ff33" : "#00e5ff18"}`, borderRadius: open ? "14px 14px 0 0" : 14, cursor: "pointer", transition: "all 0.2s" }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = "#00e5ff33"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = "#00e5ff18"; }}
      >
        <span style={{ fontSize: 13 }}>📋</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#00e5ff77", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace", flex: 1, textAlign: "left" }}>Full Scan Report</span>
        <span style={{ fontSize: 12, color: "#00e5ff44", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", display: "inline-block" }}>▼</span>
      </button>

      {open && (
        <div style={{ background: "#030c18", border: "1px solid #00e5ff1a", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "20px 22px", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(-8px)", transition: "opacity 0.3s ease, transform 0.3s ease", fontFamily: "'JetBrains Mono',monospace" }}>
          {report.verdict && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, marginBottom: 18, background: verdictColor + "0f", border: `1px solid ${verdictColor}33` }}>
              <span style={{ fontSize: 10, color: "#546e7a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Verdict</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: verdictColor, letterSpacing: "0.15em", textShadow: `0 0 12px ${verdictColor}88`, animation: "verdict-glow 2s ease-in-out infinite" }}>{report.verdict}</span>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[{ label: "Risk Level", value: report.riskLevel, badge: true }, { label: "Security Score", value: report.score }, { label: "Detection Ratio", value: report.ratio }, { label: "File Name", value: report.fileName }].filter(r => r.value).map(({ label, value, badge }) => (
              <div key={label} style={{ background: "#0a1929", borderRadius: 10, padding: "10px 14px", border: "1px solid #00ffff0a" }}>
                <div style={{ fontSize: 9, color: "#37474f", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
                {badge ? <ReportBadge value={value} /> : <span style={{ fontSize: 12, color: "#b2ebf2", wordBreak: "break-all" }}>{value}</span>}
              </div>
            ))}
          </div>
          <div style={{ background: "#0a1929", borderRadius: 10, padding: "14px 16px", marginBottom: 18, border: "1px solid #00ffff0a" }}>
            <div style={{ fontSize: 9, color: "#37474f", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Engine Breakdown</div>
            <EngineBar label="Malicious"  value={report.malicious}  total={report.total} color="#ff1744" />
            <EngineBar label="Suspicious" value={report.suspicious} total={report.total} color="#ffab00" />
            <EngineBar label="Harmless"   value={report.harmless}   total={report.total} color="#00e676" />
            <EngineBar label="Undetected" value={report.undetected} total={report.total} color="#546e7a" />
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #00ffff0a", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "#37474f", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Engines</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#546e7a" }}>{report.total ?? "—"}</span>
            </div>
          </div>
          {report.recommend && (
            <div style={{ background: verdictColor + "08", border: `1px solid ${verdictColor}22`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{verdictColor === "#00e676" ? "✅" : verdictColor === "#ff1744" ? "🚨" : "⚠️"}</span>
              <div>
                <div style={{ fontSize: 9, color: "#37474f", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Recommendation</div>
                <div style={{ fontSize: 12, color: "#80cbc4", lineHeight: 1.6 }}>{report.recommend}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result }) {
  const [vis, setVis] = useState(false);
  const status = deriveStatus(result);
  const meta = STATUS_META[status];
  useEffect(() => { setTimeout(() => setVis(true), 60); }, []);

  return (
    <div style={{
      background: "linear-gradient(160deg,#0d2137ee,#08111fee)",
      border: `1px solid ${meta.color}44`,
      borderRadius: 22, padding: "32px 28px",
      boxShadow: `0 0 80px ${meta.glow}, 0 24px 64px #00000088`,
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(28px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
      backdropFilter: "blur(16px)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{
            margin: 0, fontSize: 20,
            background: "linear-gradient(90deg,#00e5ff,#00b0ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontFamily: "'Syne',sans-serif", fontWeight: 800,
          }}>Scan Report</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#37474f", fontFamily: "'JetBrains Mono',monospace" }}>
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
            background: meta.color, boxShadow: `0 0 8px ${meta.color}`,
            animation: status === "malicious" ? "blink 1s infinite" : "none",
          }} />
          {meta.label}
        </div>
      </div>

      <ScoreBar score={result.score} animate={vis} />

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Malicious",  value: result.malicious,  color: "#ff1744" },
          { label: "Suspicious", value: result.suspicious, color: "#ffab00" },
          { label: "Harmless",   value: result.harmless,   color: "#00e676" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, background: "#060f1a",
            border: `1px solid ${color}22`,
            borderRadius: 14, padding: "16px 12px", textAlign: "center",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
              <Counter value={value} />
            </div>
            <div style={{ fontSize: 9, color: "#546e7a", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#060f1a", borderRadius: 14, padding: "6px 18px", marginBottom: 20, border: "1px solid #00ffff0a" }}>
        {[
          ["Risk Level", result.riskLevel],
          ["Detection Ratio", result.ratio],
          ["Recommendation", result.recommendation],
        ].filter(([, v]) => v && v !== "N/A").map(([label, value]) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", gap: 16,
            padding: "11px 0", borderBottom: "1px solid #00ffff08",
          }}>
            <span style={{ fontSize: 10, color: "#546e7a", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: "#e0f7fa", textAlign: "right", wordBreak: "break-word" }}>{value}</span>
          </div>
        ))}
      </div>

      {result.rawOutput && <RawOutput text={result.rawOutput} />}
    </div>
  );
}

// ─── Drop zone ────────────────────────────────────────────────
function DropZone({ file, onFile, disabled }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${drag ? "#00e5ff88" : file ? "#00e67666" : "#00ffff22"}`,
          borderRadius: 18,
          padding: "40px 24px",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          background: drag ? "#00e5ff06" : file ? "#00e67606" : "transparent",
          transition: "all 0.25s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated corner brackets */}
        {["tl","tr","bl","br"].map(pos => (
          <div key={pos} style={{
            position: "absolute",
            top: pos.startsWith("t") ? 10 : "auto",
            bottom: pos.startsWith("b") ? 10 : "auto",
            left: pos.endsWith("l") ? 10 : "auto",
            right: pos.endsWith("r") ? 10 : "auto",
            width: 16, height: 16,
            borderTop: pos.startsWith("t") ? `2px solid ${drag ? "#00e5ff" : "#00e5ff44"}` : "none",
            borderBottom: pos.startsWith("b") ? `2px solid ${drag ? "#00e5ff" : "#00e5ff44"}` : "none",
            borderLeft: pos.endsWith("l") ? `2px solid ${drag ? "#00e5ff" : "#00e5ff44"}` : "none",
            borderRight: pos.endsWith("r") ? `2px solid ${drag ? "#00e5ff" : "#00e5ff44"}` : "none",
            transition: "border-color 0.3s",
          }} />
        ))}

        {file ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
            <p style={{ color: "#00e676", fontWeight: 700, fontSize: 14, marginBottom: 4, fontFamily: "'Syne',sans-serif" }}>
              {file.name}
            </p>
            <p style={{ color: "#546e7a", fontSize: 11 }}>{formatSize(file.size)}</p>
            <p style={{ color: "#00e5ff44", fontSize: 10, marginTop: 8 }}>Click to change file</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: drag ? 1 : 0.6 }}>📁</div>
            <p style={{ color: drag ? "#00e5ff" : "#546e7a", fontSize: 14, fontWeight: 600, marginBottom: 6, transition: "color 0.2s" }}>
              {drag ? "Drop it!" : "Drag & drop a file here"}
            </p>
            <p style={{ color: "#37474f", fontSize: 11 }}>or click to browse</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}

function ScanningIndicator({ fileName }) {
  const [dots, setDots] = useState(0);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t1 = setInterval(() => setDots(d => (d + 1) % 4), 400);
    const t2 = setInterval(() => setPct(p => Math.min(p + Math.random() * 8, 92)), 300);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <div style={{
      background: "linear-gradient(160deg,#0d2137ee,#08111fee)",
      border: "1px solid #00e5ff22", borderRadius: 22,
      padding: "36px 28px", textAlign: "center",
      backdropFilter: "blur(16px)",
      animation: "float-up 0.5s ease forwards",
    }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>🔬</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#00e5ff", fontFamily: "'Syne',sans-serif", marginBottom: 6 }}>
        Analysing{".".repeat(dots)}
      </p>
      <p style={{ fontSize: 11, color: "#546e7a", fontFamily: "'JetBrains Mono',monospace", marginBottom: 20 }}>
        {fileName}
      </p>
      {/* Fake progress bar */}
      <div style={{ height: 4, background: "#0d2137", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg,#00e5ff88,#00e5ff)",
          borderRadius: 999,
          transition: "width 0.3s ease",
          boxShadow: "0 0 10px #00e5ff",
        }} />
      </div>
      <p style={{ fontSize: 10, color: "#37474f", marginTop: 8, fontFamily: "'JetBrains Mono',monospace" }}>
        {Math.round(pct)}% complete
      </p>
    </div>
  );
}

export default function FileScanPage() {
  const [file, setFile]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);
  const [ready, setReady]   = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await apiService.scanFile(file);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewScan = () => {
    setFile(null);
    setResult(null);
    setError(null);
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
        @keyframes blink {
          0%,100% { opacity:1; }
          50%      { opacity:0.2; }
        }
        @keyframes verdict-glow {
          0%,100% { opacity:1; }
          50%      { opacity:0.75; }
        }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:#060f1a; }
        ::-webkit-scrollbar-thumb { background:#00e5ff22; border-radius:3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#060f1a", fontFamily: "'JetBrains Mono',monospace", position: "relative", overflow: "hidden" }}>
        {/* Grid */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(#00ffff06 1px,transparent 1px),linear-gradient(90deg,#00ffff06 1px,transparent 1px)`,
          backgroundSize: "44px 44px",
        }} />
        <div style={{
          position: "fixed", top: -160, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 300, borderRadius: "50%",
          background: "radial-gradient(ellipse,#00e5ff09,transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg,transparent,#00e5ff44,transparent)",
          animation: "scan-line 7s linear infinite", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "64px 24px 80px" }}>

          {/* Header */}
          <div style={{
            textAlign: "center", marginBottom: 48,
            opacity: ready ? 1 : 0,
            animation: ready ? "float-up 0.6s ease forwards" : "none",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "radial-gradient(circle,#00e5ff18,transparent)",
              border: "1px solid #00e5ff33",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, margin: "0 auto 20px",
              boxShadow: "0 0 30px #00e5ff18",
            }}>📄</div>
            <h1 style={{
              fontSize: "clamp(28px,5vw,42px)", fontWeight: 800,
              background: "linear-gradient(90deg,#00e5ff,#00b0ff,#00e5ff)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: "'Syne',sans-serif", letterSpacing: "-0.02em", marginBottom: 10,
            }}>File Scanner</h1>
            <p style={{ color: "#37474f", fontSize: 13 }}>Upload any file to check for malware & threats</p>
          </div>

          {/* Upload card */}
          {!result && !loading && (
            <div style={{
              background: "linear-gradient(160deg,#0d2137ee,#08111fee)",
              border: "1px solid #00ffff18", borderRadius: 22,
              padding: "28px 24px", marginBottom: 28,
              backdropFilter: "blur(16px)",
              boxShadow: "0 0 60px #00e5ff06",
              opacity: ready ? 1 : 0,
              animation: ready ? "float-up 0.6s ease 0.1s forwards" : "none",
            }}>
              <DropZone file={file} onFile={setFile} disabled={loading} />

              {file && (
                <button
                  onClick={handleScan}
                  style={{
                    marginTop: 20, width: "100%",
                    padding: "14px 0", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg,#005f7a,#00a0c0)",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    letterSpacing: "0.06em", cursor: "pointer",
                    boxShadow: "0 0 24px #00e5ff33",
                    transition: "all 0.2s",
                    fontFamily: "'Syne',sans-serif",
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 36px #00e5ff55"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 24px #00e5ff33"}
                >
                  Scan File →
                </button>
              )}
            </div>
          )}

          {loading && <ScanningIndicator fileName={file?.name ?? ""} />}

          {error && !loading && (
            <div style={{
              background: "#ff174411", border: "1px solid #ff174433",
              borderRadius: 16, padding: "20px 24px",
              color: "#ff1744aa", fontSize: 13, textAlign: "center",
              animation: "float-up 0.4s ease forwards",
            }}>
              ⚠ {error}
              <br />
              <button onClick={handleNewScan} style={{
                marginTop: 12, padding: "8px 20px", borderRadius: 8,
                border: "1px solid #ff174433", background: "transparent",
                color: "#ff1744aa", fontSize: 11, cursor: "pointer",
              }}>Try Again</button>
            </div>
          )}

          {result && !loading && (
            <>
              <ResultCard result={result} />
              <button
                onClick={handleNewScan}
                style={{
                  marginTop: 16, width: "100%",
                  padding: "12px 0", borderRadius: 12,
                  border: "1px solid #00e5ff22",
                  background: "transparent",
                  color: "#00e5ff66", fontSize: 12,
                  fontWeight: 700, letterSpacing: "0.06em",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#00e5ff0d"; e.currentTarget.style.color = "#00e5ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#00e5ff66"; }}
              >
                ← Scan Another File
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
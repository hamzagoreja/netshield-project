"use client";

import { useEffect, useState } from "react";
import { apiService } from "@/services/apiService";

// ─── Status helpers ───────────────────────────────────────────
const STATUS_META = {
  safe:      { label: "SAFE",      color: "#00e676", glow: "#00e67640" },
  warning:   { label: "WARNING",   color: "#ffab00", glow: "#ffab0040" },
  malicious: { label: "MALICIOUS", color: "#ff1744", glow: "#ff174440" },
};

function deriveStatus(item) {
  const raw = item.rawOutput ?? item.result ?? item.scanResult ?? item.output ?? "";

  // 1. Parse engine counts directly from raw Spring text — most reliable
  if (raw) {
    const maliciousMatch = raw.match(/Malicious Engines\s*[:|=]\s*(\d+)/i);
    const suspiciousMatch = raw.match(/Suspicious Engines\s*[:|=]\s*(\d+)/i);
    const m = maliciousMatch ? parseInt(maliciousMatch[1]) : -1;
    const s = suspiciousMatch ? parseInt(suspiciousMatch[1]) : -1;

    // Only use these values if we actually found them in the text
    if (m >= 0 || s >= 0) {
      if (m > 0) return "malicious";
      if (s > 0) return "warning";
      return "safe";
    }

    // Fallback: check VERDICT line
    if (/VERDICT\s*[:|=]\s*SAFE/i.test(raw)) return "safe";
    if (/VERDICT\s*[:|=]\s*MALICIOUS/i.test(raw)) return "malicious";
    if (/VERDICT\s*[:|=]\s*WARNING/i.test(raw)) return "warning";
  }

  // 2. Numeric fields on the item itself (from already-parsed data)
  const m = parseInt(item.maliciousEngines ?? item.malicious ?? item._parsed?.malicious ?? -1);
  const s = parseInt(item.suspiciousEngines ?? item.suspicious ?? item._parsed?.suspicious ?? -1);
  if (m >= 0 || s >= 0) {
    if (m > 0) return "malicious";
    if (s > 0) return "warning";
    return "safe";
  }

  // 3. Last resort: stored status string (least trusted — backend bug can corrupt this)
  if (item.status) {
    const st = item.status.toLowerCase();
    if (st === "malicious") return "malicious";
    if (st === "warning" || st === "suspicious") return "warning";
    if (st === "safe") return "safe";
  }

  return "safe";
}

// Parse the raw Spring text format into structured fields
function parseRawText(raw) {
  if (!raw) return {};
  const get = (label) => {
    const m = raw.match(new RegExp(`${label}\\s*[:|=]\\s*(.+)`, "i"));
    return m ? m[1].trim() : null;
  };
  return {
    verdict:        get("VERDICT"),
    riskLevel:      get("Risk Level"),
    scanStatus:     get("Scan Status"),
    malicious:      get("Malicious Engines"),
    suspicious:     get("Suspicious Engines"),
    harmless:       get("Harmless Engines"),
    undetected:     get("Undetected Engines"),
    total:          get("Total Engines"),
    ratio:          get("Detection Ratio"),
    score:          get("Security Score"),
    recommendation: get("Recommendation"),
    fileName:       get("File Name"),
  };
}

// Normalise a history record — handles whatever key names the backend sends
function normalise(item) {
  const raw = item.rawOutput ?? item.result ?? item.scanResult ?? item.output ?? "";
  const parsed = parseRawText(raw);

  // target: try many possible keys
  const target =
    item.target ?? item.url ?? item.fileName ?? item.filename ??
    item.name ?? parsed.fileName ?? "—";

  // type: try many possible keys
  const type =
    item.type ?? item.scanType ?? item.scan_type ?? item.ScanType ?? "—";

  // date: try many possible keys
  const dateRaw =
    item.date ?? item.scannedAt ?? item.scanDate ?? item.createdAt ??
    item.timestamp ?? item.created_at ?? null;

  const date = dateRaw
    ? new Date(dateRaw).toLocaleDateString("en-CA")   // yyyy-mm-dd
    : "—";

  return {
    ...item,
    _target: target,
    _type:   type,
    _date:   date,
    _parsed: parsed,
    _raw:    raw,
    _status: deriveStatus({ ...item, ...parsed }),
  };
}

// ─── Animated number counter ──────────────────────────────────
function Counter({ value, duration = 900 }) {
  const n = parseInt(value) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (n === 0) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.floor(progress * n));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [n, duration]);

  return <>{n === 0 ? "0" : display}</>;
}

// ─── Stat chip ────────────────────────────────────────────────
function StatChip({ label, value, color }) {
  return (
    <div style={{
      background: "#0d2137",
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: "14px 18px",
      textAlign: "center",
      boxShadow: `0 0 20px ${color}15`,
      flex: 1,
      minWidth: 90,
    }}>
      <div style={{
        fontSize: 26, fontWeight: 800,
        color, fontFamily: "'JetBrains Mono', monospace",
        marginBottom: 4,
      }}>
        <Counter value={value} />
      </div>
      <div style={{
        fontSize: 10, color: "#546e7a",
        textTransform: "uppercase", letterSpacing: "0.1em",
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────
function InfoRow({ label, value, mono }) {
  if (!value || value === "N/A" || value === "null") return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "11px 0",
      borderBottom: "1px solid #00ffff09",
      gap: 16,
    }}>
      <span style={{
        fontSize: 11, color: "#546e7a",
        textTransform: "uppercase", letterSpacing: "0.08em",
        flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontSize: 13,
        color: "#e0f7fa",
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
        textAlign: "right",
        wordBreak: "break-word",
      }}>{value}</span>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────
function ReportModal({ item, onClose }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setOpen(true), 10);
    const esc = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 280);
  };

  const meta = STATUS_META[item._status] ?? STATUS_META.safe;
  const p = item._parsed;

  // gauge: security score percentage
  const scoreMatch = (p.score ?? "").match(/(\d+)/);
  const scorePct = scoreMatch ? parseInt(scoreMatch[1]) : null;
  const gaugeColor =
    scorePct >= 80 ? "#00e676" :
    scorePct >= 50 ? "#ffab00" : "#ff1744";

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0,
        background: "#000000cc",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
        opacity: open ? 1 : 0,
        transition: "opacity 0.28s ease",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg,#0d2137,#08111f)",
          border: `1px solid ${meta.color}44`,
          borderRadius: 24,
          width: "min(600px,100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: `0 0 80px ${meta.glow}, 0 32px 80px #000a`,
          transform: open
            ? "scale(1) translateY(0)"
            : "scale(0.93) translateY(24px)",
          transition: "transform 0.32s cubic-bezier(.22,1,.36,1)",
          padding: "32px 28px",
        }}
      >
        {/* ── Modal header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{
              margin: 0, fontSize: 22,
              background: "linear-gradient(90deg,#00e5ff,#00b0ff)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
            }}>Scan Report</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#37474f" }}>
              {item._date}  ·  {item._type !== "—" ? item._type : "Scan"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              padding: "5px 16px", borderRadius: 999,
              fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
              color: meta.color, background: meta.glow,
              border: `1px solid ${meta.color}66`,
              boxShadow: `0 0 16px ${meta.glow}`,
              animation: "pulse-badge 2s infinite",
            }}>{meta.label}</span>
            <button onClick={handleClose} style={{
              background: "none", border: "1px solid #00ffff22",
              borderRadius: 8, color: "#546e7a", fontSize: 18,
              cursor: "pointer", lineHeight: 1, padding: "2px 8px",
            }}>×</button>
          </div>
        </div>

        {/* ── Security score gauge ── */}
        {scorePct !== null && (
          <div style={{
            background: "#060f1a", borderRadius: 16,
            padding: "20px 24px", marginBottom: 20,
            border: "1px solid #00ffff11",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "#546e7a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Security Score
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: gaugeColor, fontFamily: "'JetBrains Mono',monospace" }}>
                {scorePct}%
              </span>
            </div>
            <div style={{ height: 8, background: "#0d2137", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: open ? `${scorePct}%` : "0%",
                background: `linear-gradient(90deg,${gaugeColor}88,${gaugeColor})`,
                borderRadius: 999,
                transition: "width 1.1s cubic-bezier(.22,1,.36,1) 0.2s",
                boxShadow: `0 0 10px ${gaugeColor}`,
              }} />
            </div>
          </div>
        )}

        {/* ── Engine stats ── */}
        {(p.malicious || p.suspicious || p.harmless) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <StatChip label="Malicious"  value={p.malicious}  color="#ff1744" />
            <StatChip label="Suspicious" value={p.suspicious} color="#ffab00" />
            <StatChip label="Harmless"   value={p.harmless}   color="#00e676" />
            {p.total && <StatChip label="Total"   value={p.total}   color="#546e7a" />}
          </div>
        )}

        {/* ── Info fields ── */}
        <div style={{
          background: "#060f1a", borderRadius: 16,
          padding: "8px 20px", marginBottom: 20,
          border: "1px solid #00ffff0a",
        }}>
          <InfoRow label="Target"          value={item._target}       mono />
          <InfoRow label="Type"            value={item._type}               />
          <InfoRow label="Date"            value={item._date}               />
          <InfoRow label="Risk Level"      value={p.riskLevel}              />
          <InfoRow label="Detection Ratio" value={p.ratio}            mono  />
          <InfoRow label="Scan Status"     value={p.scanStatus}             />
          <InfoRow label="File Name"       value={p.fileName}         mono  />
        </div>

        {/* ── Recommendation ── */}
        {p.recommendation && (
          <div style={{
            background: `${meta.color}0f`,
            border: `1px solid ${meta.color}33`,
            borderRadius: 14, padding: "14px 18px",
            marginBottom: 20,
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>
              {item._status === "safe" ? "✅" : item._status === "warning" ? "⚠️" : "🚨"}
            </span>
            <div>
              <div style={{ fontSize: 10, color: "#546e7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Recommendation
              </div>
              <div style={{ fontSize: 13, color: "#e0f7fa" }}>{p.recommendation}</div>
            </div>
          </div>
        )}

        {/* ── Raw output collapsible ── */}
        {item._raw && (
          <details style={{ marginBottom: 20 }}>
            <summary style={{
              cursor: "pointer", color: "#00e5ff55", fontSize: 11,
              fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", listStyle: "none",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>▶</span> Raw Output
            </summary>
            <pre style={{
              marginTop: 10, padding: 16,
              background: "#060f1a",
              borderRadius: 12,
              fontSize: 11, color: "#80cbc4",
              overflowX: "auto", overflowY: "auto",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              maxHeight: 200,
              border: "1px solid #00ffff0f",
              fontFamily: "'JetBrains Mono',monospace",
            }}>
              {item._raw}
            </pre>
          </details>
        )}

        <button
          onClick={handleClose}
          style={{
            width: "100%", padding: "11px 0",
            borderRadius: 12,
            border: "1px solid #00e5ff22",
            background: "transparent",
            color: "#00e5ff88",
            fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#00e5ff11";
            e.currentTarget.style.color = "#00e5ff";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#00e5ff88";
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Table Row ────────────────────────────────────────────────
function HistoryRow({ item, index, onView }) {
  const [vis, setVis] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVis(true), 100 + index * 65);
    return () => clearTimeout(t);
  }, [index]);

  const meta = STATUS_META[item._status] ?? STATUS_META.safe;

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateX(0)" : "translateX(-20px)",
        transition: "opacity 0.45s ease, transform 0.45s ease, background 0.2s",
        background: hover ? "#00e5ff08" : "transparent",
        borderBottom: "1px solid #00ffff0c",
        cursor: "default",
      }}
    >
      {/* Target */}
      <td style={tdStyle}>
        <span title={item._target} style={{
          display: "block", maxWidth: 320,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: "#b2ebf2",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 12.5,
        }}>
          {item._target}
        </span>
      </td>

      {/* Type */}
      <td style={tdStyle}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          color: "#00e5ff77", textTransform: "uppercase",
          background: "#00e5ff0d", borderRadius: 6,
          padding: "3px 8px",
          border: "1px solid #00e5ff1a",
          whiteSpace: "nowrap",
        }}>
          {item._type !== "—" ? item._type : "SCAN"}
        </span>
      </td>

      {/* Date */}
      <td style={tdStyle}>
        <span style={{
          fontSize: 12.5, color: "#546e7a",
          fontFamily: "'JetBrains Mono',monospace",
        }}>
          {item._date}
        </span>
      </td>

      {/* Status */}
      <td style={tdStyle}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 999,
          fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
          color: meta.color,
          background: meta.glow,
          border: `1px solid ${meta.color}55`,
          boxShadow: hover ? `0 0 16px ${meta.glow}` : "none",
          transition: "box-shadow 0.3s",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: meta.color,
            boxShadow: `0 0 6px ${meta.color}`,
            animation: item._status === "malicious" ? "blink 1s infinite" : "none",
          }} />
          {meta.label}
        </span>
      </td>

      {/* Action */}
      <td style={tdStyle}>
        <button
          onClick={() => onView(item)}
          style={{
            padding: "7px 18px", borderRadius: 9,
            border: "1px solid #00e5ff33",
            background: hover
              ? "linear-gradient(135deg,#005f7a,#0090a8)"
              : "linear-gradient(135deg,#002d42,#004d65)",
            color: "#00e5ff",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: hover ? "0 0 16px #00e5ff33" : "none",
            whiteSpace: "nowrap",
          }}
        >
          View Report
        </button>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function HistoryPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiService.getHistory();
        const arr = Array.isArray(data) ? data : [];
        setRows(arr.map(normalise));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setTimeout(() => setReady(true), 60);
      }
    })();
  }, []);

  const safeCount      = rows.filter(r => r._status === "safe").length;
  const warningCount   = rows.filter(r => r._status === "warning").length;
  const maliciousCount = rows.filter(r => r._status === "malicious").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

        @keyframes scan-line {
          0%   { top: -2px; opacity: 0.6; }
          100% { top: 100vh; opacity: 0; }
        }
        @keyframes pulse-badge {
          0%,100% { box-shadow: 0 0 8px var(--glow); }
          50%      { box-shadow: 0 0 20px var(--glow); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.2; }
        }
        @keyframes float-up {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060f1a; }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #060f1a; }
        ::-webkit-scrollbar-thumb { background: #00e5ff22; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #00e5ff44; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#060f1a",
        fontFamily: "'Space Grotesk',sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Grid background */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(#00ffff06 1px, transparent 1px),
            linear-gradient(90deg, #00ffff06 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
        }} />

        {/* Corner glow */}
        <div style={{
          position: "fixed", top: -120, right: -120,
          width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle,#00e5ff0a,transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "fixed", bottom: -100, left: -100,
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle,#00b0ff08,transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Scan line */}
        <div style={{
          position: "fixed", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg,transparent,#00e5ff55,transparent)",
          animation: "scan-line 7s linear infinite",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Content */}
        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 1080, margin: "0 auto",
          padding: "56px 24px 80px",
        }}>

          {/* ── Header ── */}
          <div style={{
            textAlign: "center", marginBottom: 40,
            opacity: ready ? 1 : 0,
            animation: ready ? "float-up 0.6s ease forwards" : "none",
          }}>
            <h1 style={{
              fontSize: "clamp(30px,5vw,46px)",
              fontWeight: 700,
              background: "linear-gradient(90deg,#00e5ff 0%,#00b0ff 50%,#00e5ff 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.015em",
              marginBottom: 8,
            }}>
              Scan History
            </h1>
            <p style={{ color: "#37474f", fontSize: 14 }}>
              All previously scanned targets and their results
            </p>
          </div>

          {/* ── Summary chips ── */}
          {!loading && !error && rows.length > 0 && (
            <div style={{
              display: "flex", gap: 12, justifyContent: "center",
              marginBottom: 32, flexWrap: "wrap",
              opacity: ready ? 1 : 0,
              animation: ready ? "float-up 0.6s ease 0.15s forwards" : "none",
            }}>
              {[
                { label: "Total",     value: rows.length,    color: "#00e5ff" },
                { label: "Safe",      value: safeCount,      color: "#00e676" },
                { label: "Warning",   value: warningCount,   color: "#ffab00" },
                { label: "Malicious", value: maliciousCount, color: "#ff1744" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: "10px 24px", borderRadius: 12,
                  background: `${color}0d`,
                  border: `1px solid ${color}33`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{
                    fontSize: 20, fontWeight: 800, color,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}>{value}</span>
                  <span style={{ fontSize: 11, color: "#546e7a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Table card ── */}
          <div style={{
            background: "linear-gradient(160deg,#0d213799,#08111fcc)",
            borderRadius: 22,
            border: "1px solid #00ffff18",
            boxShadow: "0 0 100px #00e5ff06, 0 32px 80px #00000077",
            overflow: "hidden",
            backdropFilter: "blur(16px)",
            opacity: ready ? 1 : 0,
            animation: ready ? "float-up 0.65s ease 0.25s forwards" : "none",
          }}>

            {loading && (
              <div style={{ padding: 80, textAlign: "center" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  border: "2px solid #00e5ff22",
                  borderTop: "2px solid #00e5ff",
                  margin: "0 auto 16px",
                  animation: "spin 0.75s linear infinite",
                }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ color: "#546e7a", fontSize: 13 }}>Loading history…</p>
              </div>
            )}

            {error && (
              <div style={{ padding: 80, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                <p style={{ color: "#ff1744aa", fontSize: 14 }}>{error}</p>
              </div>
            )}

            {!loading && !error && rows.length === 0 && (
              <div style={{ padding: 80, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
                <p style={{ color: "#546e7a", fontSize: 14 }}>No scan history yet.</p>
              </div>
            )}

            {!loading && !error && rows.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
                  <thead>
                    <tr style={{
                      background: "linear-gradient(90deg,#0a192900,#0a1929,#0a192900)",
                      borderBottom: "1px solid #00ffff13",
                    }}>
                      {[
                        { label: "Target",  width: "38%" },
                        { label: "Type",    width: "14%" },
                        { label: "Date",    width: "16%" },
                        { label: "Status",  width: "16%" },
                        { label: "Action",  width: "16%" },
                      ].map(({ label, width }) => (
                        <th key={label} style={{
                          padding: "16px 20px",
                          textAlign: "left",
                          fontSize: 10, fontWeight: 700,
                          letterSpacing: "0.12em",
                          color: "#00e5ff44",
                          textTransform: "uppercase",
                          width,
                        }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, i) => (
                      <HistoryRow
                        key={item.id ?? i}
                        item={item}
                        index={i}
                        onView={setSelected}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Record count */}
          {!loading && !error && rows.length > 0 && (
            <p style={{
              textAlign: "center", marginTop: 18,
              color: "#263238", fontSize: 11,
            }}>
              {rows.length} record{rows.length !== 1 ? "s" : ""} in history
            </p>
          )}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <ReportModal item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

const tdStyle = { padding: "14px 20px", verticalAlign: "middle" };
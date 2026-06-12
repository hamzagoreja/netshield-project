"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
// ─── Particle field ───────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    // Generate particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,229,255,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      // Draw particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0,
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}
// ─── Hex grid background ──────────────────────────────────────
function HexGrid() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage: `
        linear-gradient(#00e5ff07 1px, transparent 1px),
        linear-gradient(90deg, #00e5ff07 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
    }} />
  );
}
// ─── Animated shield logo ─────────────────────────────────────
function ShieldLogo({ ready }) {
  return (
    <div style={{
      position: "relative",
      width: 120, height: 120,
      margin: "0 auto 32px",
      opacity: ready ? 1 : 0,
      transform: ready ? "scale(1) translateY(0)" : "scale(0.6) translateY(20px)",
      transition: "opacity 0.8s ease, transform 0.8s cubic-bezier(.22,1,.36,1)",
    }}>
      {/* Outer pulse rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute",
          inset: -(i * 18),
          borderRadius: "50%",
          border: "1px solid #00e5ff",
          opacity: 0,
          animation: `shield-ring 3s ease-out ${i * 0.9}s infinite`,
        }} />
      ))}
      {/* Rotating dashes ring */}
      <div style={{
        position: "absolute", inset: -8,
        borderRadius: "50%",
        border: "1px dashed #00e5ff33",
        animation: "spin-slow 12s linear infinite",
      }} />
      <div style={{
        position: "absolute", inset: -16,
        borderRadius: "50%",
        border: "1px dashed #00e5ff1a",
        animation: "spin-slow 20s linear infinite reverse",
      }} />
      {/* Main circle */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 35%, #0d3d52, #060f1a)",
        border: "2px solid #00e5ff66",
        boxShadow: `
          0 0 30px #00e5ff44,
          0 0 60px #00e5ff22,
          inset 0 0 30px #00e5ff11
        `,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 12px #00e5ff88)", animation: "logo-pulse 3s ease-in-out infinite" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v8" /><path d="M9 11h6" /></svg>
      </div>
    </div>
  );
}
// ─── Glitching title ──────────────────────────────────────────
function GlitchTitle({ ready }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const trigger = () => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    };
    // Random glitch bursts
    const schedule = () => {
      const delay = 3000 + Math.random() * 5000;
      return setTimeout(() => { trigger(); schedule(); }, delay);
    };
    const t = setTimeout(() => schedule(), 2000);
    return () => clearTimeout(t);
  }, [ready]);
  return (
    <div style={{
      position: "relative",
      opacity: ready ? 1 : 0,
      transform: ready ? "translateY(0)" : "translateY(24px)",
      transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
      marginBottom: 14,
    }}>
      {/* Glitch layers */}
      {glitch && (
        <>
          <h1 style={{
            position: "absolute", inset: 0,
            fontSize: "clamp(52px,10vw,96px)",
            fontWeight: 900,
            fontFamily: "'Orbitron',sans-serif",
            color: "#ff1744",
            letterSpacing: "0.12em",
            transform: "translate(-3px, 1px)",
            opacity: 0.7,
            margin: 0,
            WebkitTextStroke: "1px #ff1744",
          }}>NETSHIELD</h1>
          <h1 style={{
            position: "absolute", inset: 0,
            fontSize: "clamp(52px,10vw,96px)",
            fontWeight: 900,
            fontFamily: "'Orbitron',sans-serif",
            color: "#00e5ff",
            letterSpacing: "0.12em",
            transform: "translate(3px, -1px)",
            opacity: 0.7,
            margin: 0,
          }}>NETSHIELD</h1>
        </>
      )}
      <h1 style={{
        position: "relative",
        fontSize: "clamp(52px,10vw,96px)",
        fontWeight: 900,
        fontFamily: "'Orbitron',sans-serif",
        margin: 0,
        letterSpacing: "0.12em",
        background: "linear-gradient(180deg, #ffffff 0%, #00e5ff 50%, #0090a8 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: `drop-shadow(0 0 ${glitch ? "20px" : "12px"} #00e5ff99)`,
        transition: "filter 0.1s",
      }}>
        NETSHIELD
      </h1>
    </div>
  );
}
// ─── Typewriter subtitle ──────────────────────────────────────
function Typewriter({ text, delay = 0 }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted]     = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 38);
    return () => clearInterval(interval);
  }, [started, text]);
  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span style={{
          display: "inline-block", width: 2, height: "1em",
          background: "#00e5ff", marginLeft: 2, verticalAlign: "middle",
          animation: "cursor-blink 0.8s infinite",
        }} />
      )}
    </span>
  );
}
// ─── Nav button ───────────────────────────────────────────────
function NavButton({ href, icon, label, desc, delay, ready }) {
  const [hover, setHover] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: "relative",
          padding: "18px 28px",
          borderRadius: 14,
          border: `1px solid ${hover ? "#00e5ff66" : "#00e5ff22"}`,
          background: hover
            ? "linear-gradient(135deg,#003d5b,#005f7a)"
            : "linear-gradient(135deg,#0a192966,#0d213766)",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          transition: "all 0.25s ease",
          transform: hover ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hover
            ? "0 0 30px #00e5ff33, 0 12px 40px #00000077"
            : "0 0 0 transparent, 0 4px 20px #00000055",
          minWidth: 150,
          textAlign: "center",
          opacity: ready ? 1 : 0,
          animation: ready ? `nav-in 0.6s ease ${delay}s forwards` : "none",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
          background: `linear-gradient(90deg,transparent,${hover ? "#00e5ff99" : "#00e5ff33"},transparent)`,
          transition: "all 0.25s",
        }} />
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          height: 24, marginBottom: 8, color: hover ? "#00e5ff" : "#b2ebf2",
          transition: "color 0.25s ease"
        }}>{icon}</div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: hover ? "#00e5ff" : "#b2ebf2",
          fontFamily: "'Orbitron',sans-serif",
          letterSpacing: "0.08em",
          transition: "color 0.2s",
          marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 10, color: hover ? "#90a4ae" : "#607d8b",
          fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: "0.05em",
          transition: "color 0.2s",
        }}>
          {desc}
        </div>
      </div>
    </Link>
  );
}
// ─── Scanning status ticker ───────────────────────────────────
function StatusTicker({ ready }) {
  const messages = [
    "[ SYSTEM ONLINE ]",
    "[ THREAT DB UPDATED ]",
    "[ 91 ENGINES ACTIVE ]",
    "[ ZERO-DAY PROTECTION: ON ]",
    "[ REAL-TIME SCANNING READY ]",
  ];
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % messages.length);
        setFade(true);
      }, 400);
    }, 2800);
    return () => clearInterval(t);
  }, [ready]);
  return (
    <div style={{
      marginTop: 40,
      opacity: ready ? (fade ? 0.6 : 0) : 0,
      transition: "opacity 0.4s ease",
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: 11,
      color: "#00e5ff",
      letterSpacing: "0.15em",
    }}>
      {messages[idx]}
    </div>
  );
}
// ─── Page ─────────────────────────────────────────────────────
export default function HomePage() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setTimeout(() => setReady(true), 100);
  }, []);
  const navItems = [
    {
      href: "/scans/url",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
      label: "URL SCAN",
      desc: "Analyse links"
    },
    {
      href: "/scans/file",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
      label: "FILE SCAN",
      desc: "Check documents"
    },
    {
      href: "/scans/image",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
      label: "IMAGE SCAN",
      desc: "Inspect images"
    },
    {
      href: "/history",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
      label: "HISTORY",
      desc: "Past results"
    },
  ];
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes shield-ring {
          0%   { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.0); opacity: 0; }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        @keyframes cursor-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes nav-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan-sweep {
          0%   { top: -2px; opacity: 0.6; }
          100% { top: 100vh; opacity: 0; }
        }
        @keyframes corner-pulse {
          0%,100% { opacity: 0.3; }
          50%      { opacity: 0.8; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes logo-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px #00e5ff88); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 20px #00e5ffff); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #060f1a; }
        ::-webkit-scrollbar-thumb { background: #00e5ff22; border-radius: 3px; }
      `}</style>
      <div style={{
        minHeight: "100vh",
        background: "#060f1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono',monospace",
      }}>
        {/* Layers */}
        <HexGrid />
        <ParticleField />
        {/* Sweep line */}
        <div style={{
          position: "fixed", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg,transparent,#00e5ff55,transparent)",
          animation: "scan-sweep 8s linear infinite",
          pointerEvents: "none", zIndex: 1,
        }} />
        {/* Corner brackets */}
        {[
          { top: 20, left: 20,   borderTop: true,  borderLeft: true  },
          { top: 20, right: 20,  borderTop: true,  borderRight: true },
          { bottom: 20, left: 20,  borderBottom: true, borderLeft: true  },
          { bottom: 20, right: 20, borderBottom: true, borderRight: true },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "fixed",
            ...pos,
            width: 40, height: 40,
            borderTop:    pos.borderTop    ? "1px solid #00e5ff55" : "none",
            borderBottom: pos.borderBottom ? "1px solid #00e5ff55" : "none",
            borderLeft:   pos.borderLeft   ? "1px solid #00e5ff55" : "none",
            borderRight:  pos.borderRight  ? "1px solid #00e5ff55" : "none",
            pointerEvents: "none", zIndex: 1,
            animation: "corner-pulse 3s ease infinite",
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}
        {/* Radial glow behind logo */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%,-60%)",
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle,#00e5ff0d 0%,transparent 70%)",
          pointerEvents: "none", zIndex: 0,
          animation: "float 6s ease-in-out infinite",
        }} />
        {/* Main content */}
        <div style={{
          position: "relative", zIndex: 2,
          textAlign: "center",
          padding: "0 24px",
        }}>
          {/* Shield */}
          <div style={{ animation: ready ? "float 6s ease-in-out infinite" : "none" }}>
            <ShieldLogo ready={ready} />
          </div>
          {/* Title */}
          <GlitchTitle ready={ready} />
          {/* Subtitle */}
          <p style={{
            fontSize: "clamp(12px,1.5vw,15px)",
            color: "#90a4ae",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 56,
            fontFamily: "'JetBrains Mono',monospace",
            opacity: ready ? 1 : 0,
            transition: "opacity 0.6s ease 0.5s",
          }}>
            <Typewriter
              text="Advanced Cybersecurity Threat Intelligence Platform"
              delay={900}
            />
          </p>
          {/* Nav buttons */}
          <div style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {navItems.map((item, i) => (
              <NavButton
                key={item.href}
                {...item}
                delay={0.7 + i * 0.1}
                ready={ready}
              />
            ))}
          </div>
          {/* Status ticker */}
          <StatusTicker ready={ready} />
        </div>
        {/* Bottom version tag */}
        <div style={{
          position: "fixed", bottom: 20,
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9, color: "#455a64",
          letterSpacing: "0.15em",
          opacity: ready ? 1 : 0,
          transition: "opacity 1s ease 1.5s",
          zIndex: 2,
        }}>
          NETSHIELD v1.0 · POWERED BY VIRUSTOTAL
        </div>
      </div>
    </>
  );
}
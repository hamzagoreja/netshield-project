"use client";

import Link from "next/link";

export default function Hero() {

  return (

    <section className="hero">

      <div className="grid-bg"></div>

      <div className="hero-content">

        <div className="logo-circle">
          🛡️
        </div>

        <h1 className="hero-title">
          NETSHIELD
        </h1>

        <p className="hero-subtitle">
          Web-Based Cybersecurity Scanner
        </p>

        <div className="hero-buttons">

          <Link href="/scans/url">
            <button className="hero-btn">
              Scan URL
            </button>
          </Link>

          <Link href="/scans/file">
            <button className="hero-btn">
              Scan File
            </button>
          </Link>

          <Link href="/scans/image">
            <button className="hero-btn">
              Scan Image
            </button>
          </Link>

        </div>

      </div>

    </section>

  );
}
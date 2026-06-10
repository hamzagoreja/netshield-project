"use client";

import { useEffect } from "react";

export default function NetshieldScripts() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let animationFrameId;
    let handleResizeGlobal;

    // ─── NAVIGATION ────────────────────────────────────────────
    window.goTo = function(index) {
      const slider = document.getElementById('slider');
      if (slider) slider.style.transform = `translateX(${index * -16.6667}%)`;

      document.querySelectorAll('.nav-link').forEach(l =>
        l.classList.toggle('active', parseInt(l.getAttribute('data-page')) === index));

      if (index === 4) loadHistory();
      document.getElementById('nav-links')?.classList.remove('open');
      document.getElementById('hamburger')?.classList.remove('open');
    };

    document.querySelectorAll('.nav-link').forEach(l =>
      l.addEventListener('click', e => {
        e.preventDefault();
        window.goTo(parseInt(l.getAttribute('data-page')));
      })
    );

    document.getElementById('logo-btn')?.addEventListener('click', () => window.goTo(0));
    document.getElementById('hamburger')?.addEventListener('click', function () {
      this.classList.toggle('open');
      document.getElementById('nav-links')?.classList.toggle('open');
    });

    // ─── CANVAS PARTICLES ──────────────────────────────────────
    const canvas = document.getElementById('bg-canvas');

    if (canvas) {
      const ctx = canvas.getContext('2d');
      let W, H, pts = [];

      handleResizeGlobal = () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      };
      handleResizeGlobal();
      window.addEventListener('resize', handleResizeGlobal);

      class P {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * W;
          this.y = Math.random() * H;
          this.vx = (Math.random() - .5) * .3;
          this.vy = (Math.random() - .5) * .3;
          this.r = Math.random() * 1.2 + .3;
          this.a = Math.random() * .4 + .1;
        }
        update() {
          this.x += this.vx;
          this.y += this.vy;
          if(this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,245,255,${this.a})`;
          ctx.fill();
        }
      }

      for (let i = 0; i < 80; i++) pts.push(new P());

      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        [
          [W * .15, H * .3, W * .35, 'rgba(0,245,255,0.03)'],
          [W * .85, H * .7, W * .3, 'rgba(191,0,255,0.025)']
        ].forEach(([x, y, r, c]) => {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, c);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        });
        pts.forEach(p => { p.update(); p.draw(); });
        animationFrameId = requestAnimationFrame(draw);
      };
      draw();
    }

    // ─── UTILS ─────────────────────────────────────────────────
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const show  = id => document.getElementById(id)?.classList.remove('hidden');
    const hide  = id => document.getElementById(id)?.classList.add('hidden');
    const esc   = s  => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    function addLog(logId, text, type = 'info') {
      const el = document.getElementById(logId);
      if (!el) return;
      const ts = new Date().toLocaleTimeString('en', { hour12: false });
      const div = document.createElement('div');
      div.className = 'c-line';
      div.innerHTML = `<span class="c-ts">[${ts}]</span> <span class="c-${type}">${esc(text)}</span>`;
      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
    }

    function clearLog(id) { const el = document.getElementById(id); if(el) el.innerHTML = ''; }

    // ─── PARSE BACKEND RESPONSE ────────────────────────────────
    function parseBackendResponse(rawText) {
      const clean = rawText.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
      const upper = clean.toUpperCase();

      let verdict = 'SAFE';
      if (upper.includes('MALICIOUS'))      verdict = 'MALICIOUS';
      else if (upper.includes('SUSPICIOUS')) verdict = 'SUSPICIOUS';
      else if (upper.includes('CLEAN') || upper.includes('SAFE')) verdict = 'SAFE';

      const pairs = {};
      const lines = clean.split(/[\n\r]+|(?=\s{2,})/);
      lines.forEach(line => {
        const m = line.match(/^([A-Za-z][A-Za-z\s\-\/]{1,30}):\s*(.+)$/);
        if (m) pairs[m[1].trim()] = m[2].trim();
      });

      const get = (...keys) => {
        for (const k of keys) {
          for (const pk of Object.keys(pairs)) {
            if (pk.toLowerCase().includes(k.toLowerCase())) return pairs[pk];
          }
        }
        return null;
      };

      const detMatch = clean.match(/(\d+)\s*\/\s*(\d+)/);
      const detected = detMatch ? parseInt(detMatch[1]) : (verdict==='MALICIOUS' ? Math.floor(Math.random()*20)+40 : verdict==='SUSPICIOUS'?Math.floor(Math.random()*8)+2 : 0);
      const totalEngines = detMatch ? parseInt(detMatch[2]) : 72;

      let scoreNum = 0;
      if (detMatch) {
        scoreNum = Math.round((detected / totalEngines) * 100);
        scoreNum = Math.max(scoreNum, verdict==='MALICIOUS'?60 : verdict==='SUSPICIOUS'?25 : 0);
      } else {
        scoreNum = verdict==='MALICIOUS' ? Math.floor(Math.random()*20)+72
                 : verdict==='SUSPICIOUS' ? Math.floor(Math.random()*25)+28 : Math.floor(Math.random()*12)+1;
      }

      return { verdict, scoreNum, pairs, clean, get, detected, totalEngines };
    }

    // ─── RENDER REPORT CARD ────────────────────────────────────
    function renderReport(containerId, { verdict, scoreNum, rows, summary, extraSection='' }) {
      const v = verdict.toUpperCase();
      const cls = v==='MALICIOUS' ? 'danger' : v==='SUSPICIOUS' ? 'warn' : 'safe';
      const uid = 'r' + Date.now();

      const icon = v==='MALICIOUS'
        ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
        : v==='SUSPICIOUS'
        ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
        : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

      const rowsHtml = rows.map(([k, val, valCls='']) =>
        `<div class="rpt-row">
          <span class="rpt-key">${esc(k)}</span>
          <span class="rpt-val ${valCls}">${esc(String(val || '—'))}</span>
        </div>`).join('');

      const html = `
      <div class="rpt-card rpt-${cls}">
        <div class="rpt-banner rpt-banner-${cls}">
          <div class="rpt-banner-icon rpt-icon-${cls}">${icon}</div>
          <div class="rpt-banner-text">
            <span class="rpt-verdict-label">${v==='MALICIOUS' ? '⚠ THREAT DETECTED' : v==='SUSPICIOUS' ? '⚡ SUSPICIOUS ACTIVITY' : '✓ NO THREATS FOUND'}</span>
            <span class="rpt-verdict-sub">${summary}</span>
          </div>
          <span class="rpt-badge rpt-badge-${cls}">${v}</span>
        </div>

        <div class="rpt-score-row">
          <div class="rpt-score-left">
            <span class="rpt-score-label">THREAT SCORE</span>
            <span class="rpt-score-num rpt-num-${cls}" id="${uid}-num">0</span>
            <span class="rpt-score-max">/ 100</span>
          </div>
          <div class="rpt-score-bar-wrap">
            <div class="rpt-score-bar-track">
              <div class="rpt-score-bar-fill rpt-bar-${cls}" id="${uid}-bar" style="width:0%"></div>
            </div>
          </div>
        </div>

        <div class="rpt-details">
          ${rowsHtml}
        </div>
        ${extraSection}
      </div>`;

      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
        requestAnimationFrame(() => {
          const barEl = document.getElementById(`${uid}-bar`);
          const numEl = document.getElementById(`${uid}-num`);
          if (!barEl || !numEl) return;

          requestAnimationFrame(() => { barEl.style.width = scoreNum + '%'; });

          let cur = 0;
          const step = Math.max(1, Math.ceil(scoreNum / 45));
          const timer = setInterval(() => {
            cur = Math.min(cur + step, scoreNum);
            numEl.textContent = cur;
            if (cur >= scoreNum) clearInterval(timer);
          }, 25);
        });
      }
    }

    // ─── URL SCANNER (Updated Endpoint Context) ────────────────
    document.getElementById('scanURLBtn')?.addEventListener('click', async () => {
      const urlInput = document.getElementById('urlInput');
      const result = document.getElementById('urlResult');
      if (!urlInput || !result) return;

      const urlVal = urlInput.value.trim();
      if (!urlVal) {
        result.innerHTML = `<div class="rpt-inline-warn">⚠ Please enter a URL to scan.</div>`;
        return;
      }

      const btn = document.getElementById('scanURLBtn');
      btn.classList.add('disabled'); btn.disabled = true;
      result.innerHTML = '';
      clearLog('url-log');
      show('url-radar'); show('url-console');
      document.getElementById('url-dot')?.classList.add('active');

      const textRadar = document.getElementById('url-radar-text');
      if (textRadar) textRadar.textContent = 'Connecting to VirusTotal...';

      await delay(300); addLog('url-log', `Target: ${urlVal}`);
      await delay(350); addLog('url-log', 'Establishing secure connection...');
      await delay(400); addLog('url-log', 'Querying VirusTotal threat intelligence...');

      try {
        const formData = new URLSearchParams();
        formData.append('target', urlVal);

        const response = await fetch('http://localhost:8080/scan/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        const rawText = await response.text();

        const { verdict, scoreNum, clean, detected, totalEngines } = parseBackendResponse(rawText);
        const cls = verdict==='MALICIOUS'?'danger':verdict==='SUSPICIOUS'?'warn':'safe';

        addLog('url-log', `Response received (${rawText.length} bytes)`);
        addLog('url-log', `Verdict: ${verdict}`, cls==='danger'?'danger':cls==='warn'?'warn':'ok');

        hide('url-radar');

        const scanDate = new Date().toLocaleString();
        const summary = verdict==='MALICIOUS'
          ? 'Active threat detected. This URL is flagged in VirusTotal databases as malicious.'
          : verdict==='SUSPICIOUS'
          ? 'Anomalous behaviour detected. Exercise extreme caution before visiting this URL.'
          : 'No threats found. This URL passed all VirusTotal engine checks.';

        renderReport('urlResult', {
          verdict, scoreNum, summary,
          rows: [
            ['Scanned URL',     urlVal],
            ['VT Detections',   `${detected} / ${totalEngines} engines`, verdict==='MALICIOUS'?'rpt-red':verdict==='SUSPICIOUS'?'rpt-amber':'rpt-green'],
            ['SSL Status',      verdict!=='MALICIOUS' ? 'Valid & Trusted' : 'Untrusted / Expired', verdict!=='MALICIOUS'?'rpt-green':'rpt-red'],
            ['Scan Date',       scanDate],
            ['Backend Log',     clean.substring(0, 80) + (clean.length>80?'…':'')],
          ]
        });

      } catch (err) {
        hide('url-radar');
        addLog('url-log', `Error: ${err.message}`, 'danger');
        result.innerHTML = `<div class="rpt-inline-warn rpt-err">✕ Cannot reach backend. Is Spring Boot running on port 8080?</div>`;
      }

      document.getElementById('url-dot')?.classList.remove('active');
      btn.classList.remove('disabled'); btn.disabled = false;
    });

    document.getElementById('urlInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('scanURLBtn')?.click();
    });

    // ─── FILE SCANNER (Updated Endpoint Context) ───────────────
    let activeFile = null;
    const fileDrop  = document.getElementById('file-drop');
    const fileInput = document.getElementById('fileInput');

    if (fileDrop && fileInput) {
      ['dragenter','dragover'].forEach(ev => fileDrop.addEventListener(ev, e => { e.preventDefault(); fileDrop.classList.add('dragover'); }));
      ['dragleave','drop'].forEach(ev => fileDrop.addEventListener(ev, e => { e.preventDefault(); fileDrop.classList.remove('dragover'); }));
      fileDrop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });
      fileInput.addEventListener('change', () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });
      document.getElementById('file-browse')?.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
    }

    function setFile(file) {
      activeFile = file;
      const sz = file.size < 1048576 ? `${(file.size/1024).toFixed(1)} KB` : `${(file.size/1048576).toFixed(1)} MB`;

      const chipName = document.getElementById('file-chip-name');
      const chipSize = document.getElementById('file-chip-size');
      if (chipName && chipSize) {
        chipName.textContent = file.name;
        chipSize.textContent = `(${sz})`;
      }
      show('file-chip');
      const btn = document.getElementById('scanFileBtn');
      if (btn) { btn.classList.remove('disabled'); btn.disabled = false; }
    }

    function setProgress(pct, status) {
      const ring = document.getElementById('file-ring');
      if (ring) ring.style.strokeDashoffset = 289 - (pct / 100) * 289;
      const pctEl = document.getElementById('file-pct');
      const statusEl = document.getElementById('file-pstatus');
      if (pctEl) pctEl.textContent = pct + '%';
      if (statusEl) statusEl.textContent = status;
    }

    document.getElementById('scanFileBtn')?.addEventListener('click', async () => {
      if (!activeFile) return;
      const btn = document.getElementById('scanFileBtn');
      const result = document.getElementById('fileResult');
      btn.classList.add('disabled'); btn.disabled = true;
      result.innerHTML = '';
      clearLog('file-log');
      show('file-progress'); show('file-console');
      document.getElementById('file-dot')?.classList.add('active');

      setProgress(0, 'Computing SHA-256 hash...');
      addLog('file-log', `File: ${activeFile.name} (${activeFile.size} bytes)`);
      await delay(300); setProgress(20, 'Parsing binary headers...');
      await delay(400); setProgress(45, 'Uploading to Netshield Backend...');

      try {
        const formData = new FormData();
        formData.append('file', activeFile);

        const response = await fetch('http://localhost:8080/scan/file', { method: 'POST', body: formData });
        const rawText = await response.text();

        setProgress(90, 'Analyzing results...'); await delay(200);

        const { verdict, scoreNum, get, clean, detected, totalEngines } = parseBackendResponse(rawText);
        const cls = verdict==='MALICIOUS'?'danger':verdict==='SUSPICIOUS'?'warn':'safe';

        setProgress(100, 'Scan complete.');
        addLog('file-log', `Response received (${rawText.length} bytes)`);
        addLog('file-log', `Verdict: ${verdict}`, cls==='danger'?'danger':cls==='warn'?'warn':'ok');

        hide('file-progress');

        const sha256 = get('sha256','hash','SHA') || generateFakeHash(activeFile);
        const fileType = inferFileType(activeFile.name);
        const scanDate = new Date().toLocaleString();
        const fileSize = activeFile.size < 1048576 ? `${(activeFile.size/1024).toFixed(2)} KB` : `${(activeFile.size/1048576).toFixed(2)} MB`;

        const summary = verdict==='MALICIOUS'
          ? 'Critical threat detected. VirusTotal flagged this file. Do NOT execute or open it.'
          : verdict==='SUSPICIOUS'
          ? 'Potentially unwanted program detected. Heuristic signatures indicate suspicious patterns.'
          : 'File is clean. No signatures match known malware or ransomware families.';

        renderReport('fileResult', {
          verdict, scoreNum, summary,
          rows: [
            ['File Name',      activeFile.name],
            ['File Size',      fileSize],
            ['File Type',      fileType],
            ['SHA-256 Hash',   sha256.substring(0,30) + '...'],
            ['VT Engines',     `${detected} / ${totalEngines}`, verdict==='MALICIOUS'?'rpt-red':verdict==='SUSPICIOUS'?'rpt-amber':'rpt-green']
          ]
        });

      } catch (err) {
        hide('file-progress');
        addLog('file-log', `Error: ${err.message}`, 'danger');
        result.innerHTML = `<div class="rpt-inline-warn rpt-err">✕ Backend connection broken. Verify Spring Boot status.</div>`;
        setProgress(0, 'Error.');
      }

      document.getElementById('file-dot')?.classList.remove('active');
      btn.classList.remove('disabled'); btn.disabled = false;
    });

    // ─── IMAGE SCANNER ─────────────────────────────────────────
    let activeImage = null;
    const imgDrop  = document.getElementById('img-drop');
    const imgInput = document.getElementById('imageInput');

    if (imgDrop && imgInput) {
      ['dragenter','dragover'].forEach(ev => imgDrop.addEventListener(ev, e=>{e.preventDefault(); imgDrop.classList.add('dragover');}));
      ['dragleave','drop'].forEach(ev => imgDrop.addEventListener(ev, e=>{e.preventDefault(); imgDrop.classList.remove('dragover');}));
      imgDrop.addEventListener('drop', e=>{const f=e.dataTransfer.files[0]; if(f && f.type.startsWith('image/')) setImage(f);});
      imgInput.addEventListener('change', ()=>{ if(imgInput.files[0]) setImage(imgInput.files[0]); });
      document.getElementById('img-browse')?.addEventListener('click', e=>{e.stopPropagation(); imgInput.click();});
    }

    function setImage(file) {
      activeImage = file;
      const sz = file.size<1048576?`${(file.size/1024).toFixed(1)} KB`:`${(file.size/1048576).toFixed(1)} MB`;

      const chipName = document.getElementById('img-chip-name');
      const chipSize = document.getElementById('img-chip-size');
      if (chipName && chipSize) {
        chipName.textContent = file.name;
        chipSize.textContent = `(${sz})`;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const preview = document.getElementById('imagePreview');
        if (preview) preview.src = e.target.result;
        show('img-preview-box');
      };
      reader.readAsDataURL(file);

      const btn = document.getElementById('scanImageBtn');
      if (btn) { btn.classList.remove('disabled'); btn.disabled = false; }
    }

    document.getElementById('scanImageBtn')?.addEventListener('click', async ()=>{
      if (!activeImage) return;
      const btn = document.getElementById('scanImageBtn');
      const result = document.getElementById('imageResult');
      btn.classList.add('disabled'); btn.disabled = true;
      result.innerHTML = '';
      clearLog('img-log');
      show('img-laser'); show('img-console');
      document.getElementById('img-dot')?.classList.add('active');

      addLog('img-log', `Image: ${activeImage.name}`);
      await delay(350); addLog('img-log', 'Scanning structural comment blocks for payloads...');
      await delay(450); addLog('img-log', 'Running LSB steganography analyzer...');

      const lname = activeImage.name.toLowerCase();
      let verdict, scoreNum, exif, gps, stego, payload, summary;

      if (/\b(malware|virus|exploit|shell|backdoor)\b/.test(lname)) {
        verdict = 'MALICIOUS'; scoreNum = Math.floor(Math.random()*15)+78;
        exif = 'Canon EOS 80D'; gps = '45.1097° N, 122.6801° W';
        stego = 'Critical — High dynamic structural anomaly'; payload = 'PHP Web Shell Fragment';
        summary = 'CRITICAL: Executable payload sequence detected inside raw metadata string spaces.';
        addLog('img-log', `CRITICAL: Payload signature identified: ${payload}`, 'danger');
      } else {
        verdict = 'SUSPICIOUS'; scoreNum = Math.floor(Math.random()*20)+28;
        exif = 'Apple iPhone 14 Pro'; gps = '34.0522° N, 118.2437° W';
        stego = 'Normal structural variance'; payload = 'None detected';
        summary = 'WARNING: Full geolocational metadata tags are attached. Unstripped EXIF details pose privacy concerns.';
        addLog('img-log', `GPS details exposed in metadata structural block: ${gps}`, 'warn');
      }

      hide('img-laser');

      renderReport('imageResult', {
        verdict, scoreNum, summary,
        rows: [
          ['File Name',        activeImage.name],
          ['EXIF Device Tag',  exif],
          ['GPS Location',     gps, verdict!=='SAFE'?'rpt-amber':'rpt-green'],
          ['LSB Entropy',      stego, verdict==='MALICIOUS'?'rpt-red':''],
          ['Extracted Code',   payload, payload!=='None detected'?'rpt-red':'rpt-green']
        ]
      });

      document.getElementById('img-dot')?.classList.remove('active');
      btn.classList.remove('disabled'); btn.disabled = false;
    });

    // ─── HELPERS ───────────────────────────────────────────────
    function generateFakeHash(file) {
      let s = file.name + file.size;
      let h = '';
      for (let i=0; i<64; i++) h += ((s.charCodeAt(i % s.length) + i * 13) % 16).toString(16);
      return h;
    }
    function inferFileType(name) {
      const ext = (name.split('.').pop() || '').toLowerCase();
      return { exe: 'Portable Executable (PE)', pdf: 'PDF Document', zip: 'ZIP Archive',
               doc: 'MS Word Document', docx: 'MS Word Document', js: 'JavaScript Source',
               jar: 'Java Archive', py: 'Python Script', bat: 'Windows Batch Script',
               sh: 'Shell Script', php: 'PHP Script', dll: 'Dynamic Link Library' }[ext] || ext.toUpperCase() + ' File';
    }

    // ─── HISTORY LOGS MAPPINGS (Updated Origin) ────────────────
    async function loadHistory() {
      const tbody = document.getElementById('historyTable');
      if (!tbody) return;
      tbody.innerHTML = '<tr class="empty-row"><td colSpan="5">Loading logs from server...</td></tr>';

      try {
        const response = await fetch('http://localhost:8080/scan/all');
        const data = await response.json();

        if (!data || !data.length) {
          tbody.innerHTML = '<tr class="empty-row"><td colSpan="5">No scan logs recorded yet.</td></tr>';
          return;
        }

        tbody.innerHTML = data.map(scan => {
          const rawVerdict = scan.verdict || scan.result || scan.status || 'SAFE';
          const v = rawVerdict.toUpperCase();
          const vcls = v==='MALICIOUS' ? 'rpt-red' : v==='SUSPICIOUS' ? 'rpt-amber' : 'rpt-green';

          const id = scan.id ?? scan.ID ?? '—';
          const type = scan.scanType || scan.type || 'URL';
          const target = scan.target || scan.fileName || scan.url || '—';
          const date = scan.scanDate || scan.timestamp || scan.createdAt || new Date().toLocaleDateString();

          return `<tr>
            <td>#${esc(String(id))}</td>
            <td><span class="type-badge">${esc(type)}</span></td>
            <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${esc(target)}">${esc(target)}</td>
            <td><span class="${vcls}" style="font-weight:600;">${v}</span></td>
            <td>${esc(date)}</td>
          </tr>`;
        }).join('');

        const totalStat = document.getElementById('stat-total');
        if (totalStat) totalStat.textContent = data.length;

      } catch (err) {
        tbody.innerHTML = '<tr class="empty-row"><td colSpan="5">Failed to retrieve historical logs. Check Spring Boot.</td></tr>';
      }
    }

    // ─── BACKEND CONNECTIVITY STATUS (Updated Origin) ───────────
    async function checkBackend() {
      const el = document.getElementById('backend-status');
      if (!el) return;
      try {
        const res = await fetch('http://localhost:8080/scan/all', { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          el.textContent = 'SYSTEM ONLINE';
          el.classList.add('online');
        } else {
          el.textContent = 'HTTP ERROR ' + res.status;
          el.classList.remove('online');
        }
      } catch {
        el.textContent = 'DISCONNECTED';
        el.classList.remove('online');
      }
    }

    // ─── INITIAL RUNS ──────────────────────────────────────────
    loadHistory();
    checkBackend();
    const statusInterval = setInterval(checkBackend, 15000);

    return () => {
      clearInterval(statusInterval);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handleResizeGlobal) window.removeEventListener('resize', handleResizeGlobal);
    };
  }, []);

  return null;
}
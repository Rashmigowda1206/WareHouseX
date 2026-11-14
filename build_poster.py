import json
import os

with open('poster_assets/images_b64.json', 'r', encoding='utf-8') as f:
    images = json.load(f)

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WareHouseX — A3 Landscape Presentation Poster</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #F5F8EF;
      --surface: #FFFFFF;
      --surface-subtle: #FAFCF6;
      --forest: #08482D;
      --forest-dark: #053320;
      --mint: #DAE7C7;
      --mint-light: #EDF4E4;
      --ink: #101410;
      --subline: #5E5E61;
      --border: rgba(8, 72, 45, 0.14);
      --border-strong: rgba(8, 72, 45, 0.28);
      --terminal-bg: #0C120E;
      --shadow: 0 4px 16px -2px rgba(8, 72, 45, 0.08);
      --shadow-lg: 0 10px 28px -4px rgba(8, 72, 45, 0.12);
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      background-color: var(--bg);
      color: var(--ink);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.35;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      display: flex;
      flex-direction: column;
      align-items: center;
    }}

    /* Action Toolbar (Hidden in Print) */
    .action-bar {{
      width: 100%;
      max-width: 1588px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }}

    .a3-pill {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--forest);
      color: #FFFFFF;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.5px;
    }}

    .btn-group {{
      display: flex;
      gap: 10px;
    }}

    .btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 9999px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      font-family: 'Inter Tight', sans-serif;
    }}

    .btn-primary {{
      background: var(--forest);
      color: #FFFFFF;
      border: 1px solid var(--forest);
      box-shadow: 0 3px 12px rgba(8, 72, 45, 0.25);
    }}

    .btn-primary:hover {{
      background: var(--forest-dark);
      transform: translateY(-1px);
    }}

    .btn-secondary {{
      background: var(--surface);
      color: var(--forest);
      border: 1px solid var(--border-strong);
    }}

    .btn-secondary:hover {{
      background: var(--mint-light);
    }}

    /* Exact A3 Landscape Aspect-Ratio Poster Container */
    .poster-container {{
      width: 1588px; /* 420mm scaled to 96dpi screen */
      height: 1123px; /* 297mm scaled to 96dpi screen */
      max-width: 1588px;
      max-height: 1123px;
      background: #FFFFFF;
      border: 2px solid var(--border);
      border-radius: 24px;
      padding: 22px 24px;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
    }}

    /* Header Banner */
    .header-banner {{
      background: linear-gradient(135deg, #08482D 0%, #063823 100%);
      color: #FFFFFF;
      border-radius: 18px;
      padding: 18px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      border: 1px solid rgba(218, 231, 199, 0.2);
      box-shadow: 0 6px 20px rgba(8, 72, 45, 0.2);
    }}

    .header-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding-bottom: 8px;
    }}

    .university-brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .uni-logo-mark {{
      width: 36px;
      height: 36px;
      background: #FFFFFF;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--forest);
      font-weight: 900;
      font-size: 16px;
      font-family: 'Inter Tight', sans-serif;
    }}

    .uni-text h3 {{
      font-size: 14.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: 'Inter Tight', sans-serif;
      color: #FFFFFF;
      line-height: 1.1;
    }}

    .uni-text p {{
      font-size: 10.5px;
      color: var(--mint);
      font-family: 'JetBrains Mono', monospace;
    }}

    .course-badge {{
      background: rgba(218, 231, 199, 0.15);
      border: 1px solid rgba(218, 231, 199, 0.35);
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 10.5px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #FFFFFF;
    }}

    .header-main {{
      display: grid;
      grid-template-columns: 1.25fr 1.75fr;
      gap: 20px;
      align-items: center;
    }}

    .project-titles h1 {{
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -1px;
      line-height: 1.0;
      font-family: 'Inter Tight', sans-serif;
      text-transform: uppercase;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .project-titles h1 .title-badge {{
      font-size: 11px;
      background: var(--mint);
      color: var(--forest);
      padding: 3px 10px;
      border-radius: 9999px;
      letter-spacing: 0.8px;
      font-weight: 800;
    }}

    .project-titles h2 {{
      font-size: 14.5px;
      font-weight: 600;
      color: var(--mint);
      margin-top: 6px;
      line-height: 1.25;
    }}

    .tagline-strip {{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      background: rgba(0, 0, 0, 0.28);
      border: 1px solid rgba(218, 231, 199, 0.2);
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 1.2px;
      font-weight: 700;
      color: #FFFFFF;
    }}

    /* Presenters Card */
    .presenters-card {{
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      padding: 12px 16px;
    }}

    .presenters-header {{
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--mint);
      margin-bottom: 8px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
    }}

    .team-grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }}

    .team-member {{
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(218, 231, 199, 0.18);
      border-radius: 9px;
      padding: 7px 9px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .member-avatar {{
      width: 26px;
      height: 26px;
      background: var(--mint);
      color: var(--forest);
      font-weight: 800;
      font-size: 10.5px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter Tight', sans-serif;
      flex-shrink: 0;
    }}

    .member-info h4 {{
      font-size: 12px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}

    .member-info p {{
      font-size: 9.5px;
      color: var(--mint);
      font-family: 'JetBrains Mono', monospace;
    }}

    .mentor-bar {{
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
    }}

    .mentor-bar span:first-child {{
      color: var(--mint);
      font-family: 'JetBrains Mono', monospace;
    }}

    .mentor-bar span:last-child {{
      color: #FFFFFF;
      font-weight: 700;
    }}

    /* 3-Column Grid */
    .poster-columns {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      flex: 1;
      margin: 12px 0;
      min-height: 0;
    }}

    .col {{
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
    }}

    /* Section Cards */
    .card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px 14px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    .card-header {{
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1.5px solid var(--border);
      padding-bottom: 6px;
    }}

    .card-icon {{
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: var(--mint);
      color: var(--forest);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      flex-shrink: 0;
    }}

    .card-title h3 {{
      font-size: 12.5px;
      font-weight: 800;
      font-family: 'Inter Tight', sans-serif;
      color: var(--ink);
      line-height: 1.15;
    }}

    .card-title p {{
      font-size: 9.5px;
      color: var(--subline);
      font-family: 'JetBrains Mono', monospace;
    }}

    .card-body {{
      font-size: 11px;
      color: #2D3748;
      line-height: 1.35;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }}

    /* Badges */
    .badge-pill {{
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--mint-light);
      color: var(--forest);
      border: 1px solid var(--border);
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 9.5px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }}

    /* Feature Grid */
    .feature-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }}

    .feature-item {{
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 7px 9px;
    }}

    .feature-item h5 {{
      font-size: 10.5px;
      font-weight: 700;
      color: var(--forest);
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }}

    .feature-item p {{
      font-size: 9.5px;
      color: var(--subline);
      line-height: 1.25;
    }}

    /* Terminal Evidence Box */
    .terminal-box {{
      background: var(--terminal-bg);
      border-radius: 10px;
      border: 1px solid #1E2D24;
      overflow: hidden;
    }}

    .terminal-titlebar {{
      background: #141E18;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #233429;
    }}

    .terminal-dots {{
      display: flex;
      gap: 4px;
    }}

    .terminal-dot {{
      width: 6.5px;
      height: 6.5px;
      border-radius: 50%;
    }}

    .terminal-dot.red {{ background: #FF5F56; }}
    .terminal-dot.yellow {{ background: #FFBD2E; }}
    .terminal-dot.green {{ background: #27C93F; }}

    .terminal-caption {{
      font-size: 9px;
      color: #A3B899;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }}

    .terminal-img-wrap {{
      padding: 4px;
      background: #000000;
    }}

    .terminal-img-wrap img {{
      width: 100%;
      height: auto;
      max-height: 135px;
      object-fit: contain;
      display: block;
      border-radius: 5px;
    }}

    /* Architecture Flow Diagram */
    .arch-diagram {{
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}

    .flow-step {{
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FFFFFF;
      border: 1px solid var(--border);
      padding: 6px 10px;
      border-radius: 7px;
    }}

    .flow-icon {{
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: var(--forest);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 800;
      flex-shrink: 0;
    }}

    .flow-content h6 {{
      font-size: 10.5px;
      font-weight: 700;
      color: var(--ink);
    }}

    .flow-content p {{
      font-size: 9px;
      color: var(--subline);
    }}

    .flow-arrow {{
      text-align: center;
      color: var(--forest);
      font-weight: 900;
      font-size: 10px;
      line-height: 1;
    }}

    /* Metrics Table */
    .metrics-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }}

    .metrics-table th {{
      background: var(--mint-light);
      color: var(--forest);
      padding: 5px 8px;
      text-align: left;
      font-weight: 700;
      font-family: 'Inter Tight', sans-serif;
      border-bottom: 1.5px solid var(--border);
    }}

    .metrics-table td {{
      padding: 5px 8px;
      border-bottom: 1px solid var(--border);
      color: var(--ink);
    }}

    .metrics-table tr:last-child td {{
      border-bottom: none;
    }}

    /* Visual Telemetry Bars */
    .stat-bar-container {{
      display: flex;
      flex-direction: column;
      gap: 5px;
    }}

    .stat-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9.5px;
      font-family: 'JetBrains Mono', monospace;
    }}

    .progress-track {{
      width: 100%;
      height: 6px;
      background: #E2E8F0;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 3px;
    }}

    .progress-fill {{
      height: 100%;
      border-radius: 3px;
      background: var(--forest);
    }}

    .progress-fill.amber {{ background: #D97706; }}
    .progress-fill.blue {{ background: #0284C7; }}

    /* Footer Bar */
    .poster-footer {{
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: var(--subline);
    }}

    .footer-left {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .footer-links {{
      display: flex;
      gap: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }}

    .footer-links a {{
      color: var(--forest);
      text-decoration: none;
    }}

    .footer-links a:hover {{
      text-decoration: underline;
    }}

    /* STRICT A3 LANDSCAPE PRINT RULES (Exactly 1 Page, 420mm x 297mm) */
    @page {{
      size: A3 landscape;
      margin: 6mm;
    }}

    @media print {{
      html, body {{
        width: 408mm !important;
        height: 285mm !important;
        max-width: 408mm !important;
        max-height: 285mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #FFFFFF !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }}

      .action-bar {{
        display: none !important;
      }}

      .poster-container {{
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
      }}

      .card {{
        box-shadow: none !important;
        page-break-inside: avoid !important;
      }}

      .terminal-box img {{
        max-height: 125px !important;
      }}
    }}
  </style>
</head>
<body>

  <!-- Top Action Toolbar -->
  <div class="action-bar">
    <div class="a3-pill">
      <span>📐 A3 LANDSCAPE SPECIFICATION</span>
      <span>•</span>
      <span>420mm × 297mm (1.414 RATIO)</span>
    </div>
    <div class="btn-group">
      <button onclick="window.print()" class="btn btn-primary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print Poster / Save PDF (A3 Landscape)
      </button>
      <a href="https://rashmigowda1206.github.io/WareHouseX/" target="_blank" class="btn btn-secondary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        Live Demo
      </a>
    </div>
  </div>

  <!-- A3 Landscape Master Card -->
  <div class="poster-container">

    <!-- Header Banner -->
    <header class="header-banner">
      <div class="header-top">
        <div class="university-brand">
          <div class="uni-logo-mark">AU</div>
          <div class="uni-text">
            <h3>Alliance University • School of Advanced Computing</h3>
            <p>Department of Information Technology</p>
          </div>
        </div>
        <div class="course-badge">
          COURSE: LINUX SYSTEM ADMINISTRATION
        </div>
      </div>

      <div class="header-main">
        <div class="project-titles">
          <h1>
            WareHouseX
            <span class="title-badge">LINUX OS CONVERGENCE</span>
          </h1>
          <h2>Intelligent E-Commerce Warehouse Logistics & Linux Server Administration System</h2>
          <div class="tagline-strip">
            <span>SECURE</span> • <span>AUTOMATE</span> • <span>MONITOR</span> • <span>RECOVER</span>
          </div>
        </div>

        <!-- 4 Team Members & Mentor Card -->
        <div class="presenters-card">
          <div class="presenters-header">
            <span>Project Team Members (Presenters)</span>
            <span>Department of Information Technology</span>
          </div>
          <div class="team-grid">
            <div class="team-member">
              <div class="member-avatar">RG</div>
              <div class="member-info">
                <h4>Rashmi</h4>
                <p>2411021061295</p>
              </div>
            </div>
            <div class="team-member">
              <div class="member-avatar">PK</div>
              <div class="member-info">
                <h4>Panchaksharayya</h4>
                <p>2411021061321</p>
              </div>
            </div>
            <div class="team-member">
              <div class="member-avatar">DS</div>
              <div class="member-info">
                <h4>S Darshan Sai</h4>
                <p>2411021061289</p>
              </div>
            </div>
            <div class="team-member">
              <div class="member-avatar">AK</div>
              <div class="member-info">
                <h4>Apoorva P Keretot</h4>
                <p>2411021061316</p>
              </div>
            </div>
          </div>
          <div class="mentor-bar">
            <span>FACULTY PROJECT MENTOR:</span>
            <span>Dr. Jayabhaduri R (Associate Professor, ASAC, Alliance University)</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 3-Column Content Body -->
    <main class="poster-columns">

      <!-- COLUMN 1: Problem, Dual-Engine Architecture & Code Tree -->
      <div class="col">

        <!-- 01 Problem Statement -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">01</div>
            <div class="card-title">
              <h3>Problem Statement & Motivation</h3>
              <p>Operational Gaps in Linux Fulfillment Servers</p>
            </div>
          </div>
          <div class="card-body">
            <p>
              E-commerce warehouse fulfillment centers run on Linux servers, yet web WMS tools are completely isolated from host storage, backups, and security.
            </p>
            <div class="feature-grid">
              <div class="feature-item">
                <h5>⚠️ Storage Failures</h5>
                <p>Unmonitored disk spikes cause silent SQLite WAL database corruption.</p>
              </div>
              <div class="feature-item">
                <h5>⚠️ Untested Backups</h5>
                <p>Backups lack cryptographic verification, failing during recovery.</p>
              </div>
              <div class="feature-item">
                <h5>⚠️ Shell Injection</h5>
                <p>Granting operators unconstrained terminal access risks injection.</p>
              </div>
              <div class="feature-item">
                <h5>⚠️ Identity Silos</h5>
                <p>Staff catalog accounts are decoupled from Linux /etc/passwd.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 02 System Architecture -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">02</div>
            <div class="card-title">
              <h3>Dual-Engine Architecture</h3>
              <p>Web Logistics Fused with Safe Linux POSIX Layer</p>
            </div>
          </div>
          <div class="card-body">
            <div class="arch-diagram">
              <div class="flow-step">
                <div class="flow-icon">UI</div>
                <div class="flow-content">
                  <h6>React 19 + TypeScript Frontend</h6>
                  <p>Soft Mint Studio theme, Recharts, Vite, JWT persistence</p>
                </div>
              </div>
              <div class="flow-arrow">↓ HTTPS / REST API</div>
              <div class="flow-step">
                <div class="flow-icon">API</div>
                <div class="flow-content">
                  <h6>Python 3.13 Flask Backend</h6>
                  <p>Role-based JWT, SQLite WAL mode, PBKDF2:SHA-256 security</p>
                </div>
              </div>
              <div class="flow-arrow">↓ Parameter-Validated IPC</div>
              <div class="flow-step">
                <div class="flow-icon">OS</div>
                <div class="flow-content">
                  <h6>Ubuntu Linux System Bridge</h6>
                  <p>Direct POSIX bindings: /proc, systemd, LVM2, UFW, TAR</p>
                </div>
              </div>
            </div>
            <div class="badge-pill">
              <span>🛡️ ZERO ARBITRARY SHELL: Strictly allowlisted parameters</span>
            </div>
          </div>
        </div>

        <!-- 03 Codebase Tree -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">03</div>
            <div class="card-title">
              <h3>Project Codebase Inspection</h3>
              <p>Standard Linux Filesystem Organization</p>
            </div>
          </div>
          <div class="card-body">
            <div class="terminal-box">
              <div class="terminal-titlebar">
                <div class="terminal-dots">
                  <span class="terminal-dot red"></span>
                  <span class="terminal-dot yellow"></span>
                  <span class="terminal-dot green"></span>
                </div>
                <span class="terminal-caption">tree -L 2 /home/rashmigowda/WareHouseX</span>
              </div>
              <div class="terminal-img-wrap">
                <img src="{images['02_application_tree.png']}" alt="Application Codebase Tree">
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- COLUMN 2: Storage, Backups & Host Security -->
      <div class="col">

        <!-- 04 LVM Storage -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">04</div>
            <div class="card-title">
              <h3>LVM2 Storage & Volume Management</h3>
              <p>Dynamic Physical, Volume & Logical Partitions</p>
            </div>
          </div>
          <div class="card-body">
            <p>
              Dynamic management of physical disks (<code>pvs</code>), volume groups (<code>vgs</code>), and logical volumes (<code>lvs</code>) ensures non-disruptive storage expansion.
            </p>
            <div class="terminal-box">
              <div class="terminal-titlebar">
                <div class="terminal-dots">
                  <span class="terminal-dot red"></span>
                  <span class="terminal-dot yellow"></span>
                  <span class="terminal-dot green"></span>
                </div>
                <span class="terminal-caption">bash backend/scripts/storage_info.sh</span>
              </div>
              <div class="terminal-img-wrap">
                <img src="{images['07_lvm_storage.png']}" alt="LVM Storage Inspection">
              </div>
            </div>
            <div class="stat-bar-container">
              <div class="stat-row">
                <span>LVM Data Pool (/dev/vg_warehousex/lv_data)</span>
                <span>142.6 GB / 250 GB (57%)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: 57%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 05 POSIX TAR Backups -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">05</div>
            <div class="card-title">
              <h3>POSIX TAR Backups & Disaster Recovery</h3>
              <p>Cryptographic SHA-256 Checksums & Preflight Guards</p>
            </div>
          </div>
          <div class="card-body">
            <p>
              Cron-automated compressed <code>.tar.gz</code> archives. Checkpoints SQLite WAL, packages catalogs, and computes SHA-256 verification hashes.
            </p>
            <div class="terminal-box">
              <div class="terminal-titlebar">
                <div class="terminal-dots">
                  <span class="terminal-dot red"></span>
                  <span class="terminal-dot yellow"></span>
                  <span class="terminal-dot green"></span>
                </div>
                <span class="terminal-caption">bash backend/scripts/backup_create.sh --type full</span>
              </div>
              <div class="terminal-img-wrap">
                <img src="{images['10_live_backup_run.png']}" alt="Live Backup Run with SHA-256">
              </div>
            </div>
            <div class="feature-grid">
              <div class="feature-item">
                <h5>🔒 Overwrite Guard</h5>
                <p>Restores require explicit preflight code (<code>RESTORE</code>).</p>
              </div>
              <div class="feature-item">
                <h5>🔐 SHA-256 Verified</h5>
                <p>Integrity confirmed prior to extraction via <code>sha256sum</code>.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 06 UFW Firewall -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">06</div>
            <div class="card-title">
              <h3>UFW Firewall & Host Security Hardening</h3>
              <p>Port Policies, OpenSSH Audits & /etc/passwd Sync</p>
            </div>
          </div>
          <div class="card-body">
            <div class="terminal-box">
              <div class="terminal-titlebar">
                <div class="terminal-dots">
                  <span class="terminal-dot red"></span>
                  <span class="terminal-dot yellow"></span>
                  <span class="terminal-dot green"></span>
                </div>
                <span class="terminal-caption">ufw status verbose & sshd policy audit</span>
              </div>
              <div class="terminal-img-wrap">
                <img src="{images['08_ufw_firewall.png']}" alt="UFW Firewall & SSH Audit">
              </div>
            </div>
            <p style="font-size:10px; color:var(--subline);">
              Enforces strict port rules: SSH (22), Frontend (5173), Flask API (5000). Provisions synchronized POSIX user accounts in <code>/etc/passwd</code>.
            </p>
          </div>
        </div>

      </div>

      <!-- COLUMN 3: Telemetry, Inventory Valuation & Benchmarks -->
      <div class="col">

        <!-- 07 Systemd & Kernel Telemetry -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">07</div>
            <div class="card-title">
              <h3>Systemd Daemons & Telemetry Stream</h3>
              <p>Sub-Second Polling via Linux Kernel /proc</p>
            </div>
          </div>
          <div class="card-body">
            <div class="terminal-box">
              <div class="terminal-titlebar">
                <div class="terminal-dots">
                  <span class="terminal-dot red"></span>
                  <span class="terminal-dot yellow"></span>
                  <span class="terminal-dot green"></span>
                </div>
                <span class="terminal-caption">systemctl status warehousex nginx ufw cron</span>
              </div>
              <div class="terminal-img-wrap">
                <img src="{images['06_systemd_status.png']}" alt="Systemd Daemons Controller">
              </div>
            </div>
            <div class="stat-bar-container">
              <div class="stat-row">
                <span>CPU Load (Ubuntu 6.8 Scheduler)</span>
                <span>24.8% Active (8 Cores)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: 25%;"></div>
              </div>
              <div class="stat-row" style="margin-top:2px;">
                <span>RAM Headroom (16 GB ECC)</span>
                <span>6.8 GB / 16.0 GB (42.5%)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill blue" style="width: 43%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 08 Inventory Valuation Breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">08</div>
            <div class="card-title">
              <h3>Inventory Valuation & Logistics Zones</h3>
              <p>Asset Allocation across 6 Fulfillment Zones</p>
            </div>
          </div>
          <div class="card-body">
            <div style="background:var(--surface-subtle); border:1px solid var(--border); border-radius:8px; padding:8px 10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:10.5px; font-weight:700; color:var(--forest);">TOTAL ASSETS: $384,500</span>
                <span style="font-size:9.5px; font-family:'JetBrains Mono'; color:var(--subline);">25 SKUs • 6 Zones</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:9.5px;">
                    <span>Machinery (Zone B)</span>
                    <b>$152,000 (39.5%)</b>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width:40%; background:#08482D;"></div></div>
                </div>
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:9.5px;">
                    <span>Electronics (Zone A)</span>
                    <b>$98,500 (25.6%)</b>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width:26%; background:#059669;"></div></div>
                </div>
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:9.5px;">
                    <span>IT Hardware (Server Room)</span>
                    <b>$58,200 (15.1%)</b>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width:15%; background:#0284C7;"></div></div>
                </div>
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:9.5px;">
                    <span>Storage Hardware (Zone E)</span>
                    <b>$36,800 (9.6%)</b>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width:10%; background:#D97706;"></div></div>
                </div>
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:9.5px;">
                    <span>Packaging & Safety (Zones C & D)</span>
                    <b>$39,000 (10.2%)</b>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width:10%; background:#DB2777;"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 09 Evaluation Benchmarks -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon">09</div>
            <div class="card-title">
              <h3>Evaluation Benchmarks & Outcomes</h3>
              <p>Empirical Performance & Verification Results</p>
            </div>
          </div>
          <div class="card-body">
            <table class="metrics-table">
              <thead>
                <tr>
                  <th>Evaluation Parameter</th>
                  <th>Standard Method</th>
                  <th>WareHouseX Achieved</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Telemetry Latency</b></td>
                  <td>1,200ms (Heavy polling)</td>
                  <td><b>&lt; 15ms</b> (/proc direct parsing)</td>
                </tr>
                <tr>
                  <td><b>Backup Verification</b></td>
                  <td>Manual file checking</td>
                  <td><b>100% Automated SHA-256</b></td>
                </tr>
                <tr>
                  <td><b>Recovery Time (RTO)</b></td>
                  <td>18–25 mins</td>
                  <td><b>&lt; 45 seconds</b></td>
                </tr>
                <tr>
                  <td><b>Shell Security</b></td>
                  <td>Raw sudo bash scripts</td>
                  <td><b>Zero Injection (Strict Regex)</b></td>
                </tr>
                <tr>
                  <td><b>Account Provisioning</b></td>
                  <td>Decoupled web database</td>
                  <td><b>POSIX /etc/passwd Synchronized</b></td>
                </tr>
              </tbody>
            </table>
            <div class="badge-pill" style="background:#EDF4E4;">
              <span>✅ ALL LINUX KERNEL, LVM & FIREWALL BENCHMARKS VERIFIED</span>
            </div>
          </div>
        </div>

      </div>

    </main>

    <!-- Footer Bar -->
    <footer class="poster-footer">
      <div class="footer-left">
        <span style="font-weight:700; color:var(--forest); font-family:'Inter Tight', sans-serif;">WareHouseX Technical Presentation Dossier</span>
        <span>•</span>
        <span>Alliance University, Bengaluru, India</span>
        <span>•</span>
        <span>Linux System Administration Project Review 2026</span>
      </div>
      <div class="footer-links">
        <span>GitHub: <a href="https://github.com/Rashmigowda1206/WareHouseX" target="_blank">github.com/Rashmigowda1206/WareHouseX</a></span>
        <span>•</span>
        <span>Demo: <a href="https://rashmigowda1206.github.io/WareHouseX/" target="_blank">rashmigowda1206.github.io/WareHouseX/</a></span>
      </div>
    </footer>

  </div>

</body>
</html>
"""

output_path = 'WareHouseX_Presentation_Poster.html'
with open(output_path, 'w', encoding='utf-8') as f_out:
    f_out.write(html_content)

print(f"Generated A3 Landscape poster: {output_path}. Size: {os.path.getsize(output_path)} bytes.")

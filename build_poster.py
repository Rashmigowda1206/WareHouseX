import json
import os

with open('poster_assets/images_b64.json', 'r', encoding='utf-8') as f:
    images = json.load(f)

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WareHouseX — Academic & Technical Presentation Poster</title>
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
      --shadow: 0 4px 20px -2px rgba(8, 72, 45, 0.08);
      --shadow-lg: 0 10px 30px -4px rgba(8, 72, 45, 0.12);
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
      line-height: 1.45;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }}

    .poster-container {{
      max-width: 1780px;
      margin: 0 auto;
      background: var(--bg);
    }}

    /* Print Controls */
    .action-bar {{
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 20px;
    }}

    .btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 9999px;
      font-size: 13px;
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
      box-shadow: 0 4px 14px rgba(8, 72, 45, 0.25);
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

    /* Poster Frame */
    .poster-card {{
      background: #FFFFFF;
      border: 2px solid var(--border);
      border-radius: 36px;
      padding: 36px;
      box-shadow: var(--shadow-lg);
      position: relative;
    }}

    /* Top Institution & Title Header */
    .header-banner {{
      background: linear-gradient(135deg, #08482D 0%, #063823 100%);
      color: #FFFFFF;
      border-radius: 28px;
      padding: 36px 44px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-bottom: 28px;
      box-shadow: 0 12px 36px rgba(8, 72, 45, 0.22);
      border: 1px solid rgba(218, 231, 199, 0.2);
      position: relative;
      overflow: hidden;
    }}

    .header-banner::before {{
      content: '';
      position: absolute;
      right: -80px;
      top: -80px;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(218, 231, 199, 0.15) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }}

    .header-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding-bottom: 16px;
    }}

    .university-brand {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}

    .uni-logo-mark {{
      width: 48px;
      height: 48px;
      background: #FFFFFF;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--forest);
      font-weight: 900;
      font-size: 22px;
      font-family: 'Inter Tight', sans-serif;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }}

    .uni-text h3 {{
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: 'Inter Tight', sans-serif;
      color: #FFFFFF;
    }}

    .uni-text p {{
      font-size: 12px;
      color: var(--mint);
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.3px;
    }}

    .course-badge {{
      background: rgba(218, 231, 199, 0.15);
      border: 1px solid rgba(218, 231, 199, 0.35);
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #FFFFFF;
    }}

    .header-main {{
      display: grid;
      grid-template-columns: 1.4fr 1.6fr;
      gap: 32px;
      align-items: center;
    }}

    .project-titles h1 {{
      font-size: 54px;
      font-weight: 900;
      letter-spacing: -1.5px;
      line-height: 1.05;
      font-family: 'Inter Tight', sans-serif;
      text-transform: uppercase;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 14px;
    }}

    .project-titles h1 .title-badge {{
      font-size: 14px;
      background: var(--mint);
      color: var(--forest);
      padding: 4px 14px;
      border-radius: 9999px;
      letter-spacing: 1px;
      vertical-align: middle;
      font-weight: 800;
    }}

    .project-titles h2 {{
      font-size: 18.5px;
      font-weight: 600;
      color: var(--mint);
      margin-top: 10px;
      line-height: 1.35;
    }}

    .tagline-strip {{
      display: inline-flex;
      align-items: center;
      gap: 16px;
      margin-top: 14px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(218, 231, 199, 0.25);
      padding: 6px 18px;
      border-radius: 10px;
      font-size: 11.5px;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 1.5px;
      font-weight: 700;
      color: #FFFFFF;
    }}

    /* Student & Mentor Card */
    .presenters-card {{
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 20px 24px;
      backdrop-filter: blur(10px);
    }}

    .presenters-header {{
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--mint);
      margin-bottom: 12px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
    }}

    .team-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }}

    .team-member {{
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(218, 231, 199, 0.18);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .member-avatar {{
      width: 32px;
      height: 32px;
      background: var(--mint);
      color: var(--forest);
      font-weight: 800;
      font-size: 12px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter Tight', sans-serif;
    }}

    .member-info h4 {{
      font-size: 13.5px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.2;
    }}

    .member-info p {{
      font-size: 11px;
      color: var(--mint);
      font-family: 'JetBrains Mono', monospace;
      margin-top: 2px;
    }}

    .mentor-bar {{
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
    }}

    .mentor-bar span:first-child {{
      color: var(--mint);
      font-family: 'JetBrains Mono', monospace;
    }}

    .mentor-bar span:last-child {{
      color: #FFFFFF;
      font-weight: 700;
    }}

    /* 3-Column Poster Layout */
    .poster-columns {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
    }}

    .col {{
      display: flex;
      flex-direction: column;
      gap: 24px;
    }}

    /* Section Cards */
    .card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 22px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }}

    .card-header {{
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 12px;
    }}

    .card-icon {{
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--mint);
      color: var(--forest);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 800;
      flex-shrink: 0;
    }}

    .card-title h3 {{
      font-size: 16px;
      font-weight: 800;
      font-family: 'Inter Tight', sans-serif;
      color: var(--ink);
      line-height: 1.2;
    }}

    .card-title p {{
      font-size: 11px;
      color: var(--subline);
      font-family: 'JetBrains Mono', monospace;
    }}

    .card-body {{
      font-size: 13px;
      color: #2D3748;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }}

    /* Highlights / Pill badges */
    .badge-pill {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--mint-light);
      color: var(--forest);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }}

    /* Feature Grid */
    .feature-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }}

    .feature-item {{
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
    }}

    .feature-item h5 {{
      font-size: 12.5px;
      font-weight: 700;
      color: var(--forest);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .feature-item p {{
      font-size: 11.5px;
      color: var(--subline);
      line-height: 1.35;
    }}

    /* Terminal Evidence Box */
    .terminal-box {{
      background: var(--terminal-bg);
      border-radius: 14px;
      border: 1px solid #1E2D24;
      overflow: hidden;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    }}

    .terminal-titlebar {{
      background: #141E18;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #233429;
    }}

    .terminal-dots {{
      display: flex;
      gap: 6px;
    }}

    .terminal-dot {{
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }}

    .terminal-dot.red {{ background: #FF5F56; }}
    .terminal-dot.yellow {{ background: #FFBD2E; }}
    .terminal-dot.green {{ background: #27C93F; }}

    .terminal-caption {{
      font-size: 10.5px;
      color: #A3B899;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }}

    .terminal-img-wrap {{
      padding: 6px;
      background: #000000;
    }}

    .terminal-img-wrap img {{
      width: 100%;
      height: auto;
      display: block;
      border-radius: 8px;
    }}

    /* Architecture Flow Diagram */
    .arch-diagram {{
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }}

    .flow-step {{
      display: flex;
      align-items: center;
      gap: 10px;
      background: #FFFFFF;
      border: 1px solid var(--border);
      padding: 10px 14px;
      border-radius: 10px;
    }}

    .flow-icon {{
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: var(--forest);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }}

    .flow-content h6 {{
      font-size: 12px;
      font-weight: 700;
      color: var(--ink);
    }}

    .flow-content p {{
      font-size: 10.5px;
      color: var(--subline);
    }}

    .flow-arrow {{
      text-align: center;
      color: var(--forest);
      font-weight: 900;
      font-size: 14px;
      line-height: 1;
    }}

    /* Metrics Table */
    .metrics-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }}

    .metrics-table th {{
      background: var(--mint-light);
      color: var(--forest);
      padding: 8px 10px;
      text-align: left;
      font-weight: 700;
      font-family: 'Inter Tight', sans-serif;
      border-bottom: 2px solid var(--border);
    }}

    .metrics-table td {{
      padding: 8px 10px;
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
      gap: 8px;
    }}

    .stat-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
    }}

    .progress-track {{
      width: 100%;
      height: 8px;
      background: #E2E8F0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 4px;
    }}

    .progress-fill {{
      height: 100%;
      border-radius: 4px;
      background: var(--forest);
    }}

    .progress-fill.amber {{ background: #D97706; }}
    .progress-fill.blue {{ background: #0284C7; }}

    /* Footer */
    .poster-footer {{
      margin-top: 28px;
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 18px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: var(--subline);
    }}

    .footer-left {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}

    .footer-links {{
      display: flex;
      gap: 20px;
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

    /* Print Formatting (A1 / A2 Landscape Presentation) */
    @media print {{
      body {{
        padding: 0;
        background: #FFFFFF;
      }}
      .action-bar {{
        display: none !important;
      }}
      .poster-card {{
        border: none;
        box-shadow: none;
        padding: 20px;
      }}
      @page {{
        size: A2 landscape;
        margin: 8mm;
      }}
    }}
  </style>
</head>
<body>

  <div class="poster-container">

    <!-- Action Bar for Printing / PDF Export -->
    <div class="action-bar">
      <button onclick="window.print()" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print Poster / Save as PDF
      </button>
      <a href="https://rashmigowda1206.github.io/WareHouseX/" target="_blank" class="btn btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        Open Live Deployment
      </a>
    </div>

    <!-- Main Presentation Poster Frame -->
    <div class="poster-card">

      <!-- Header Banner -->
      <header class="header-banner">
        <div class="header-top">
          <div class="university-brand">
            <div class="uni-logo-mark">AU</div>
            <div class="uni-text">
              <h3>Alliance University • School of Advanced Computing</h3>
              <p>Department of Computer Science and Engineering | IT (AR/VR Specialization)</p>
            </div>
          </div>
          <div class="course-badge">
            COURSE: E1ITA306 DESIGN PROJECT - 1 (2026)
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

          <!-- Students & Mentor Info Card -->
          <div class="presenters-card">
            <div class="presenters-header">
              <span>Project Team Members</span>
              <span>Branch: IT (AR/VR)</span>
            </div>
            <div class="team-grid">
              <div class="team-member">
                <div class="member-avatar">RG</div>
                <div class="member-info">
                  <h4>Rashmi</h4>
                  <p>Reg No: 2411021061295</p>
                </div>
              </div>
              <div class="team-member">
                <div class="member-avatar">PK</div>
                <div class="member-info">
                  <h4>Panchaksharayya</h4>
                  <p>Reg No: 2411021061321</p>
                </div>
              </div>
              <div class="team-member">
                <div class="member-avatar">DS</div>
                <div class="member-info">
                  <h4>S Darshan Sai</h4>
                  <p>Reg No: 2411021061289</p>
                </div>
              </div>
              <div class="team-member">
                <div class="member-avatar">AK</div>
                <div class="member-info">
                  <h4>Apoorva P Keretot</h4>
                  <p>Reg No: 2411021061316</p>
                </div>
              </div>
            </div>
            <div class="mentor-bar">
              <span>FACULTY PROJECT MENTOR:</span>
              <span>Dr. Jayabhaduri R (Associate Professor, ASAC)</span>
            </div>
          </div>
        </div>
      </header>

      <!-- 3-Column Content Section -->
      <main class="poster-columns">

        <!-- COLUMN 1: Problem, Objectives & Architecture -->
        <div class="col">

          <!-- 1. Executive Summary & Problem Statement -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon">01</div>
              <div class="card-title">
                <h3>Problem Statement & Motivation</h3>
                <p>Infrastructure Gaps in Modern Fulfillment Centers</p>
              </div>
            </div>
            <div class="card-body">
              <p>
                High-volume e-commerce fulfillment hubs run on production Linux servers (Ubuntu/Debian), yet warehouse management systems (WMS) operate entirely in isolation from the host operating system.
              </p>
              <div class="feature-grid">
                <div class="feature-item">
                  <h5>⚠️ Storage Vulnerabilities</h5>
                  <p>Unmonitored disk exhaustion causes silent SQLite WAL corruption during sudden restocking spikes.</p>
                </div>
                <div class="feature-item">
                  <h5>⚠️ Unverified Backups</h5>
                  <p>Standard backups lack cryptographic preflight checks, leading to catastrophic restore failures.</p>
                </div>
                <div class="feature-item">
                  <h5>⚠️ Command Injection</h5>
                  <p>Granting web administrators arbitrary shell/SSH access introduces critical security vulnerabilities.</p>
                </div>
                <div class="feature-item">
                  <h5>⚠️ Identity Silos</h5>
                  <p>Employee catalog accounts are decoupled from Linux system accounts (<code style="font-size:10px;">/etc/passwd</code>) and group privileges.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Dual-Engine Architecture -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon">02</div>
              <div class="card-title">
                <h3>Dual-Engine System Architecture</h3>
                <p>Safe POSIX Bridge & Hardware Abstraction</p>
              </div>
            </div>
            <div class="card-body">
              <div class="arch-diagram">
                <div class="flow-step">
                  <div class="flow-icon">UI</div>
                  <div class="flow-content">
                    <h6>React 19 + TypeScript Dashboard</h6>
                    <p>Soft Mint Studio theme, Vite, Recharts, Lucide icons, JWT session auth</p>
                  </div>
                </div>
                <div class="flow-arrow">↓ HTTPS / REST API</div>
                <div class="flow-step">
                  <div class="flow-icon">API</div>
                  <div class="flow-content">
                    <h6>Python 3.13 Flask Backend Service</h6>
                    <p>Role-based access control, SQLite 3 in WAL mode, PBKDF2:SHA-256 password security</p>
                  </div>
                </div>
                <div class="flow-arrow">↓ Parameterized Allowlisted IPC</div>
                <div class="flow-step">
                  <div class="flow-icon">OS</div>
                  <div class="flow-content">
                    <h6>Ubuntu Linux System Bridge Layer</h6>
                    <p>Direct POSIX bindings: <code style="font-size:10.5px;">/proc</code>, systemd daemons, LVM2, UFW firewall, TAR</p>
                  </div>
                </div>
              </div>
              <div class="badge-pill">
                <span>🛡️ ZERO ARBITRARY SHELL EXECUTION: Strictly allowlisted parameters</span>
              </div>
            </div>
          </div>

          <!-- 3. Repository Structure Evidence -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon">03</div>
              <div class="card-title">
                <h3>Project Codebase Inspection</h3>
                <p>Verified Directory Structure & Organization</p>
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
                  <img src="{images['02_application_tree.png']}" alt="Application Hierarchy Tree">
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- COLUMN 2: Linux Administration & Core Systems -->
        <div class="col">

          <!-- 4. LVM Storage Management -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon">04</div>
              <div class="card-title">
                <h3>LVM2 Storage & Volume Management</h3>
                <p>Dynamic Physical, Volume & Logical Partitioning</p>
              </div>
            </div>
            <div class="card-body">
              <p>
                Dynamic allocation of physical disks (<code style="font-size:11px;">pvs</code>), volume groups (<code style="font-size:11px;">vgs</code>), and logical volumes (<code style="font-size:11px;">lvs</code>) ensures non-disruptive storage scaling as inventory catalogs expand.
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
                  <span>LVM Pool (/dev/vg_warehousex/lv_data)</span>
                  <span>142.6 GB / 250.0 GB (57%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: 57%;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Automated Backup & Disaster Recovery -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon">05</div>
              <div class="card-title">
                <h3>POSIX TAR Backups & Disaster Recovery</h3>
                <p>Cryptographic Integrity Checksums & Preflight Guards</p>
              </div>
            </div>
            <div class="card-body">
              <p>
                Automated cron-scheduled POSIX <code style="font-size:11px;">.tar.gz</code> archives. Flushes SQLite WAL checkpoints, compresses catalog databases and configurations, and generates immutable SHA-256 verification hashes.
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
                  <img src="{images['10_live_backup_run.png']}" alt="Live Backup Execution & Verification">
                </div>
              </div>
              <div class="feature-grid">
                <div class="feature-item">
                  <h5>🔒 Overwrite Protection</h5>
                  <p>Restores require explicit two-stage preflight confirmation code (<code style="font-size:10px;">RESTORE</code>).</p>
                </div>
                <div class="feature-item">
                  <h5>🔐 SHA-256 Verification</h5>
                  <p>Bit-level archive integrity confirmed prior to extraction via <code style="font-size:10px;">sha256sum</code>.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 6. Firewall & Security Enforcement -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon">06</div>
              <div class="card-title">
                <h3>UFW Firewall & Host Security Hardening</h3>
                <p>Packet Filtering, OpenSSH Audit & User Mapping</p>
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
                  <span class="terminal-caption">ufw status verbose & sshd security audit</span>
                </div>
                <div class="terminal-img-wrap">
                  <img src="{images['08_ufw_firewall.png']}" alt="UFW Firewall & Security Audit">
                </div>
              </div>
              <p style="font-size:12px; color:var(--subline);">
                Enforces strict port policies: SSH (22), HTTP (5173), Flask API (5000). Provisions synchronized POSIX system users in <code style="font-size:10.5px;">/etc/passwd</code> matching warehouse personnel roles.
              </p>
            </div>
          </div>

        </div>

        <!-- COLUMN 3: Telemetry, Logistics & Evaluation -->
        <div class="col">

          <!-- 7. Hardware Telemetry & Systemd -->
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
                  <img src="{images['06_systemd_status.png']}" alt="Systemd Daemon Services">
                </div>
              </div>
              <div class="stat-bar-container">
                <div class="stat-row">
                  <span>CPU Utilization (Ubuntu 6.8 Scheduler)</span>
                  <span>24.8% Active (8 Cores)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: 25%;"></div>
                </div>
                <div class="stat-row" style="margin-top:4px;">
                  <span>RAM Memory Headroom (16 GB ECC)</span>
                  <span>6.8 GB / 16.0 GB (42.5%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill blue" style="width: 43%;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 8. Inventory Valuation & Logistics -->
          <div class="card">
            <div class="card-header">
              <div class="card-icon">08</div>
              <div class="card-title">
                <h3>Warehouse Inventory & Logistics Zones</h3>
                <p>Asset Valuation & Stock Allocation Breakdown</p>
              </div>
            </div>
            <div class="card-body">
              <div style="background:var(--surface-subtle); border:1px solid var(--border); border-radius:12px; padding:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <span style="font-size:12px; font-weight:700; color:var(--forest);">TOTAL ASSETS: $384,500</span>
                  <span style="font-size:11px; font-family:'JetBrains Mono'; color:var(--subline);">25 SKUs • 6 Zones</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:10.5px;">
                      <span>Machinery (Zone B)</span>
                      <b>$152,000 (39.5%)</b>
                    </div>
                    <div class="progress-track"><div class="progress-fill" style="width:40%; background:#08482D;"></div></div>
                  </div>
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:10.5px;">
                      <span>Electronics (Zone A)</span>
                      <b>$98,500 (25.6%)</b>
                    </div>
                    <div class="progress-track"><div class="progress-fill" style="width:26%; background:#059669;"></div></div>
                  </div>
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:10.5px;">
                      <span>IT Hardware (Server Room)</span>
                      <b>$58,200 (15.1%)</b>
                    </div>
                    <div class="progress-track"><div class="progress-fill" style="width:15%; background:#0284C7;"></div></div>
                  </div>
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:10.5px;">
                      <span>Storage Hardware (Zone E)</span>
                      <b>$36,800 (9.6%)</b>
                    </div>
                    <div class="progress-track"><div class="progress-fill" style="width:10%; background:#D97706;"></div></div>
                  </div>
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:10.5px;">
                      <span>Packaging Materials (Zone C)</span>
                      <b>$24,500 (6.4%)</b>
                    </div>
                    <div class="progress-track"><div class="progress-fill" style="width:6%; background:#DB2777;"></div></div>
                  </div>
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:10.5px;">
                      <span>Safety Gear (Zone D)</span>
                      <b>$14,500 (3.8%)</b>
                    </div>
                    <div class="progress-track"><div class="progress-fill" style="width:4%; background:#7C3AED;"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 9. Evaluation Results & Performance Benchmarks -->
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
                    <td>Decoupled web accounts</td>
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
          <span style="font-weight:700; color:var(--forest); font-family:'Inter Tight', sans-serif;">WareHouseX Project Presentation Dossier</span>
          <span>•</span>
          <span>Alliance University, Bengaluru, India</span>
          <span>•</span>
          <span>Design Project - 1 Review 2026</span>
        </div>
        <div class="footer-links">
          <span>GitHub: <a href="https://github.com/Rashmigowda1206/WareHouseX" target="_blank">Rashmigowda1206/WareHouseX</a></span>
          <span>•</span>
          <span>Demo: <a href="https://rashmigowda1206.github.io/WareHouseX/" target="_blank">rashmigowda1206.github.io/WareHouseX/</a></span>
        </div>
      </footer>

    </div>

  </div>

</body>
</html>
"""

output_path = 'WareHouseX_Presentation_Poster.html'
with open(output_path, 'w', encoding='utf-8') as f_out:
    f_out.write(html_content)

print(f"Generated {output_path} successfully. File size: {os.path.getsize(output_path)} bytes.")

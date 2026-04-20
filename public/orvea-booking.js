(function () {
  function initOrveaBooking() {
    const root = document.getElementById('orvea-booking-embed');
    if (!root) return;
    if (root.dataset.orveaInitialized === 'true') return;
    root.dataset.orveaInitialized = 'true';

    const styleId = 'orvea-booking-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
  #orvea-booking-embed,
  #orvea-booking-embed * {
    box-sizing: border-box;
  }

  #orvea-booking-embed {
    --orv-bg-page: #f6f1eb;
    --orv-box-bg: #18211E;
    --orv-box-text: #EAEBEA;
    --orv-box-muted: rgba(234, 235, 234, 0.78);
    --orv-box-soft: rgba(234, 235, 234, 0.08);
    --orv-box-border: rgba(234, 235, 234, 0.18);
    --orv-box-border-strong: rgba(234, 235, 234, 0.34);
    --orv-selected-bg: #24312D;
    --orv-selected-border: rgba(234, 235, 234, 0.5);
    --orv-danger-bg: #3a1f1f;
    --orv-danger-border: rgba(255, 160, 160, 0.25);
    --orv-danger-text: #ffd7d7;
    --orv-ok-bg: #1e332b;
    --orv-ok-border: rgba(152, 214, 177, 0.25);
    --orv-ok-text: #d8f5e2;
    --orv-accent-bg: rgba(234, 235, 234, 0.12);

    --orv-radius-panel: 12px;
    --orv-radius-card: 10px;
    --orv-radius-input: 10px;
    --orv-radius-btn: 10px;

    --orv-copy-size: 15px;
    --orv-summary-label-size: 11px;
    --orv-summary-value-size: 15px;
    --orv-summary-title-size: 2rem;
    --orv-card-title-size: 2rem;

    --orv-shadow: 0 18px 45px rgba(0, 0, 0, 0.12);

    width: 100%;
    background: var(--orv-bg-page);
    color: #18211E;
    font-family: "BeausiteClassic", Arial, sans-serif;
    padding: 0;
    margin: 0;
  }

  #orvea-booking-embed .orv-wrap {
    width: 100%;
    max-width: 1240px;
    margin: 0 auto;
    padding: 20px;
  }

  #orvea-booking-embed .orv-layout {
    display: grid;
    gap: 24px;
  }

  #orvea-booking-embed .orv-panel {
    background: var(--orv-box-bg);
    color: var(--orv-box-text);
    border: 1px solid var(--orv-box-border);
    border-radius: var(--orv-radius-panel);
    box-shadow: var(--orv-shadow);
    padding: 28px;
    overflow: hidden;
  }

  #orvea-booking-embed h1,
  #orvea-booking-embed h2,
  #orvea-booking-embed h3,
  #orvea-booking-embed h4,
  #orvea-booking-embed p {
    margin: 0;
  }

  #orvea-booking-embed .orv-summary-title {
    font-family: "Exposure", "Times New Roman", serif;
    font-size: var(--orv-summary-title-size);
    line-height: 1.18;
    color: var(--orv-box-text);
    margin: 0 auto 22px;
    max-width: 860px;
    text-align: center;
    letter-spacing: 0;
  }

  #orvea-booking-embed .orv-copy,
  #orvea-booking-embed .orv-muted {
    color: var(--orv-box-muted);
    line-height: 1.7;
    font-size: var(--orv-copy-size);
    font-family: "BeausiteClassic", Arial, sans-serif;
  }

  #orvea-booking-embed .orv-progress {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin: 0 0 28px;
  }

  #orvea-booking-embed .orv-step {
    border: 1px solid var(--orv-box-border);
    border-radius: var(--orv-radius-card);
    padding: 14px 16px;
    background: var(--orv-box-bg);
    color: var(--orv-box-text);
    display: flex;
    gap: 14px;
    align-items: center;
    min-height: 82px;
  }

  #orvea-booking-embed .orv-step.active {
    border-color: var(--orv-selected-border);
    background: var(--orv-selected-bg);
  }

  #orvea-booking-embed .orv-step.done .orv-dot {
    background: var(--orv-box-text);
    color: var(--orv-box-bg);
    border-color: var(--orv-box-text);
  }

  #orvea-booking-embed .orv-dot {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid var(--orv-box-border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    background: transparent;
    color: var(--orv-box-text);
    flex: 0 0 42px;
  }

  #orvea-booking-embed .orv-step strong {
    display: block;
    font-size: var(--orv-copy-size);
    line-height: 1.35;
    color: var(--orv-box-text);
    font-weight: 400;
  }

  #orvea-booking-embed .orv-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 6px;
  }

  #orvea-booking-embed .orv-summary-item {
    border: 1px solid var(--orv-box-border);
    border-radius: var(--orv-radius-card);
    padding: 14px;
    background: var(--orv-box-bg);
    color: var(--orv-box-text);
    min-height: 86px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  #orvea-booking-embed .orv-summary-item small {
    display: block;
    color: var(--orv-box-muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-size: var(--orv-summary-label-size);
  }

  #orvea-booking-embed .orv-summary-item strong {
    display: block;
    font-size: var(--orv-summary-value-size);
    color: var(--orv-box-text);
    font-weight: 400;
    line-height: 1.4;
  }

  #orvea-booking-embed .orv-cards {
    display: grid;
    gap: 16px;
    margin-top: 16px;
  }

  #orvea-booking-embed .orv-step-1 .orv-cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  #orvea-booking-embed .orv-step-2 .orv-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  #orvea-booking-embed .orv-card,
  #orvea-booking-embed .orv-slot,
  #orvea-booking-embed .orv-day,
  #orvea-booking-embed .orv-suggestion-card,
  #orvea-booking-embed .orv-segment-btn,
  #orvea-booking-embed .orv-day-nav,
  #orvea-booking-embed .orv-mode-btn,
  #orvea-booking-embed .orv-calendar-cell {
    border: 1px solid var(--orv-box-border);
    background: var(--orv-box-bg);
    color: var(--orv-box-text);
    border-radius: var(--orv-radius-card);
    padding: 22px;
    cursor: pointer;
    transition: .18s ease;
    text-align: left;
    font-family: "BeausiteClassic", Arial, sans-serif;
  }

  #orvea-booking-embed .orv-card:hover,
  #orvea-booking-embed .orv-slot:hover,
  #orvea-booking-embed .orv-day:hover,
  #orvea-booking-embed .orv-suggestion-card:hover,
  #orvea-booking-embed .orv-segment-btn:hover,
  #orvea-booking-embed .orv-day-nav:hover,
  #orvea-booking-embed .orv-mode-btn:hover,
  #orvea-booking-embed .orv-calendar-cell:hover {
    transform: translateY(-2px);
    border-color: var(--orv-box-border-strong);
    box-shadow: 0 10px 24px rgba(0,0,0,.18);
  }

  #orvea-booking-embed .orv-selected {
    border-color: var(--orv-selected-border) !important;
    background: var(--orv-selected-bg) !important;
    box-shadow: 0 10px 24px rgba(0,0,0,.18);
  }

  #orvea-booking-embed .orv-step-1 .orv-card {
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  #orvea-booking-embed .orv-step-1 .orv-card h3,
  #orvea-booking-embed .orv-step-2 .orv-card h3 {
    font-family: "Exposure", "Times New Roman", serif;
    font-size: var(--orv-card-title-size);
    line-height: 1.05;
    margin-bottom: 14px;
    color: var(--orv-box-text);
    font-weight: 400;
  }

  #orvea-booking-embed .orv-step-1 .orv-card .orv-muted,
  #orvea-booking-embed .orv-step-2 .orv-card .orv-muted {
    font-size: 15px;
    line-height: 1.6;
  }

  #orvea-booking-embed .orv-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
    align-items: end;
  }

  #orvea-booking-embed .orv-row strong {
    color: var(--orv-box-text);
    font-weight: 400;
    font-size: 28px;
    line-height: 1;
  }

  #orvea-booking-embed .orv-row .orv-muted {
    font-size: 17px;
  }

  #orvea-booking-embed .orv-status {
    border-radius: var(--orv-radius-card);
    padding: 14px 16px;
    margin-top: 16px;
    font-size: 14px;
    line-height: 1.6;
    display: none;
    white-space: pre-wrap;
    background: var(--orv-danger-bg);
    border: 1px solid var(--orv-danger-border);
    color: var(--orv-danger-text);
  }

  #orvea-booking-embed .orv-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }

  #orvea-booking-embed .orv-field label {
    font-size: 14px;
    color: var(--orv-box-text);
  }

  #orvea-booking-embed input,
  #orvea-booking-embed select {
    width: 100%;
    border: 1px solid var(--orv-box-border);
    border-radius: var(--orv-radius-input);
    padding: 14px 16px;
    background: var(--orv-box-bg);
    color: var(--orv-box-text);
    font: inherit;
    font-family: "BeausiteClassic", Arial, sans-serif;
    min-height: 52px;
    appearance: none;
  }

  #orvea-booking-embed input::placeholder {
    color: var(--orv-box-muted);
  }

  #orvea-booking-embed .orv-phone-row {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 14px;
    align-items: end;
    margin-bottom: 14px;
  }

  #orvea-booking-embed .orv-phone-row .orv-field {
    margin-bottom: 0;
  }

  #orvea-booking-embed .orv-consent-group {
    display: grid;
    gap: 14px;
    margin-top: 10px;
  }

  #orvea-booking-embed .orv-consent-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 34px;
  }

  #orvea-booking-embed .orv-consent-row .orv-consent-label {
    font-size: 14px;
    line-height: 1.4;
    color: var(--orv-box-text);
    flex: 1;
  }

  #orvea-booking-embed .orv-consent-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    min-height: 18px;
    margin: 0;
    flex: 0 0 18px;
    accent-color: #EAEBEA;
    cursor: pointer;
  }

  #orvea-booking-embed .orv-actions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 28px;
  }

  #orvea-booking-embed .orv-btn {
    appearance: none;
    border: 1px solid var(--orv-box-border);
    border-radius: var(--orv-radius-btn);
    padding: 14px 22px;
    cursor: pointer;
    font-size: 18px;
    transition: .18s ease;
    font-family: "BeausiteClassic", Arial, sans-serif;
    background: var(--orv-box-bg);
    color: var(--orv-box-text);
    min-width: 128px;
  }

  #orvea-booking-embed .orv-btn:hover {
    border-color: var(--orv-box-border-strong);
    background: var(--orv-selected-bg);
  }

  #orvea-booking-embed .orv-btn:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  #orvea-booking-embed .orv-hidden {
    display: none !important;
  }

  #orvea-booking-embed .orv-calendar-shell {
    display: grid;
    gap: 18px;
  }

  #orvea-booking-embed .orv-calendar-section {
    border: 1px solid var(--orv-box-border);
    border-radius: var(--orv-radius-card);
    padding: 18px;
    background: rgba(255,255,255,0.01);
  }

  #orvea-booking-embed .orv-calendar-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  #orvea-booking-embed .orv-calendar-title {
    font-size: 15px;
    color: var(--orv-box-text);
  }

  #orvea-booking-embed .orv-calendar-inline-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  #orvea-booking-embed .orv-mode-switch {
    display: flex;
    gap: 8px;
  }

  #orvea-booking-embed .orv-mode-btn {
    padding: 10px 14px;
    min-height: auto;
    font-size: 13px;
    line-height: 1;
    border-radius: 10px;
    background: rgba(255,255,255,0.03);
  }

  #orvea-booking-embed .orv-mode-btn.active {
    border-color: var(--orv-selected-border);
    background: var(--orv-selected-bg);
    box-shadow: none;
  }

  #orvea-booking-embed .orv-suggestions-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  #orvea-booking-embed .orv-suggestion-card {
    padding: 16px;
    display: grid;
    gap: 8px;
    min-height: 128px;
    align-content: space-between;
  }

  #orvea-booking-embed .orv-suggestion-topline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--orv-box-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  #orvea-booking-embed .orv-suggestion-card h4 {
    font-family: "Exposure", "Times New Roman", serif;
    font-size: 22px;
    line-height: 1.08;
    color: var(--orv-box-text);
    font-weight: 400;
  }

  #orvea-booking-embed .orv-suggestion-meta {
    font-size: 14px;
    color: var(--orv-box-muted);
    line-height: 1.5;
  }

  #orvea-booking-embed .orv-suggestion-footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    margin-top: 4px;
  }

  #orvea-booking-embed .orv-mini-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid var(--orv-box-border);
    border-radius: 999px;
    font-size: 12px;
    color: var(--orv-box-text);
    background: var(--orv-box-soft);
  }

  #orvea-booking-embed .orv-days-nav-wrap {
    display: grid;
    grid-template-columns: 48px repeat(10, minmax(86px, 1fr)) 48px;
    gap: 10px;
    align-items: stretch;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  #orvea-booking-embed .orv-days-nav-wrap::-webkit-scrollbar {
    height: 8px;
  }

  #orvea-booking-embed .orv-days-nav-wrap::-webkit-scrollbar-thumb {
    background: rgba(234,235,234,0.12);
    border-radius: 999px;
  }

  #orvea-booking-embed .orv-day-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 28px;
    line-height: 1;
    min-height: 92px;
    min-width: 48px;
  }

  #orvea-booking-embed .orv-day-nav:disabled {
    opacity: .28;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  #orvea-booking-embed .orv-day {
    padding: 14px 12px;
    text-align: center;
    min-height: 92px;
    min-width: 86px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  #orvea-booking-embed .orv-day strong {
    display: block;
    font-size: 17px;
    line-height: 1.2;
    color: var(--orv-box-text);
    font-weight: 400;
  }

  #orvea-booking-embed .orv-day small {
    display: block;
    margin-top: 4px;
    font-size: 13px;
    color: var(--orv-box-muted);
  }

  #orvea-booking-embed .orv-availability-dots {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-top: 10px;
  }

  #orvea-booking-embed .orv-availability-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(234,235,234,0.18);
  }

  #orvea-booking-embed .orv-availability-dot.active {
    background: #EAEBEA;
  }

  #orvea-booking-embed .orv-month-view {
    display: grid;
    gap: 14px;
  }

  #orvea-booking-embed .orv-month-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  #orvea-booking-embed .orv-month-title {
    font-size: 22px;
    color: var(--orv-box-text);
    font-family: "Exposure", "Times New Roman", serif;
    text-transform: capitalize;
  }

  #orvea-booking-embed .orv-month-nav {
    display: flex;
    gap: 8px;
  }

  #orvea-booking-embed .orv-month-nav button {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid var(--orv-box-border);
    background: var(--orv-box-bg);
    color: var(--orv-box-text);
    cursor: pointer;
    font-size: 22px;
    line-height: 1;
  }

  #orvea-booking-embed .orv-month-nav button:disabled {
    opacity: .28;
    cursor: not-allowed;
  }

  #orvea-booking-embed .orv-month-weekdays,
  #orvea-booking-embed .orv-month-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
  }

  #orvea-booking-embed .orv-month-weekdays div {
    text-align: center;
    color: var(--orv-box-muted);
    font-size: 13px;
    padding: 4px 0;
  }

  #orvea-booking-embed .orv-calendar-cell {
    min-height: 92px;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    background: rgba(255,255,255,0.01);
  }

  #orvea-booking-embed .orv-calendar-cell.empty {
    visibility: hidden;
    pointer-events: none;
  }

  #orvea-booking-embed .orv-calendar-cell.disabled {
    opacity: .35;
    cursor: not-allowed;
    pointer-events: none;
  }

  #orvea-booking-embed .orv-calendar-cell-day {
    font-size: 18px;
    color: var(--orv-box-text);
  }

  #orvea-booking-embed .orv-calendar-cell-dots {
    display: flex;
    gap: 4px;
    margin-top: 8px;
  }

  #orvea-booking-embed .orv-segments {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  #orvea-booking-embed .orv-segment-btn {
    padding: 16px;
    display: grid;
    gap: 8px;
    min-height: 96px;
    align-content: center;
  }

  #orvea-booking-embed .orv-segment-btn strong {
    font-size: 17px;
    color: var(--orv-box-text);
    font-weight: 400;
    text-align: center;
  }

  #orvea-booking-embed .orv-segment-btn small {
    font-size: 13px;
    color: var(--orv-box-muted);
    text-align: center;
  }

  #orvea-booking-embed .orv-times-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  #orvea-booking-embed .orv-slot {
    padding: 16px 14px;
    text-align: center;
    position: relative;
    min-height: 92px;
    display: grid;
    align-content: center;
    gap: 6px;
  }

  #orvea-booking-embed .orv-slot strong {
    display: block;
    color: var(--orv-box-text);
    font-weight: 400;
    font-size: 18px;
    line-height: 1.2;
  }

  #orvea-booking-embed .orv-slot small {
    display: block;
    color: var(--orv-box-muted);
    font-size: 13px;
  }

  #orvea-booking-embed .orv-slot.disabled {
    opacity: .35;
    cursor: not-allowed;
    pointer-events: none;
  }

  #orvea-booking-embed .orv-slot-scarcity {
    font-size: 11px;
    color: var(--orv-box-text);
    background: var(--orv-accent-bg);
    border: 1px solid var(--orv-box-border);
    border-radius: 999px;
    padding: 4px 8px;
    justify-self: center;
    margin-top: 2px;
  }

  #orvea-booking-embed .orv-calendar-social-proof {
    font-size: 13px;
    color: var(--orv-box-muted);
    padding: 10px 12px;
    border: 1px dashed var(--orv-box-border);
    border-radius: var(--orv-radius-card);
    background: rgba(255,255,255,0.01);
    margin-bottom: 12px;
  }

  #orvea-booking-embed .orv-calendar-loading {
    font-size: 14px;
    color: var(--orv-box-muted);
    padding: 8px 0 2px;
  }

  @media (max-width: 1280px) {
    #orvea-booking-embed .orv-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    #orvea-booking-embed .orv-progress {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    #orvea-booking-embed .orv-step-1 .orv-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    #orvea-booking-embed .orv-suggestions-grid,
    #orvea-booking-embed .orv-times-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 991px) {
    #orvea-booking-embed .orv-wrap {
      padding: 16px;
    }

    #orvea-booking-embed .orv-panel {
      padding: 20px;
    }

    #orvea-booking-embed .orv-progress {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    #orvea-booking-embed .orv-summary-title {
      font-size: 1.8rem;
    }

    #orvea-booking-embed .orv-days-nav-wrap {
      grid-template-columns: 42px repeat(10, minmax(86px, 1fr)) 42px;
    }
  }

  @media (max-width: 767px) {
    #orvea-booking-embed .orv-wrap {
      padding: 12px;
    }

    #orvea-booking-embed .orv-panel {
      padding: 16px;
      border-radius: 12px;
    }

    #orvea-booking-embed .orv-progress,
    #orvea-booking-embed .orv-summary-grid,
    #orvea-booking-embed .orv-step-1 .orv-cards,
    #orvea-booking-embed .orv-step-2 .orv-cards,
    #orvea-booking-embed .orv-suggestions-grid,
    #orvea-booking-embed .orv-segments,
    #orvea-booking-embed .orv-times-grid {
      grid-template-columns: 1fr;
    }

    #orvea-booking-embed .orv-step-1 .orv-card {
      aspect-ratio: auto;
      min-height: 220px;
    }

    #orvea-booking-embed .orv-phone-row {
      grid-template-columns: 1fr;
    }

    #orvea-booking-embed .orv-actions {
      flex-direction: column-reverse;
    }

    #orvea-booking-embed .orv-actions .orv-btn {
      width: 100%;
    }

    #orvea-booking-embed .orv-summary-title {
      font-size: 1.55rem;
    }

    #orvea-booking-embed .orv-month-weekdays,
    #orvea-booking-embed .orv-month-grid {
      gap: 6px;
    }

    #orvea-booking-embed .orv-calendar-cell {
      min-height: 74px;
      padding: 8px 6px;
    }

    #orvea-booking-embed .orv-calendar-cell-day {
      font-size: 16px;
    }

    #orvea-booking-embed .orv-step {
      min-height: auto;
      padding: 12px 14px;
    }

    #orvea-booking-embed .orv-step strong {
      font-size: 14px;
    }

    #orvea-booking-embed .orv-dot {
      width: 36px;
      height: 36px;
      flex: 0 0 36px;
      font-size: 16px;
    }
  }
      `;
      document.head.appendChild(style);
    }

    root.innerHTML = `
      <div class="orv-wrap">
        <div class="orv-layout">
          <aside class="orv-panel">
            <h2 class="orv-summary-title">Nur noch wenige Schritte bis zu deinem ORVĒA-Erlebnis<br>Deine Terminübersicht</h2>

            <div class="orv-summary-grid">
              <div class="orv-summary-item"><small>Kategorie</small><strong data-sum-category>Noch nicht gewählt</strong></div>
              <div class="orv-summary-item"><small>Treatment</small><strong data-sum-service>Noch nicht gewählt</strong></div>
              <div class="orv-summary-item"><small>Termin</small><strong data-sum-slot>Noch nicht gewählt</strong></div>
              <div class="orv-summary-item"><small>Status</small><strong data-sum-status>Bereit</strong></div>
            </div>
          </aside>

          <div class="orv-panel">
            <div class="orv-progress" data-progress></div>

            <section class="orv-step-1" data-step="1">
              <p class="orv-copy">Wähle bitte eine Behandlungskategorie.</p>
              <div class="orv-cards" data-categories></div>
            </section>

            <section class="orv-step-2 orv-hidden" data-step="2">
              <p class="orv-copy">Wähle bitte ein passendes Treatment.</p>
              <div class="orv-cards" data-services></div>
            </section>

            <section class="orv-step-3 orv-hidden" data-step="3">
              <div class="orv-calendar-shell">
                <div class="orv-calendar-section">
                  <div class="orv-calendar-section-header">
                    <h3 class="orv-calendar-title">Smart Suggestions</h3>
                  </div>
                  <div class="orv-suggestions-grid" data-smart-suggestions></div>
                </div>

                <div class="orv-calendar-section">
                  <div class="orv-calendar-section-header">
                    <h3 class="orv-calendar-title">Tag auswählen</h3>
                    <div class="orv-calendar-inline-controls">
                      <div class="orv-mode-switch">
                        <button type="button" class="orv-mode-btn active" data-mode-btn="strip">Tage</button>
                        <button type="button" class="orv-mode-btn" data-mode-btn="month">Monat</button>
                      </div>
                    </div>
                  </div>

                  <div data-strip-mode>
                    <div class="orv-days-nav-wrap" data-days></div>
                  </div>

                  <div class="orv-hidden" data-month-mode>
                    <div class="orv-month-view">
                      <div class="orv-month-header">
                        <div class="orv-month-title" data-month-title></div>
                        <div class="orv-month-nav">
                          <button type="button" data-month-prev>‹</button>
                          <button type="button" data-month-next>›</button>
                        </div>
                      </div>
                      <div class="orv-month-weekdays">
                        <div>Mo</div>
                        <div>Di</div>
                        <div>Mi</div>
                        <div>Do</div>
                        <div>Fr</div>
                        <div>Sa</div>
                        <div>So</div>
                      </div>
                      <div class="orv-month-grid" data-month-grid></div>
                    </div>
                  </div>
                </div>

                <div class="orv-calendar-section">
                  <div class="orv-calendar-section-header">
                    <h3 class="orv-calendar-title">Uhrzeitbereich wählen</h3>
                  </div>
                  <div class="orv-segments" data-time-segments></div>
                </div>

                <div class="orv-calendar-section">
                  <div class="orv-calendar-section-header">
                    <h3 class="orv-calendar-title">Uhrzeit auswählen</h3>
                    <div class="orv-calendar-title" data-slot-meta>Bitte wähle zuerst einen Uhrzeitbereich.</div>
                  </div>

                  <div class="orv-calendar-social-proof">
                    3 Personen haben heute bereits einen Termin gebucht.
                  </div>

                  <div class="orv-calendar-loading orv-hidden" data-slot-loading>Uhrzeiten werden geladen …</div>
                  <div class="orv-times-grid" data-slots></div>
                </div>
              </div>
            </section>

            <section class="orv-step-4 orv-hidden" data-step="4">
              <p class="orv-copy">Bitte alle Felder ausfüllen, um die Buchung verbindlich abzuschließen.</p>

              <div class="orv-field">
                <label for="orv-first-name">Vorname</label>
                <input id="orv-first-name" data-first-name />
              </div>

              <div class="orv-field">
                <label for="orv-last-name">Nachname</label>
                <input id="orv-last-name" data-last-name />
              </div>

              <div class="orv-field">
                <label for="orv-email">E-Mail</label>
                <input id="orv-email" type="email" data-email />
              </div>

              <div class="orv-phone-row">
                <div class="orv-field">
                  <label for="orv-phone-dir">Ländervorwahl</label>
                  <select id="orv-phone-dir" data-phone-dir>
                    <option value="+49" selected>🇩🇪 Deutschland (+49)</option>
                    <option value="+41">🇨🇭 Schweiz (+41)</option>
                    <option value="+43">🇦🇹 Österreich (+43)</option>
                    <option value="+48">🇵🇱 Polen (+48)</option>
                    <option value="+420">🇨🇿 Tschechien (+420)</option>
                    <option value="+33">🇫🇷 Frankreich (+33)</option>
                    <option value="+31">🇳🇱 Niederlande (+31)</option>
                    <option value="+32">🇧🇪 Belgien (+32)</option>
                    <option value="+352">🇱🇺 Luxemburg (+352)</option>
                    <option value="+45">🇩🇰 Dänemark (+45)</option>
                    <option value="+44">🇬🇧 Großbritannien (+44)</option>
                    <option value="+93">🇦🇫 Afghanistan (+93)</option>
                    <option value="+355">🇦🇱 Albania (+355)</option>
                    <option value="+213">🇩🇿 Algeria (+213)</option>
                    <option value="+376">🇦🇩 Andorra (+376)</option>
                    <option value="+244">🇦🇴 Angola (+244)</option>
                    <option value="+1-268">🇦🇬 Antigua und Barbuda (+1-268)</option>
                    <option value="+54">🇦🇷 Argentina (+54)</option>
                    <option value="+374">🇦🇲 Armenia (+374)</option>
                    <option value="+61">🇦🇺 Australia (+61)</option>
                    <option value="+994">🇦🇿 Azerbaijan (+994)</option>
                    <option value="+1-242">🇧🇸 Bahamas (+1-242)</option>
                    <option value="+973">🇧🇭 Bahrain (+973)</option>
                    <option value="+880">🇧🇩 Bangladesh (+880)</option>
                    <option value="+1-246">🇧🇧 Barbados (+1-246)</option>
                    <option value="+375">🇧🇾 Belarus (+375)</option>
                    <option value="+501">🇧🇿 Belize (+501)</option>
                    <option value="+229">🇧🇯 Benin (+229)</option>
                    <option value="+975">🇧🇹 Bhutan (+975)</option>
                    <option value="+591">🇧🇴 Bolivia (+591)</option>
                    <option value="+387">🇧🇦 Bosnien und Herzegowina (+387)</option>
                    <option value="+267">🇧🇼 Botswana (+267)</option>
                    <option value="+55">🇧🇷 Brazil (+55)</option>
                    <option value="+673">🇧🇳 Brunei (+673)</option>
                    <option value="+359">🇧🇬 Bulgaria (+359)</option>
                    <option value="+226">🇧🇫 Burkina Faso (+226)</option>
                    <option value="+257">🇧🇮 Burundi (+257)</option>
                    <option value="+56">🇨🇱 Chile (+56)</option>
                    <option value="+86">🇨🇳 China (+86)</option>
                    <option value="+506">🇨🇷 Costa Rica (+506)</option>
                    <option value="+225">🇨🇮 Côte d’Ivoire (+225)</option>
                    <option value="+53">🇨🇺 Kuba (+53)</option>
                    <option value="+357">🇨🇾 Zypern (+357)</option>
                    <option value="+243">🇨🇩 Demokratische Republik Kongo (+243)</option>
                    <option value="+253">🇩🇯 Dschibuti (+253)</option>
                    <option value="+1-767">🇩🇲 Dominica (+1-767)</option>
                    <option value="+1-809">🇩🇴 Dominikanische Republik (+1-809)</option>
                    <option value="+593">🇪🇨 Ecuador (+593)</option>
                    <option value="+20">🇪🇬 Ägypten (+20)</option>
                    <option value="+503">🇸🇻 El Salvador (+503)</option>
                    <option value="+240">🇬🇶 Äquatorialguinea (+240)</option>
                    <option value="+291">🇪🇷 Eritrea (+291)</option>
                    <option value="+372">🇪🇪 Estland (+372)</option>
                    <option value="+268">🇸🇿 Eswatini (+268)</option>
                    <option value="+251">🇪🇹 Äthiopien (+251)</option>
                    <option value="+679">🇫🇯 Fidschi (+679)</option>
                    <option value="+358">🇫🇮 Finnland (+358)</option>
                    <option value="+241">🇬🇦 Gabon (+241)</option>
                    <option value="+220">🇬🇲 Gambia (+220)</option>
                    <option value="+995">🇬🇪 Georgien (+995)</option>
                    <option value="+233">🇬🇭 Ghana (+233)</option>
                    <option value="+30">🇬🇷 Griechenland (+30)</option>
                    <option value="+1-473">🇬🇩 Grenada (+1-473)</option>
                    <option value="+299">🇬🇱 Grönland (+299)</option>
                    <option value="+502">🇬🇹 Guatemala (+502)</option>
                    <option value="+224">🇬🇳 Guinea (+224)</option>
                    <option value="+245">🇬🇼 Guinea-Bissau (+245)</option>
                    <option value="+592">🇬🇾 Guyana (+592)</option>
                    <option value="+509">🇭🇹 Haiti (+509)</option>
                    <option value="+504">🇭🇳 Honduras (+504)</option>
                    <option value="+36">🇭🇺 Hungary (+36)</option>
                    <option value="+354">🇮🇸 Island (+354)</option>
                    <option value="+91">🇮🇳 India (+91)</option>
                    <option value="+62">🇮🇩 Indonesia (+62)</option>
                    <option value="+98">🇮🇷 Iran (+98)</option>
                    <option value="+964">🇮🇶 Irak (+964)</option>
                    <option value="+353">🇮🇪 Irland (+353)</option>
                    <option value="+972">🇮🇱 Israel (+972)</option>
                    <option value="+39">🇮🇹 Italien (+39)</option>
                    <option value="+1-876">🇯🇲 Jamaika (+1-876)</option>
                    <option value="+81">🇯🇵 Japan (+81)</option>
                    <option value="+962">🇯🇴 Jordanien (+962)</option>
                    <option value="+7">🇰🇿 Kasachstan (+7)</option>
                    <option value="+254">🇰🇪 Kenia (+254)</option>
                    <option value="+686">🇰🇮 Kiribati (+686)</option>
                    <option value="+383">🇽🇰 Kosovo (+383)</option>
                    <option value="+965">🇰🇼 Kuwait (+965)</option>
                    <option value="+996">🇰🇬 Kirgisistan (+996)</option>
                    <option value="+856">🇱🇦 Laos (+856)</option>
                    <option value="+371">🇱🇻 Lettland (+371)</option>
                    <option value="+961">🇱🇧 Libanon (+961)</option>
                    <option value="+266">🇱🇸 Lesotho (+266)</option>
                    <option value="+231">🇱🇷 Liberia (+231)</option>
                    <option value="+218">🇱🇾 Libyen (+218)</option>
                    <option value="+423">🇱🇮 Liechtenstein (+423)</option>
                    <option value="+370">🇱🇹 Litauen (+370)</option>
                    <option value="+261">🇲🇬 Madagaskar (+261)</option>
                    <option value="+265">🇲🇼 Malawi (+265)</option>
                    <option value="+60">🇲🇾 Malaysia (+60)</option>
                    <option value="+960">🇲🇻 Malediven (+960)</option>
                    <option value="+223">🇲🇱 Mali (+223)</option>
                    <option value="+356">🇲🇹 Malta (+356)</option>
                    <option value="+212">🇲🇦 Marokko (+212)</option>
                    <option value="+692">🇲🇭 Marshallinseln (+692)</option>
                    <option value="+222">🇲🇷 Mauretanien (+222)</option>
                    <option value="+230">🇲🇺 Mauritius (+230)</option>
                    <option value="+52">🇲🇽 Mexiko (+52)</option>
                    <option value="+691">🇫🇲 Mikronesien (+691)</option>
                    <option value="+373">🇲🇩 Moldau (+373)</option>
                    <option value="+377">🇲🇨 Monaco (+377)</option>
                    <option value="+976">🇲🇳 Mongolei (+976)</option>
                    <option value="+382">🇲🇪 Montenegro (+382)</option>
                    <option value="+258">🇲🇿 Mosambik (+258)</option>
                    <option value="+95">🇲🇲 Myanmar (+95)</option>
                    <option value="+264">🇳🇦 Namibia (+264)</option>
                    <option value="+674">🇳🇷 Nauru (+674)</option>
                    <option value="+977">🇳🇵 Nepal (+977)</option>
                    <option value="+64">🇳🇿 Neuseeland (+64)</option>
                    <option value="+505">🇳🇮 Nicaragua (+505)</option>
                    <option value="+227">🇳🇪 Niger (+227)</option>
                    <option value="+234">🇳🇬 Nigeria (+234)</option>
                    <option value="+389">🇲🇰 Nordmazedonien (+389)</option>
                    <option value="+47">🇳🇴 Norwegen (+47)</option>
                    <option value="+968">🇴🇲 Oman (+968)</option>
                    <option value="+92">🇵🇰 Pakistan (+92)</option>
                    <option value="+680">🇵🇼 Palau (+680)</option>
                    <option value="+970">🇵🇸 Palästina (+970)</option>
                    <option value="+507">🇵🇦 Panama (+507)</option>
                    <option value="+675">🇵🇬 Papua-Neuguinea (+675)</option>
                    <option value="+595">🇵🇾 Paraguay (+595)</option>
                    <option value="+51">🇵🇪 Peru (+51)</option>
                    <option value="+63">🇵🇭 Philippinen (+63)</option>
                    <option value="+351">🇵🇹 Portugal (+351)</option>
                    <option value="+974">🇶🇦 Katar (+974)</option>
                    <option value="+40">🇷🇴 Rumänien (+40)</option>
                    <option value="+7">🇷🇺 Russland (+7)</option>
                    <option value="+250">🇷🇼 Ruanda (+250)</option>
                    <option value="+1-869">🇰🇳 St. Kitts und Nevis (+1-869)</option>
                    <option value="+1-758">🇱🇨 St. Lucia (+1-758)</option>
                    <option value="+1-784">🇻🇨 St. Vincent und die Grenadinen (+1-784)</option>
                    <option value="+685">🇼🇸 Samoa (+685)</option>
                    <option value="+378">🇸🇲 San Marino (+378)</option>
                    <option value="+239">🇸🇹 São Tomé und Príncipe (+239)</option>
                    <option value="+966">🇸🇦 Saudi-Arabien (+966)</option>
                    <option value="+221">🇸🇳 Senegal (+221)</option>
                    <option value="+381">🇷🇸 Serbien (+381)</option>
                    <option value="+248">🇸🇨 Seychellen (+248)</option>
                    <option value="+232">🇸🇱 Sierra Leone (+232)</option>
                    <option value="+65">🇸🇬 Singapur (+65)</option>
                    <option value="+421">🇸🇰 Slowakei (+421)</option>
                    <option value="+386">🇸🇮 Slowenien (+386)</option>
                    <option value="+677">🇸🇧 Salomonen (+677)</option>
                    <option value="+252">🇸🇴 Somalia (+252)</option>
                    <option value="+27">🇿🇦 Südafrika (+27)</option>
                    <option value="+82">🇰🇷 Südkorea (+82)</option>
                    <option value="+211">🇸🇸 Südsudan (+211)</option>
                    <option value="+34">🇪🇸 Spanien (+34)</option>
                    <option value="+94">🇱🇰 Sri Lanka (+94)</option>
                    <option value="+249">🇸🇩 Sudan (+249)</option>
                    <option value="+597">🇸🇷 Suriname (+597)</option>
                    <option value="+46">🇸🇪 Schweden (+46)</option>
                    <option value="+963">🇸🇾 Syrien (+963)</option>
                    <option value="+886">🇹🇼 Taiwan (+886)</option>
                    <option value="+992">🇹🇯 Tadschikistan (+992)</option>
                    <option value="+255">🇹🇿 Tansania (+255)</option>
                    <option value="+66">🇹🇭 Thailand (+66)</option>
                    <option value="+228">🇹🇬 Togo (+228)</option>
                    <option value="+676">🇹🇴 Tonga (+676)</option>
                    <option value="+1-868">🇹🇹 Trinidad und Tobago (+1-868)</option>
                    <option value="+216">🇹🇳 Tunesien (+216)</option>
                    <option value="+90">🇹🇷 Türkei (+90)</option>
                    <option value="+993">🇹🇲 Turkmenistan (+993)</option>
                    <option value="+688">🇹🇻 Tuvalu (+688)</option>
                    <option value="+256">🇺🇬 Uganda (+256)</option>
                    <option value="+380">🇺🇦 Ukraine (+380)</option>
                    <option value="+971">🇦🇪 Vereinigte Arabische Emirate (+971)</option>
                    <option value="+1">🇺🇸 USA / 🇨🇦 Kanada (+1)</option>
                    <option value="+598">🇺🇾 Uruguay (+598)</option>
                    <option value="+998">🇺🇿 Usbekistan (+998)</option>
                    <option value="+678">🇻🇺 Vanuatu (+678)</option>
                    <option value="+379">🇻🇦 Vatikanstadt (+379)</option>
                    <option value="+58">🇻🇪 Venezuela (+58)</option>
                    <option value="+84">🇻🇳 Vietnam (+84)</option>
                    <option value="+967">🇾🇪 Jemen (+967)</option>
                    <option value="+260">🇿🇲 Zambia (+260)</option>
                    <option value="+263">🇿🇼 Zimbabwe (+263)</option>
                  </select>
                </div>

                <div class="orv-field">
                  <label for="orv-phone">Telefon</label>
                  <input id="orv-phone" data-phone />
                </div>
              </div>

              <div class="orv-consent-group">
                <label class="orv-consent-row">
                  <span class="orv-consent-label">Datenschutzerklärung akzeptieren</span>
                  <input type="checkbox" data-terms />
                </label>

                <label class="orv-consent-row">
                  <span class="orv-consent-label">AGB akzeptieren</span>
                  <input type="checkbox" data-reg />
                </label>
              </div>
            </section>

            <div class="orv-status" data-status></div>

            <div class="orv-actions">
              <button class="orv-btn" type="button" data-back>Zurück</button>
              <button class="orv-btn" type="button" data-next>Weiter</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const CONFIG = {
      apiBase: 'https://orvea-clinicore-proxy.vercel.app/api/clinicore',
      bookEndpoint: 'https://orvea-clinicore-proxy.vercel.app/api/clinicore/book',
      officeId: 1,
      userId: '41c2434c-ca25-8b43-9e2d-105ce8e213b1',
      patientLanguage: 'de',
      referer: window.location.href,
      source: 'dedicated',
      maxVisibleDays: 10,
      slotDaysForward: 180,
      categories: [
        { id: 389, name: 'Beratung', desc: 'Erstgespräche und individuelle Beratung.' },
        { id: 374, name: 'Biostimulation', desc: 'Skinbooster, Polynukleotide und regenerative Behandlungen.' },
        { id: 368, name: 'Botulinumtoxin', desc: 'Botox-Behandlungen und verwandte Leistungen.' },
        { id: 383, name: 'Infusionstherapie', desc: 'Performance Drips und Infusionsleistungen.' },
        { id: 392, name: 'Laser', desc: 'Laser- und apparative Behandlungen.' },
        { id: 380, name: 'PRP', desc: 'PRP Face, Haare und Augen.' }
      ],
      categoryOverridesByName: {
        "PRP Augen": 380
      }
    };

    const state = {
      step: 1,
      category: null,
      services: [],
      service: null,
      slotsByDate: {},
      selectedDate: null,
      selectedSegment: null,
      selectedTime: null,
      bookingResult: null,
      dayOffset: 0,
      calendarMode: 'strip',
      currentMonthKey: null
    };

    const qs = (sel) => root.querySelector(sel);
    const qsa = (sel) => Array.from(root.querySelectorAll(sel));

    const ui = {
      progress: qs('[data-progress]'),
      sumCategory: qs('[data-sum-category]'),
      sumService: qs('[data-sum-service]'),
      sumSlot: qs('[data-sum-slot]'),
      sumStatus: qs('[data-sum-status]'),
      categories: qs('[data-categories]'),
      services: qs('[data-services]'),
      smartSuggestions: qs('[data-smart-suggestions]'),
      days: qs('[data-days]'),
      monthTitle: qs('[data-month-title]'),
      monthGrid: qs('[data-month-grid]'),
      monthPrev: qs('[data-month-prev]'),
      monthNext: qs('[data-month-next]'),
      timeSegments: qs('[data-time-segments]'),
      slots: qs('[data-slots]'),
      slotMeta: qs('[data-slot-meta]'),
      slotLoading: qs('[data-slot-loading]'),
      status: qs('[data-status]'),
      back: qs('[data-back]'),
      next: qs('[data-next]'),
      stripMode: qs('[data-strip-mode]'),
      monthMode: qs('[data-month-mode]'),
      modeBtns: qsa('[data-mode-btn]'),
      steps: {
        1: qs('[data-step="1"]'),
        2: qs('[data-step="2"]'),
        3: qs('[data-step="3"]'),
        4: qs('[data-step="4"]')
      },
      firstName: qs('[data-first-name]'),
      lastName: qs('[data-last-name]'),
      email: qs('[data-email]'),
      phoneDir: qs('[data-phone-dir]'),
      phone: qs('[data-phone]'),
      terms: qs('[data-terms]'),
      reg: qs('[data-reg]')
    };

    function escapeHtml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function showStatus(msg, isError = true) {
      ui.status.style.display = msg ? 'block' : 'none';
      ui.status.style.background = isError ? 'var(--orv-danger-bg)' : 'var(--orv-ok-bg)';
      ui.status.style.border = isError
        ? '1px solid var(--orv-danger-border)'
        : '1px solid var(--orv-ok-border)';
      ui.status.style.color = isError ? 'var(--orv-danger-text)' : 'var(--orv-ok-text)';
      ui.status.textContent = msg || '';
    }

    function renderProgress() {
      const steps = [
        ['Behandlungskategorie auswählen'],
        ['Treatment auswählen'],
        ['Tag und Uhrzeit auswählen'],
        ['Kontaktdaten eingeben']
      ];

      ui.progress.innerHTML = steps.map((s, i) => {
        const n = i + 1;
        const cls = state.step === n ? 'orv-step active' : state.step > n ? 'orv-step done' : 'orv-step';
        const dot = state.step > n ? '✓' : n;
        return `
          <div class="${cls}">
            <div class="orv-dot">${dot}</div>
            <div><strong>${escapeHtml(s[0])}</strong></div>
          </div>
        `;
      }).join('');
    }

    function setSummary() {
      ui.sumCategory.textContent = state.category ? state.category.name : 'Noch nicht gewählt';
      ui.sumService.textContent = state.service ? state.service.name : 'Noch nicht gewählt';
      ui.sumSlot.textContent = state.selectedDate && state.selectedTime
        ? `${formatDatePretty(state.selectedDate)} · ${state.selectedTime}`
        : 'Noch nicht gewählt';
      ui.sumStatus.textContent = state.bookingResult ? 'Gebucht' : (state.step === 4 ? 'Buchung bereit' : 'Bereit');
    }

    function setStep(n) {
      state.step = n;
      [1, 2, 3, 4].forEach(i => {
        ui.steps[i].classList.toggle('orv-hidden', i !== n);
      });
      ui.back.disabled = n === 1;
      ui.next.textContent = n === 4 ? 'Termin verbindlich buchen' : 'Weiter';
      renderProgress();
      setSummary();
      showStatus('');
    }

    function renderCategories() {
      ui.categories.innerHTML = CONFIG.categories.map(c => `
        <button class="orv-card ${state.category && state.category.name === c.name ? 'orv-selected' : ''}" type="button" data-category="${c.id}">
          <h3>${escapeHtml(c.name)}</h3>
          <p class="orv-muted">${escapeHtml(c.desc)}</p>
        </button>
      `).join('');

      qsa('[data-category]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rawId = btn.getAttribute('data-category');
          const cat = CONFIG.categories.find(x => String(x.id) === rawId);
          state.category = cat;
          state.service = null;
          state.selectedDate = null;
          state.selectedSegment = null;
          state.selectedTime = null;
          state.slotsByDate = {};
          state.bookingResult = null;
          state.dayOffset = 0;
          state.calendarMode = 'strip';
          state.currentMonthKey = null;
          renderCategories();
          setSummary();
          await loadServices();
        });
      });
    }

    async function apiGet(path) {
      const url = CONFIG.apiBase + path;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Ungültige JSON-Antwort');
      }

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      return data;
    }

    function getEffectiveCategoryId(service) {
      const serviceName = (service?.name || '').trim();
      if (CONFIG.categoryOverridesByName[serviceName] !== undefined) {
        return Number(CONFIG.categoryOverridesByName[serviceName]);
      }
      return Number(service?.categoryId);
    }

    async function loadAllServices() {
      const all = [];
      const seen = new Set();
      let page = 1;
      const maxPages = 50;

      while (page <= maxPages) {
        const data = await apiGet(`/services?page=${page}`);
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.['hydra:member'])
            ? data['hydra:member']
            : [];

        if (!items.length) break;

        let newItems = 0;
        for (const item of items) {
          if (!item || !item.uuid) continue;
          if (seen.has(item.uuid)) continue;
          seen.add(item.uuid);
          all.push(item);
          newItems += 1;
        }

        if (newItems === 0) break;
        page += 1;
      }

      return all;
    }

    async function loadServices() {
      try {
        showStatus('Leistungen werden geladen …', false);

        const allServices = await loadAllServices();

        state.services = allServices.filter(s => {
          const effectiveCategoryId = getEffectiveCategoryId(s);
          return effectiveCategoryId === Number(state.category.id);
        });

        state.services.sort((a, b) => {
          const an = (a.name || '').toLowerCase();
          const bn = (b.name || '').toLowerCase();
          return an.localeCompare(bn, 'de');
        });

        if (!state.services.length) {
          showStatus('Für diese Kategorie wurden keine Leistungen gefunden.');
          return;
        }

        renderServices();
        setStep(2);
      } catch (err) {
        showStatus('Leistungen konnten nicht geladen werden: ' + err.message);
      }
    }

    function renderServices() {
      ui.services.innerHTML = state.services.map(s => `
        <button class="orv-card ${state.service && state.service.uuid === s.uuid ? 'orv-selected' : ''}" type="button" data-service="${escapeHtml(s.uuid)}">
          <h3>${escapeHtml(s.name || '')}</h3>
          <div class="orv-row">
            <span class="orv-muted">${escapeHtml((s.duration || 30) + ' Minuten')}</span>
            <strong>${escapeHtml(s.price || '')}</strong>
          </div>
        </button>
      `).join('');

      qsa('[data-service]').forEach(btn => {
        btn.addEventListener('click', async () => {
          state.service = state.services.find(s => s.uuid === btn.getAttribute('data-service'));
          state.selectedDate = null;
          state.selectedSegment = null;
          state.selectedTime = null;
          state.bookingResult = null;
          state.dayOffset = 0;
          state.calendarMode = 'strip';
          state.currentMonthKey = null;
          renderServices();
          setSummary();
          await loadSlots();
        });
      });
    }

    async function loadSlots() {
      try {
        showStatus('Termine werden geladen …', false);
        ui.slotLoading.classList.remove('orv-hidden');

        const today = new Date().toISOString().split('T')[0];
        const path = `/slots?service=${encodeURIComponent(state.service.uuid)}&user=${encodeURIComponent(CONFIG.userId)}&days=${CONFIG.slotDaysForward}&date=${encodeURIComponent(today)}`;
        const data = await apiGet(path);

        let rawSlots = data.slots || {};
        if (Array.isArray(rawSlots)) {
          rawSlots = Object.fromEntries(
            rawSlots.map(item => [item.date, item.periods || []])
          );
        }

        state.slotsByDate = Object.fromEntries(
          Object.entries(rawSlots).map(([date, times]) => {
            if (Array.isArray(times)) return [date, normalizeTimeArray(times)];
            return [date, normalizeTimeArray(Object.keys(times || {}))];
          })
        );

        if (!Object.keys(state.slotsByDate).length) {
          ui.slotLoading.classList.add('orv-hidden');
          showStatus('Keine freien Termine gefunden.');
          return;
        }

        state.selectedDate = getEarliestDate();
        state.selectedSegment = getFirstAvailableSegment(state.selectedDate);
        state.selectedTime = null;
        state.dayOffset = 0;
        state.calendarMode = 'strip';
        state.currentMonthKey = getMonthKey(state.selectedDate);

        ensureSelectedDateVisible();
        renderCalendarExperience();
        ui.slotLoading.classList.add('orv-hidden');
        setStep(3);
      } catch (err) {
        ui.slotLoading.classList.add('orv-hidden');
        showStatus('Termine konnten nicht geladen werden: ' + err.message);
      }
    }

    function normalizeTimeArray(times) {
      return [...new Set(times)]
        .map(t => String(t).slice(0, 5))
        .filter(t => /^\\d{2}:\\d{2}$/.test(t))
        .sort((a, b) => a.localeCompare(b));
    }

    function getDateKeys() {
      return Object.keys(state.slotsByDate).sort();
    }

    function getEarliestDate() {
      return getDateKeys()[0] || null;
    }

    function timeToMinutes(time) {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    }

    function getSegmentsDefinition() {
      return [
        { key: '10-14', label: '10-14 Uhr', start: 10 * 60, end: 14 * 60 },
        { key: '14-18:30', label: '14-18:30 Uhr', start: 14 * 60, end: 18 * 60 + 30 }
      ];
    }

    function getTimesForDate(date) {
      return state.slotsByDate[date] || [];
    }

    function getTimesForSegment(date, segmentKey) {
      const segment = getSegmentsDefinition().find(s => s.key === segmentKey);
      if (!segment) return [];
      return getTimesForDate(date).filter(time => {
        const mins = timeToMinutes(time);
        return mins >= segment.start && mins < segment.end;
      });
    }

    function getFirstAvailableSegment(date) {
      const segments = getSegmentsDefinition();
      for (const segment of segments) {
        if (getTimesForSegment(date, segment.key).length) {
          return segment.key;
        }
      }
      return null;
    }

    function getAvailabilityLevel(date) {
      const count = getTimesForDate(date).length;
      if (count >= 8) return 3;
      if (count >= 4) return 2;
      if (count >= 1) return 1;
      return 0;
    }

    function formatDatePretty(date) {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
      });
    }

    function getDayLabel(date) {
      const d = new Date(date + 'T00:00:00');
      return {
        weekday: d.toLocaleDateString('de-DE', { weekday: 'short' }),
        day: d.toLocaleDateString('de-DE', { day: '2-digit' }),
        month: d.toLocaleDateString('de-DE', { month: '2-digit' })
      };
    }

    function getSmartSuggestions() {
      const dateKeys = getDateKeys();
      const allEntries = [];

      for (const date of dateKeys) {
        for (const time of getTimesForDate(date)) {
          allEntries.push({ date, time });
        }
      }

      if (!allEntries.length) return [];

      const earliest = allEntries[0];
      const middayCandidates = allEntries.filter(x => {
        const mins = timeToMinutes(x.time);
        return mins >= 12 * 60 && mins < 15 * 60;
      });
      const popular = middayCandidates[0] || allEntries[Math.min(2, allEntries.length - 1)];
      const fastest = allEntries[0];

      return [
        {
          type: 'Schnellster verfügbarer Termin',
          title: 'Direkt auswählbar',
          entry: fastest,
          scarcity: getScarcityText(fastest.date, fastest.time)
        },
        {
          type: 'Beliebtester Termin',
          title: 'Top-Zeitfenster',
          entry: popular,
          scarcity: getScarcityText(popular.date, popular.time)
        },
        {
          type: 'Frühester Termin',
          title: 'Frühester Slot',
          entry: earliest,
          scarcity: getScarcityText(earliest.date, earliest.time)
        }
      ];
    }

    function getScarcityText(date, time) {
      const samePeriodCount = getTimesForDate(date).filter(t => {
        return Math.abs(timeToMinutes(t) - timeToMinutes(time)) <= 60;
      }).length;

      const remaining = Math.max(1, Math.min(3, samePeriodCount));
      return `Nur noch ${remaining} Slot${remaining === 1 ? '' : 's'} frei`;
    }

    function getMonthKey(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }

    function parseMonthKey(monthKey) {
      const [y, m] = monthKey.split('-').map(Number);
      return { year: y, monthIndex: m - 1 };
    }

    function formatMonthTitle(monthKey) {
      const { year, monthIndex } = parseMonthKey(monthKey);
      const d = new Date(year, monthIndex, 1);
      return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }

    function getAvailableMonthKeys() {
      return [...new Set(getDateKeys().map(getMonthKey))];
    }

    function ensureCurrentMonthKey() {
      const keys = getAvailableMonthKeys();
      if (!keys.length) {
        state.currentMonthKey = null;
        return;
      }
      if (!state.currentMonthKey || !keys.includes(state.currentMonthKey)) {
        state.currentMonthKey = keys[0];
      }
    }

    function detectSegmentByTime(time) {
      const mins = timeToMinutes(time);
      const segment = getSegmentsDefinition().find(s => mins >= s.start && mins < s.end);
      return segment ? segment.key : null;
    }

    function ensureSelectedDateVisible() {
      const dates = getDateKeys();
      const index = dates.indexOf(state.selectedDate);
      if (index === -1) return;

      const end = state.dayOffset + CONFIG.maxVisibleDays - 1;

      if (index < state.dayOffset) {
        state.dayOffset = index;
      } else if (index > end) {
        state.dayOffset = index - CONFIG.maxVisibleDays + 1;
      }

      if (state.dayOffset < 0) state.dayOffset = 0;
      const maxOffset = Math.max(0, dates.length - CONFIG.maxVisibleDays);
      if (state.dayOffset > maxOffset) state.dayOffset = maxOffset;

      state.currentMonthKey = getMonthKey(state.selectedDate);
    }

    function applySuggestedSelection(date, time) {
      state.selectedDate = date;
      state.selectedSegment = detectSegmentByTime(time);
      state.selectedTime = time;
      ensureSelectedDateVisible();
      renderCalendarExperience();
      setSummary();
    }

    function renderSmartSuggestions() {
      const suggestions = getSmartSuggestions();

      ui.smartSuggestions.innerHTML = suggestions.map((suggestion, index) => `
        <button class="orv-suggestion-card" type="button" data-suggestion-index="${index}">
          <div class="orv-suggestion-topline">${escapeHtml(suggestion.type)}</div>
          <h4>${escapeHtml(formatDatePretty(suggestion.entry.date))} · ${escapeHtml(suggestion.entry.time)}</h4>
          <div class="orv-suggestion-meta">${escapeHtml(suggestion.title)}</div>
          <div class="orv-suggestion-footer">
            <span class="orv-mini-chip">${escapeHtml(suggestion.scarcity)}</span>
          </div>
        </button>
      `).join('');

      qsa('[data-suggestion-index]').forEach(btn => {
        btn.addEventListener('click', () => {
          const suggestion = suggestions[Number(btn.getAttribute('data-suggestion-index'))];
          applySuggestedSelection(suggestion.entry.date, suggestion.entry.time);
        });
      });
    }

    function renderDays() {
      const allDates = getDateKeys();
      const maxOffset = Math.max(0, allDates.length - CONFIG.maxVisibleDays);
      if (state.dayOffset > maxOffset) state.dayOffset = maxOffset;

      const visibleDates = allDates.slice(state.dayOffset, state.dayOffset + CONFIG.maxVisibleDays);

      ui.days.innerHTML = `
        <button class="orv-day-nav" type="button" data-prev-days ${state.dayOffset === 0 ? 'disabled' : ''}>‹</button>
        ${visibleDates.map(date => {
          const label = getDayLabel(date);
          const level = getAvailabilityLevel(date);

          return `
            <button class="orv-day ${state.selectedDate === date ? 'orv-selected' : ''}" type="button" data-date="${date}">
              <strong>${escapeHtml(label.weekday)} ${escapeHtml(label.day)}</strong>
              <small>${escapeHtml(label.month)}</small>
              <div class="orv-availability-dots">
                <span class="orv-availability-dot ${level >= 1 ? 'active' : ''}"></span>
                <span class="orv-availability-dot ${level >= 2 ? 'active' : ''}"></span>
                <span class="orv-availability-dot ${level >= 3 ? 'active' : ''}"></span>
              </div>
            </button>
          `;
        }).join('')}
        <button class="orv-day-nav" type="button" data-next-days ${state.dayOffset >= maxOffset ? 'disabled' : ''}>›</button>
      `;

      const prevBtn = qs('[data-prev-days]');
      const nextBtn = qs('[data-next-days]');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (state.dayOffset > 0) {
            state.dayOffset = Math.max(0, state.dayOffset - CONFIG.maxVisibleDays);
            renderDays();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (state.dayOffset < maxOffset) {
            state.dayOffset = Math.min(maxOffset, state.dayOffset + CONFIG.maxVisibleDays);
            renderDays();
          }
        });
      }

      qsa('[data-date]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedDate = btn.getAttribute('data-date');
          state.selectedSegment = getFirstAvailableSegment(state.selectedDate);
          state.selectedTime = null;
          ensureSelectedDateVisible();
          renderCalendarExperience();
          setSummary();
        });
      });
    }

    function renderMonthMode() {
      ensureCurrentMonthKey();
      const monthKey = state.currentMonthKey;
      const availableMonthKeys = getAvailableMonthKeys();

      if (!monthKey) {
        ui.monthTitle.textContent = '';
        ui.monthGrid.innerHTML = '';
        return;
      }

      ui.monthTitle.textContent = formatMonthTitle(monthKey);

      const { year, monthIndex } = parseMonthKey(monthKey);
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);

      let weekday = firstDay.getDay();
      weekday = weekday === 0 ? 7 : weekday;

      const cells = [];

      for (let i = 1; i < weekday; i++) {
        cells.push('<div class="orv-calendar-cell empty"></div>');
      }

      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, monthIndex, day);
        const iso = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0')
        ].join('-');

        const hasSlots = !!getTimesForDate(iso).length;
        const level = getAvailabilityLevel(iso);
        const selected = state.selectedDate === iso ? 'orv-selected' : '';
        const disabled = hasSlots ? '' : 'disabled';

        cells.push(`
          <button class="orv-calendar-cell ${selected} ${disabled}" type="button" data-month-date="${iso}" ${hasSlots ? '' : 'disabled'}>
            <div class="orv-calendar-cell-day">${day}</div>
            <div class="orv-calendar-cell-dots">
              <span class="orv-availability-dot ${level >= 1 ? 'active' : ''}"></span>
              <span class="orv-availability-dot ${level >= 2 ? 'active' : ''}"></span>
              <span class="orv-availability-dot ${level >= 3 ? 'active' : ''}"></span>
            </div>
          </button>
        `);
      }

      ui.monthGrid.innerHTML = cells.join('');

      qsa('[data-month-date]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedDate = btn.getAttribute('data-month-date');
          state.selectedSegment = getFirstAvailableSegment(state.selectedDate);
          state.selectedTime = null;
          ensureSelectedDateVisible();
          renderCalendarExperience();
          setSummary();
        });
      });

      const monthIndexInAvailable = availableMonthKeys.indexOf(monthKey);

      ui.monthPrev.disabled = monthIndexInAvailable <= 0;
      ui.monthNext.disabled = monthIndexInAvailable === -1 || monthIndexInAvailable >= availableMonthKeys.length - 1;

      ui.monthPrev.onclick = () => {
        if (monthIndexInAvailable > 0) {
          state.currentMonthKey = availableMonthKeys[monthIndexInAvailable - 1];
          renderMonthMode();
        }
      };

      ui.monthNext.onclick = () => {
        if (monthIndexInAvailable >= 0 && monthIndexInAvailable < availableMonthKeys.length - 1) {
          state.currentMonthKey = availableMonthKeys[monthIndexInAvailable + 1];
          renderMonthMode();
        }
      };
    }

    function renderCalendarModeSwitch() {
      ui.modeBtns.forEach(btn => {
        const mode = btn.getAttribute('data-mode-btn');
        btn.classList.toggle('active', state.calendarMode === mode);
      });
      ui.stripMode.classList.toggle('orv-hidden', state.calendarMode !== 'strip');
      ui.monthMode.classList.toggle('orv-hidden', state.calendarMode !== 'month');
    }

    function renderSegments() {
      const segments = getSegmentsDefinition();

      ui.timeSegments.innerHTML = segments.map(segment => {
        const count = state.selectedDate ? getTimesForSegment(state.selectedDate, segment.key).length : 0;
        const disabled = count === 0;

        return `
          <button class="orv-segment-btn ${state.selectedSegment === segment.key ? 'orv-selected' : ''}" type="button" data-segment="${segment.key}" ${disabled ? 'disabled' : ''}>
            <strong>${escapeHtml(segment.label)}</strong>
            <small>${count} Slot${count === 1 ? '' : 's'}</small>
          </button>
        `;
      }).join('');

      qsa('[data-segment]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedSegment = btn.getAttribute('data-segment');
          state.selectedTime = null;
          renderSegments();
          renderSlots();
          setSummary();
        });
      });
    }

    function renderSlots() {
      if (!state.selectedDate) {
        ui.slotMeta.textContent = 'Bitte wähle zuerst einen Tag.';
        ui.slots.innerHTML = '';
        return;
      }

      if (!state.selectedSegment) {
        ui.slotMeta.textContent = 'Bitte wähle zuerst einen Uhrzeitbereich.';
        ui.slots.innerHTML = '';
        return;
      }

      const segmentTimes = getTimesForSegment(state.selectedDate, state.selectedSegment);
      ui.slotMeta.textContent = segmentTimes.length
        ? `${segmentTimes.length} passende Uhrzeiten verfügbar`
        : 'In diesem Bereich sind aktuell keine Uhrzeiten verfügbar.';

      ui.slots.innerHTML = segmentTimes.map(time => `
        <button class="orv-slot ${state.selectedTime === time ? 'orv-selected' : ''}" type="button" data-time="${time}">
          <strong>${escapeHtml(time)}</strong>
          <small>${escapeHtml(state.service ? (state.service.duration || 30) + ' Min.' : '')}</small>
          <span class="orv-slot-scarcity">${escapeHtml(getScarcityText(state.selectedDate, time))}</span>
        </button>
      `).join('');

      qsa('[data-time]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.selectedTime = btn.getAttribute('data-time');
          renderSlots();
          setSummary();
        });
      });
    }

    function renderCalendarExperience() {
      renderCalendarModeSwitch();
      renderSmartSuggestions();
      renderDays();
      renderMonthMode();
      renderSegments();
      renderSlots();
      setSummary();
    }

    async function submitBooking() {
      const payload = {
        reg: ui.reg.checked ? '1' : '',
        terms: ui.terms.checked ? '1' : '',
        chosen_user: CONFIG.userId,
        chosen_service: state.service.uuid,
        office_id: CONFIG.officeId,
        chosen_date: `${state.selectedDate} ${state.selectedTime}`,
        email: ui.email.value.trim(),
        phone: ui.phone.value.trim(),
        phone_direction: ui.phoneDir.value.trim() || '+49',
        patient_name: ui.firstName.value.trim(),
        patient_lastname: ui.lastName.value.trim(),
        patient_language: CONFIG.patientLanguage,
        referer: CONFIG.referer,
        source: CONFIG.source,
        allow_payment: '1'
      };

      if (!payload.reg || !payload.terms) {
        return showStatus('Bitte AGB und Datenschutz akzeptieren.');
      }

      if (!payload.patient_name || !payload.patient_lastname || !payload.email || !payload.phone) {
        return showStatus('Bitte alle Pflichtfelder ausfüllen.');
      }

      if (!payload.chosen_user || !payload.chosen_service || !payload.chosen_date) {
        return showStatus('Bitte Leistung, Behandler und Termin auswählen.');
      }

      try {
        showStatus('Buchung wird gesendet …', false);

        const res = await fetch(CONFIG.bookEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Ungültige Antwort vom Buchungsserver');
        }

        const visitUuid = data?.output?.visit?.uuid;

        if (!res.ok || data.error || !visitUuid) {
          throw new Error(data.error || 'Buchung wurde von Clinicoresuite nicht bestätigt');
        }

        state.bookingResult = data;
        setSummary();
        showStatus('Termin erfolgreich gebucht.', false);
        ui.next.disabled = true;
      } catch (err) {
        showStatus('Buchung fehlgeschlagen: ' + err.message);
      }
    }

    ui.back.addEventListener('click', () => {
      if (state.step === 4) return setStep(3);
      if (state.step === 3) return setStep(2);
      if (state.step === 2) return setStep(1);
    });

    ui.next.addEventListener('click', async () => {
      if (state.step === 1) {
        if (!state.category) return showStatus('Bitte zuerst eine Kategorie wählen.');
        return loadServices();
      }

      if (state.step === 2) {
        if (!state.service) return showStatus('Bitte zuerst eine Leistung wählen.');
        return loadSlots();
      }

      if (state.step === 3) {
        if (!state.selectedDate || !state.selectedTime) {
          return showStatus('Bitte Datum und Uhrzeit wählen.');
        }
        return setStep(4);
      }

      if (state.step === 4) {
        return submitBooking();
      }
    });

    ui.modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.calendarMode = btn.getAttribute('data-mode-btn');
        renderCalendarModeSwitch();
        if (state.calendarMode === 'month') renderMonthMode();
      });
    });

    renderProgress();
    renderCategories();
    setSummary();
    setStep(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrveaBooking);
  } else {
    initOrveaBooking();
  }
})();

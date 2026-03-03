const getInstruction = () => {
  const instruction = `
  ===========================================================
  🚀 TRADING 212 CFD DATA EXPORTER
  ===========================================================
  Platforma Trading212 nie posiada natywnego eksportu danych CFD.
  Ten skrypt generuje plik JSON gotowy do rozliczeń podatkowych.

  ⚠️  WAŻNE OSTRZEŻENIE:
  Nie uruchamiaj skryptu kilkukrotnie w ciągu krótkiego czasu! 
  Zbyt częste zapytania mogą skutkować tymczasową blokadą konta 
  przez Trading212 (ok. 5 minut).

  Pełna instrukcja: 
  👉 https://darkspine433.github.io/T212-CFD-DATA/

  Kod źródłowy: 
  👉 https://github.com/DarkSpine433/T212-CFD-DATA/


  Autor: 「 ✦ Dawid Konopiaty (DarkSpine433) ✦ 」
  ===========================================================
`;
  return instruction;
};
1;
/* Collapsing system fixed */
async function getData(
  getCurrencies = false,
  currencyPredifined = null,
  startDatePredifined = null,
  endDatePredifined = null,
) {
  const nbpCache = {};

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getNBPExchangeRate = (currency, date) => {
    if (currency === "PLN") return Promise.resolve(1);

    const fetchWithRetry = async (targetDate, rCount) => {
      const dateString = formatDate(targetDate);
      const cacheKey = `${currency}_${dateString}`;

      if (nbpCache[cacheKey]) return nbpCache[cacheKey];

      const promise = (async () => {
        if (rCount > 10) {
          console.warn(
            `Limit NBP dla ${currency} (${dateString}) przekroczony. Używam 1:1`,
          );
          updateProgress(
            null,
            -1,
            `Limit NBP dla ${currency} (${dateString}) przekroczony. Używam 1:1`,
          );
          return 1;
        }

        try {
          const response = await fetch(
            `https://api.nbp.pl/api/exchangerates/rates/A/${currency}/${dateString}/?format=json`,
          );

          if (response.status === 404) {
            const prev = new Date(targetDate);
            prev.setDate(prev.getDate() - 1);
            return await fetchWithRetry(prev, rCount + 1);
          }

          if (!response.ok) throw new Error(`NBP API Error ${response.status}`);

          const data = await response.json();
          return data.rates[0].mid;
        } catch (e) {
          if (rCount < 10) {
            const prev = new Date(targetDate);
            prev.setDate(prev.getDate() - 1);
            return await fetchWithRetry(prev, rCount + 1);
          }
          console.warn(
            `Błąd NBP dla ${currency} (${dateString}): ${e.message}. Używam 1:1`,
          );
          updateProgress(
            null,
            -1,
            `Błąd NBP dla ${currency} (${dateString}): ${e.message}. Używam 1:1`,
          );
          return 1;
        }
      })();

      nbpCache[cacheKey] = promise;
      return promise;
    };

    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 1);
    updateProgress(
      null,
      -1,
      `Pobieranie kursu NBP dla ${currency} z dnia ${formatDate(startDate)}...`,
    );
    return fetchWithRetry(startDate, 0);
  };

  const currencyList = [
    "PLN",
    "EUR",
    "GBP",
    "USD",
    "CHF",
    "HUF",
    "CZK",
    "RON",
    "DKK",
    "NOK",
    "SEK",
    "CAD",
  ];
  if (getCurrencies) {
    return currencyList;
  }

  /*---  Pobieranie Konfiguracji (Asynchroniczne okno dialogowe) ---*/
  const getConfigurationFields = () => {
    return new Promise((resolve, reject) => {
      /* Jeśli wartości są podane jako argumenty do getData, nie pokazujemy formularza */
      if (currencyPredifined && startDatePredifined && endDatePredifined) {
        resolve({
          currency: currencyPredifined.toUpperCase(),
          startDate: startDatePredifined,
          endDate: endDatePredifined,
        });
        return;
      }

      /* Utworzenie nakładki */
      const overlay = document.createElement("div");
      overlay.id = "t212-exporter-config-overlay";
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 2147483647;
        font-family: -apple-system, system-ui, sans-serif;
      `;

      const currentYear = new Date().getFullYear();
      const defaultStart = `${currentYear - 1}-01-01`;
      const defaultEnd = `${currentYear - 1}-12-31`;

      const dialog = document.createElement("div");
      dialog.style.cssText = `
        background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); 
        border-radius: 24px; padding: 30px; width: 400px; max-width: 90vw;
        color: #f8fafc; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      `;

      dialog.innerHTML = `
        <h2 style="margin: 0 0 5px 0; font-size: 20px; font-weight: 700; color: #fff;">Konfiguracja Eksportu</h2>
        <p style="margin: 0 0 20px 0; font-size: 13px; color: #94a3b8;">Podaj walutę konta Trading212 CFD oraz zakres dat.</p>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; color: #94a3b8; margin-bottom: 5px; font-weight: 600;">Waluta</label>
          <select id="t212-cfg-currency" style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px; outline: none;">
            ${currencyList.map((c) => `<option value="${c}" ${c === "PLN" ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; color: #94a3b8; margin-bottom: 5px; font-weight: 600;">Data Początkowa (OD)</label>
          <input type="date" id="t212-cfg-start" value="${defaultStart}" style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px; outline: none; box-sizing: border-box;" />
        </div>
        
        <div style="margin-bottom: 25px;">
          <label style="display: block; font-size: 12px; color: #94a3b8; margin-bottom: 5px; font-weight: 600;">Data Końcowa (DO)</label>
          <input type="date" id="t212-cfg-end" value="${defaultEnd}" style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px; outline: none; box-sizing: border-box;" />
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="t212-cfg-cancel" style="padding: 10px 16px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;">Anuluj</button>
          <button id="t212-cfg-submit" style="padding: 10px 20px; background: #3b82f6; border: none; color: #fff; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5); transition: background 0.2s;">Rozpocznij Pobieranie</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      /* Dodanie małych efektów hover */
      const cancelBtn = document.getElementById("t212-cfg-cancel");
      const submitBtn = document.getElementById("t212-cfg-submit");

      cancelBtn.onmouseenter = () =>
        (cancelBtn.style.background = "rgba(255,255,255,0.05)");
      cancelBtn.onmouseleave = () =>
        (cancelBtn.style.background = "transparent");

      submitBtn.onmouseenter = () => (submitBtn.style.background = "#2563eb");
      submitBtn.onmouseleave = () => (submitBtn.style.background = "#3b82f6");

      cancelBtn.onclick = () => {
        overlay.remove();
        resolve(null);
      };

      submitBtn.onclick = () => {
        const selectedCurrency =
          document.getElementById("t212-cfg-currency").value;
        const selectedStart = document.getElementById("t212-cfg-start").value;
        const selectedEnd = document.getElementById("t212-cfg-end").value;

        if (!selectedStart || !selectedEnd) {
          alert("Wypełnij obie daty!");
          return;
        }

        if (new Date(selectedStart) > new Date(selectedEnd)) {
          alert("Data początkowa nie może być późniejsza niż data końcowa.");
          return;
        }

        overlay.remove();
        resolve({
          currency: selectedCurrency.toUpperCase(),
          startDate: selectedStart,
          endDate: selectedEnd,
        });
      };
    });
  };

  const config = await getConfigurationFields();
  if (!config) return; /* User cancelled */

  if (!currencyList.includes(config.currency)) {
    alert(
      `Nie obsługiwana waluta ${config.currency}. Obsługiwane waluty to ${currencyList.join(", ")}`,
    );
    return;
  }

  const accountCurrency = config.currency;
  const fromDateStr = config.startDate;
  const toDateStr = config.endDate;

  const minDate = new Date(fromDateStr);
  const maxDate = new Date(toDateStr);
  const requestBase = `https://live.trading212.com/rest/reports/`;
  const requestFilter = `&perPage=20&from=${fromDateStr}&to=${toDateStr}`;

  if (typeof maxDate === "undefined")
    throw new Error(
      "Zmienna 'maxDate' nie istnieje. Kod wklejono w złym miejscu?",
    );
  if (typeof requestBase === "undefined")
    throw new Error("Zmienna 'requestBase' nie istnieje.");

  /*---  Mechanizm autoryzacji ---*/
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };
  const session =
    getCookie("TRADING212_SESSION_LIVE") || getCookie("CUSTOMER_SESSION");

  const auth = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Trading212-Session": session,
    },
    credentials: "include",
  };
  /*
  _________________________________________________________________________________
  _________________________________________________________________________________
  */

  console.log(`%c Rozpoczynam pobieranie: ${fromDateStr} - ${toDateStr}`);
  let logsHtml = "";
  let isLogsVisible = false;
  let isMinimized = false;
  let isAutoScroll = true;
  let dragData = { isDragging: false, offsetX: 0, offsetY: 0 };
  let isDownloading = false;
  let beforeUnloadHandler = null;
  let encounteredError = false;

  const stopDownloadingCleanup = () => {
    isDownloading = false;
    try {
      if (beforeUnloadHandler)
        window.removeEventListener("beforeunload", beforeUnloadHandler);
    } catch (e) {}
  };

  /*---  Tablice Danych ---*/
  let positionDetails = [];
  let interestDetails = [];
  let feeDetails = [];

  let summary = {
    "Zysk PLN": 0,
    "Strata PLN": 0,
    "Wyniki zamknięte PLN": 0,
    "Opłaty FX PLN": 0,
    "Odsetki od gotówki PLN": 0,
    "Odsetki overnight PLN": 0,
    "Łącznie netto PLN": 0,
  };
  /*
  _________________________________________________________________________________
  _________________________________________________________________________________
  */

  /***********************************************************************************
   *
   * WIZUALIZACJA POSTĘPU POBIERANIA DANYCH
   *
   ***********************************************************************************/
  const updateProgress = (
    message,
    progressPercent = -1,
    logText = null,
    errorObj = null,
    showSpinner = true,
  ) => {
    let ui = document.getElementById("t212-exporter-progress");
    if (!ui) {
      ui = document.createElement("div");
      ui.id = "t212-exporter-progress";
      ui.style.cssText = `
        position: fixed; top: 20px; right: 20px; width: 380px; 
        background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        color: #f8fafc; font-family: -apple-system, system-ui, sans-serif; border-radius: 24px;
        z-index: 2147483647; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; user-select: none;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, width 0.3s ease, left 0.3s ease, right 0.3s ease, height 0.3s ease;
      `;
      document.body.appendChild(ui);

      const style = document.createElement("style");
      style.id = "t212-exporter-styles";
      style.innerHTML = `
        @keyframes t212-spin { 100% { transform: rotate(360deg); } }
        .t212-header { padding: 16px 20px; cursor: move; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .t212-spinner { width: 16px; height: 16px; border: 2px solid rgba(59, 130, 246, 0.2); border-radius: 50%; border-top-color: #3b82f6; animation: t212-spin 0.8s linear infinite; }
        .t212-content { padding: 20px; transition: opacity 0.3s; }
        .t212-content { position: relative; }
        .t212-msg { font-size: 13px; line-height: 1.5; color: #94a3b8; margin-bottom: 15px; }
        .t212-live-summary { position: relative; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px; margin-bottom: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; }
        .t212-stat-value { color: #f1f5f9; font-weight: 600; font-family: ui-monospace, monospace; }
        .t212-progress-bg { background: rgba(255,255,255,0.06); width: 100%; height: 6px; border-radius: 10px; overflow: hidden; display: none; margin-bottom: 15px; }
        .t212-progress-bg.show { display: block; }
        .t212-progress-bar { background: linear-gradient(90deg, #3b82f6, #2563eb); height: 100%; width: 0%; transition: width 0.4s ease; }
        .t212-btn-icon { cursor: pointer; padding: 7px; border-radius: 10px; color: #94a3b8; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; transition: all 0.2s; border: none; }
        .t212-btn-icon:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateY(-1px); }
        .t212-logs-wrapper { position: relative; margin-top: 15px; display: none; }
        .t212-logs-wrapper.show { display: block; }
        .t212-logs { background: rgba(0,0,0,0.4); padding: 12px; border-radius: 12px; max-height: 160px; overflow-y: auto; font-family: ui-monospace, monospace; font-size: 10px; color: #8899aa; border: 1px solid rgba(255,255,255,0.05); white-space: pre-wrap; word-break: break-all; scroll-behavior: smooth; }
        .t212-scroll-bottom { position: absolute; bottom: 10px; right: 15px; background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: none; align-items: center; justify-content: center; cursor: pointer; z-index: 10; font-weight: bold; }
        .t212-scroll-bottom.visible { display: flex; }
        /* Minimize / Restore UI - production-ready */
        .t212-minimized { cursor: pointer; }
        .t212-minimized.on-right { border-radius: 16px 0 0 16px !important; }
        .t212-minimized.on-left { border-radius: 0 16px 16px 0 !important; }
        .t212-header { transition: opacity 0.3s ease, transform 0.4s ease; min-width: 380px; box-sizing: border-box; }
        .t212-content { transition: opacity 0.3s ease, transform 0.4s ease; min-width: 380px; box-sizing: border-box; }
        .t212-footer-madeby { transition: opacity 0.3s ease, transform 0.4s ease; min-width: 380px; box-sizing: border-box; padding:12px 20px; text-align:center; font-size:10px; color:#64748b; background:rgba(0,0,0,0.2); border-top:1px solid rgba(255,255,255,0.05); }
        .t212-minimized .t212-content, .t212-minimized .t212-header, .t212-minimized .t212-footer-madeby { opacity: 0; pointer-events: none; transform: translateX(-10px); }
        .t212-minimized.on-left .t212-content, .t212-minimized.on-left .t212-header, .t212-minimized.on-left .t212-footer-madeby { transform: translateX(10px); }
        .t212-minimize-handle { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; writing-mode: vertical-rl; font-size: 11px; font-weight: 700; color: #3b82f6; letter-spacing: 0.08em; text-transform: uppercase; touch-action: none; user-select: none; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
        .t212-minimized .t212-minimize-handle { opacity: 1; pointer-events: auto; }
        .t212-minimize-btn { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 6px 8px; display:flex; gap:6px; align-items:center; }
        .t212-minimized .t212-minimize-btn { transform: rotate(90deg); }
        .t212-minimized.dragging { transition: none !important; }
        .t212-error-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 10px; margin-bottom: 12px; display: none; }
        .t212-error-box.show { display: block; }
        .t212-error-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; color: #ef4444; font-size: 11px; font-weight: 700; }
        .t212-error-item { display: flex; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 8px; font-size: 10px; color: #fca5a5; margin-bottom: 5px; border: 1px solid rgba(239, 68, 68, 0.1); }
        .t212-error-close { cursor: pointer; color: #64748b; margin-left: 8px; font-weight: bold; }
        .t212-report-btn { font-size: 9px; padding: 4px 8px; background: #ef4444; color: white; border-radius: 6px; text-decoration: none; }
        .t212-blur { filter: blur(6px); }
      
      `;
      document.head.appendChild(style);

      const eyeIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      const eyeOffIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      const closeIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      const minIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 3 13 11 21 11"/><polyline points="11 21 11 13 3 13"/></svg>`;
      const saveIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
      const successIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#16a34a"/><path d="M6.5 12.5l3 3 7-7" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const downIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>`;
      const maximizeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize2-icon lucide-maximize-2"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>`;

      ui.innerHTML = `
        <div style="padding:12px 10px;" class="t212-minimize-handle" id="t212-restore-handle"><span style="margin-bottom:10px;">T212 Exporter</span> ${maximizeIcon}</div>
        <div class="t212-header">
         
    
          <div style="display:flex; align-items:center; gap:10px; font-weight:700; font-size:15px; color:#fff;">
            <div class="t212-spinner" id="t212-spinner"></div><span>T212 Exporter</span>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <div class="t212-btn-icon" id="t212-btn-min" title="Minimalizuj">${minIcon}</div>
            
            <div class="t212-btn-icon" id="t212-btn-close" title="Zamknij" style="color:#ef4444;">${closeIcon}</div>
          </div>
        </div> 
       <a style="text-decoration:none; color:#fff;" href="https://github.com/darkspine433/T212-CFD-DATA" target="_blank"> <div  class="t212-header" style="cursor:pointer; display:flex; align-items:center; flex-direction:column; gap:10px; background-color: #1e1e1e; font-weight:700; font-size:15px; color:#fff; justify-content:center;">
         <div style="display:flex; align-items:center; gap:10px;">
            <div>
              Wesprzyj projekt zostawiając gwiazdkę na githubie
            </div>
            <a style="color:#fff; display:flex; align-items:center; gap:10px;" href="https://github.com/darkspine433/T212-CFD-DATA" target="_blank">GitHub <svg style="color:#fff;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
            </svg></a>
          </div>
          <a href="https://github.com/darkspine433/T212-CFD-DATA" target="_blank" style="color:#fff; display:flex; align-items:center; gap:10px; text-decoration:none;"> <div class="t212-btn-icon" style="flex:1; font-size:11px; gap:8px; margin-top:10px;">Możesz to zrobić podczas pobierania danych z T212</div></a>
        </div>
        </a>
        <div class="t212-content">
          
          <div id="t212-msg" class="t212-msg"></div>
          <div class="t212-btn-icon" id="t212-btn-blur" title="Ukryj wyniki"  style="flex:1; font-size:11px; gap:8px; margin-bottom:10px;">${eyeIcon} Ukryj wyniki</div>
          <div class="t212-live-summary">
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span style="color:#64748b; font-size:10px; text-transform:uppercase;">Wynik Trade</span>
              <span class="t212-stat-value" id="t212-stat-pnl">0.00 PLN</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span style="color:#64748b; font-size:10px; text-transform:uppercase;">Opłaty FX</span>
              <span class="t212-stat-value" id="t212-stat-fx">0.00 PLN</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span style="color:#64748b; font-size:10px; text-transform:uppercase;">Odsetki</span>
              <span class="t212-stat-value" id="t212-stat-interest">0.00 PLN</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span style="color:#64748b; font-size:10px; text-transform:uppercase;">Suma Netto</span>
              <span class="t212-stat-value" id="t212-stat-total" style="color:#3b82f6;">0.00 PLN</span>
            </div>
            
          </div>
          <div class="t212-progress-bg" id="t212-progress-bg"><div class="t212-progress-bar" id="t212-bar"></div></div>
          <div style="display:flex; gap:10px; margin-bottom:12px;">
            <button id="t212-save-logs" class="t212-btn-icon" style="flex:1; font-size:11px; gap:6px;">${saveIcon} Zapisz Logi</button>
            <button id="t212-save-results" class="t212-btn-icon" style="flex:1; font-size:11px; gap:6px; display:none;">${saveIcon} Wynik</button>
          </div>
          <div style="display:flex; gap:10px; margin-bottom:12px;">
            <button id="t212-toggle-logs" class="t212-btn-icon" style="flex:1; font-size:11px; gap:8px;">${eyeIcon} Pokaż logki</button>
          </div>
          <div class="t212-error-box" id="t212-error-box">
            <div class="t212-error-header"><span>Błędy</span><a href="https://github.com/DarkSpine433/T212-CFD-DATA/issues" target="_blank" class="t212-report-btn">Zgłoś błąd</a></div>
            <div id="t212-error-list"></div>
          </div>
          <div class="t212-logs-wrapper" id="t212-logs-wrapper">
            <div class="t212-scroll-bottom" id="t212-btn-scroll">${downIcon}</div>
            <div class="t212-logs" id="t212-logs-container"></div>
          </div>
        </div>
        <div class="t212-footer-madeby">
          Made by <a href="https://github.com/DarkSpine433" target="_blank" style="color:#3b82f6; text-decoration:none;">DarkSpine</a> • <a href="https://github.com/DarkSpine433/T212-CFD-DATA" target="_blank" style="color:#3b82f6; text-decoration:none;">Project Code</a>
        </div>
      `;

      const headerEl = ui.querySelector(".t212-header");
      const logsBox = document.getElementById("t212-logs-container");
      const scrollBtn = document.getElementById("t212-btn-scroll");
      const toggleBtn = document.getElementById("t212-toggle-logs");

      let uiLastPos = { left: null, top: null };
      let uiLastRect = null;
      let scrollTimeout = null;

      headerEl.onmousedown = (e) => {
        if (e.target.closest(".t212-btn-icon")) return;
        dragData.isDragging = true;
        const r = ui.getBoundingClientRect();
        dragData.offsetX = e.clientX - r.left;
        dragData.offsetY = e.clientY - r.top;
        ui.style.transition = "none";
      };

      window.onmousemove = (e) => {
        if (!dragData.isDragging) return;
        let x = Math.max(
          0,
          Math.min(
            e.clientX - dragData.offsetX,
            window.innerWidth - ui.offsetWidth,
          ),
        );
        let y = Math.max(
          0,
          Math.min(
            e.clientY - dragData.offsetY,
            window.innerHeight - ui.offsetHeight,
          ),
        );
        ui.style.left = x + "px";
        ui.style.top = y + "px";
        ui.style.right = "auto";
      };

      window.onmouseup = () => {
        if (!dragData.isDragging) return;
        dragData.isDragging = false;
        ui.style.transition = "all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
      };

      const fixUIPosition = () => {
        if (!ui) return;
        const rect = ui.getBoundingClientRect();

        if (isMinimized) {
          const side = ui.classList.contains("on-right") ? "right" : "left";
          let y = Math.max(
            0,
            Math.min(rect.top, window.innerHeight - ui.offsetHeight),
          );
          ui.style.top = y + "px";
          ui.style.left =
            (side === "right" ? window.innerWidth - 36 : 0) + "px";
          ui.style.right = "auto";
          return;
        }

        let x = Math.max(
          0,
          Math.min(rect.left, window.innerWidth - rect.width),
        );
        let y = Math.max(
          0,
          Math.min(rect.top, window.innerHeight - rect.height),
        );
        ui.style.left = x + "px";
        ui.style.top = y + "px";
        uiLastPos.left = ui.style.left;
        uiLastPos.top = ui.style.top;
      };
      window.addEventListener("resize", fixUIPosition);

      const saveUIState = (state) => {
        try {
          sessionStorage.setItem("t212_ui_state", JSON.stringify(state));
        } catch (e) {}
      };
      const loadUIState = () => {
        try {
          const s = sessionStorage.getItem("t212_ui_state");
          return s ? JSON.parse(s) : null;
        } catch (e) {
          return null;
        }
      };

      const minimizeUI = (side) => {
        if (!ui) return;
        const r = ui.getBoundingClientRect();

        ui.style.transition = "none";
        ui.style.width = r.width + "px";
        ui.style.height = r.height + "px";
        ui.offsetHeight; // force reflow

        isMinimized = true;
        ui.style.transition = "all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
        ui.classList.add("t212-minimized", `on-${side}`);
        ui.classList.remove("dragging");

        ui.style.right = "auto";
        ui.style.width = "36px";
        ui.style.height = "120px";
        ui.style.left = (side === "right" ? window.innerWidth - 36 : 0) + "px";
        ui.style.top =
          Math.max(0, Math.min(window.innerHeight - 120, r.top)) + "px";

        saveUIState({ minimized: true, side: side, top: ui.style.top });
      };

      const restoreUI = () => {
        if (!ui) return;
        const r = ui.getBoundingClientRect();
        const side = ui.classList.contains("on-right") ? "right" : "left";

        // Disable transitions for calculation
        ui.style.transition = "none";
        ui.classList.remove(
          "t212-minimized",
          "on-left",
          "on-right",
          "dragging",
        );

        // Measure the natural size
        ui.style.width = "380px";
        ui.style.height = "auto";
        const targetHeight = ui.getBoundingClientRect().height;

        // Revert to minimized form to start animation
        ui.style.width = "36px";
        ui.style.height = "120px";
        ui.style.left = r.left + "px";
        ui.style.top = r.top + "px";
        ui.classList.add("t212-minimized", `on-${side}`);

        ui.offsetHeight; // force reflow

        // Remove min classes to animate out
        isMinimized = false;
        ui.classList.remove("t212-minimized", `on-${side}`);
        ui.style.transition = "all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";

        const targetLeft =
          side === "right" ? Math.max(6, window.innerWidth - 380 - 6) : 6;
        const targetTop = Math.max(
          6,
          Math.min(window.innerHeight - targetHeight - 6, r.top),
        );

        ui.style.left = targetLeft + "px";
        ui.style.top = targetTop + "px";
        ui.style.width = "380px";
        ui.style.height = targetHeight + "px";

        ui.style.right = "auto";
        saveUIState({ minimized: false });

        setTimeout(() => {
          if (!isMinimized && ui) {
            ui.style.height = "auto";
          }
        }, 500);
      };

      /* minimize button behavior */
      document.getElementById("t212-btn-min").onclick = () => {
        const r = ui.getBoundingClientRect();
        const side =
          r.left + r.width / 2 > window.innerWidth / 2 ? "right" : "left";
        minimizeUI(side);
      };

      /* restore handle: support click to restore and drag when minimized */
      const restoreHandleEl = document.getElementById("t212-restore-handle");
      let restorePointer = {
        dragging: false,
        hasMoved: false,
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
      };
      restoreHandleEl.onclick = (e) => {
        if (isMinimized && !restorePointer.hasMoved) {
          restoreUI();
        }
      };
      restoreHandleEl.onpointerdown = (ev) => {
        if (!isMinimized) return;
        restorePointer.dragging = true;
        restorePointer.hasMoved = false;
        restorePointer.startX = ev.clientX;
        restorePointer.startY = ev.clientY;
        const rect = ui.getBoundingClientRect();
        restorePointer.startLeft = rect.left;
        restorePointer.startTop = rect.top;
        restoreHandleEl.setPointerCapture?.(ev.pointerId);
        ui.classList.add("dragging");
      };
      restoreHandleEl.onpointermove = (ev) => {
        if (!restorePointer.dragging) return;
        const dx = ev.clientX - restorePointer.startX;
        const dy = ev.clientY - restorePointer.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          restorePointer.hasMoved = true;
        }
        let newLeft = Math.max(
          6,
          Math.min(
            window.innerWidth - ui.offsetWidth - 6,
            restorePointer.startLeft + dx,
          ),
        );
        let newTop = Math.max(
          6,
          Math.min(
            window.innerHeight - ui.offsetHeight - 6,
            restorePointer.startTop + dy,
          ),
        );
        ui.style.left = newLeft + "px";
        ui.style.top = newTop + "px";
        ui.style.right = "auto";
      };
      restoreHandleEl.onpointerup = (ev) => {
        restorePointer.dragging = false;
        try {
          restoreHandleEl.releasePointerCapture(ev.pointerId);
        } catch (e) {}
        ui.classList.remove("dragging");

        if (restorePointer.hasMoved) {
          const r = ui.getBoundingClientRect();
          const centerX = r.left + r.width / 2;
          const side = centerX > window.innerWidth / 2 ? "right" : "left";

          ui.classList.remove("on-left", "on-right");
          ui.classList.add(`on-${side}`);

          ui.style.transition = "all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
          ui.style.left =
            (side === "right" ? window.innerWidth - 36 : 0) + "px";
          ui.style.right = "auto";

          saveUIState({
            minimized: true,
            top: ui.style.top,
            side: side,
          });
        }
      };

      document.getElementById("t212-btn-close").onclick = () => {
        if (isDownloading) {
          window.location.reload();
          return;
        }
        ui.remove();
        document.getElementById("t212-exporter-styles")?.remove();
      };

      document.getElementById("t212-save-logs").onclick = () => {
        const text = logsBox.innerText;
        const b = new Blob([text], { type: "text/plain" });
        const u = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = u;
        a.download = "T212_Logs.txt";
        a.click();
      };

      logsBox.onscroll = () => {
        clearTimeout(scrollTimeout);
        const atBottom =
          logsBox.scrollHeight - logsBox.scrollTop <= logsBox.clientHeight + 80;
        isAutoScroll = atBottom;
        if (atBottom) scrollBtn.classList.remove("visible");
        else scrollBtn.classList.add("visible");
        scrollTimeout = setTimeout(() => {
          const nowAtBottom =
            logsBox.scrollHeight - logsBox.scrollTop <=
            logsBox.clientHeight + 80;
          if (nowAtBottom) {
            isAutoScroll = true;
            scrollBtn.classList.remove("visible");
          }
        }, 220);
      };
      scrollBtn.onclick = () => {
        isAutoScroll = true;
        logsBox.scrollTop = logsBox.scrollHeight;
        scrollBtn.classList.remove("visible");
      };

      /* Combined toggle button: show/hide logs and blur live summary */
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          isLogsVisible = !isLogsVisible;
          document
            .getElementById("t212-logs-wrapper")
            .classList.toggle("show", isLogsVisible);
          const live = document.querySelector(".t212-live-summary");

          toggleBtn.innerHTML = isLogsVisible
            ? eyeOffIcon + " Pokaż logki"
            : eyeIcon + " Pokaż logki";
          if (isLogsVisible) {
            logsBox.scrollTop = logsBox.scrollHeight;
            isAutoScroll = true;
            scrollBtn.classList.remove("visible");
          }
        };
      }

      /* Header blur button (separate): toggles only the live summary blur */
      const headerBlurBtn = document.getElementById("t212-btn-blur");
      if (headerBlurBtn) {
        headerBlurBtn.onclick = () => {
          const live = document.querySelector(".t212-live-summary");
          if (!live) return;
          const isNowBlurred = !live.classList.toggle("t212-blur");
          /*   when toggled, update text and icon: if blurred -> show eyeOff + 'Pokaż wyniki' */
          if (live.classList.contains("t212-blur")) {
            headerBlurBtn.innerHTML = eyeOffIcon + " Pokaż wyniki";
          } else {
            headerBlurBtn.innerHTML = eyeIcon + " Ukryj wyniki";
          }
        };
      }

      /* Restore UI state from session if available */
      try {
        const st = loadUIState();
        if (st && st.minimized) {
          const side = st.side || "right";

          setTimeout(() => {
            minimizeUI(side);
            if (st.top) ui.style.top = st.top;
          }, 50);
        }
      } catch (e) {}
    }

    /* Refresh UI content */
    if (summary) {
      const pnl = (summary["Zysk PLN"] || 0) + (summary["Strata PLN"] || 0);
      const tt =
        pnl +
        (summary["Opłaty FX PLN"] || 0) +
        (summary["Odsetki od gotówki PLN"] || 0) +
        (summary["Odsetki overnight PLN"] || 0);
      const setV = (id, val, color = false) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = `${val.toFixed(2)} PLN`;
        if (color)
          el.style.color =
            val > 0 ? "#22c55e" : val < 0 ? "#ef4444" : "#f1f5f9";
      };
      setV("t212-stat-pnl", pnl, true);
      setV("t212-stat-fx", summary["Opłaty FX PLN"] || 0);
      setV(
        "t212-stat-interest",
        (summary["Odsetki od gotówki PLN"] || 0) +
          (summary["Odsetki overnight PLN"] || 0),
        true,
      );
      setV("t212-stat-total", tt, true);
    }
    if (progressPercent >= 0) {
      const b = document.getElementById("t212-progress-bg"),
        bar = document.getElementById("t212-bar");
      if (b && bar) {
        b.classList.add("show");
        bar.style.width = `${progressPercent}%`;
      }
    }
    if (logText) {
      const time = new Date().toLocaleTimeString();
      logsHtml += `[${time}] ${logText}\n`;
      const box = document.getElementById("t212-logs-container");
      if (box) {
        box.innerHTML = logsHtml;
        if (isAutoScroll) {
          box.scrollTop = box.scrollHeight;
          document
            .getElementById("t212-btn-scroll")
            ?.classList.remove("visible");
        }
      }
    }
    if (errorObj) {
      encounteredError = true;
      const eb = document.getElementById("t212-error-box"),
        el = document.getElementById("t212-error-list");
      if (eb && el) {
        eb.classList.add("show");
        const item = document.createElement("div");
        item.className = "t212-error-item";
        item.innerHTML = `<span style="flex:1;">${errorObj.message || errorObj}</span><span style="cursor:pointer; font-weight:bold; margin-left:8px;" class="t212-err-x">✕</span>`;
        item.querySelector(".t212-err-x").onclick = () => {
          item.remove();
          if (el.children.length === 0) eb.classList.remove("show");
        };
        el.appendChild(item);
      }
    }
    if (message !== null) {
      const m = document.getElementById("t212-msg");
      if (m) m.innerHTML = message;
    }
    const sp = document.getElementById("t212-spinner");
    if (sp) sp.style.display = showSpinner ? "inline-block" : "none";
  };

  updateProgress(
    `Inicjalizacja pobierania...<br/><span style="color:#aaa;">${fromDateStr} do ${toDateStr}</span>`,
    0,
    `Rozpoczęto pobieranie z Trading212...`,
  );

  /* mark downloading and warn on unload */
  isDownloading = true;
  beforeUnloadHandler = (e) => {
    if (isDownloading) {
      const msg =
        "Trwa pobieranie danych. Na pewno chcesz opuścić/odświeżyć stronę? Pobieranie zostanie przerwane.";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    }
  };
  window.addEventListener("beforeunload", beforeUnloadHandler);
  /*
  _________________________________________________________________________________
  _________________________________________________________________________________
  */

  /***********************************************************************************
   *
   * SKRYPT POBIERANIA DANYCH Z TRADING212
   *
   ***********************************************************************************/

  /*---  POZYCJE ---*/
  const fetchWithRetry = async (url, options, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const wait = Math.pow(2, i) * 1000;
        console.warn(`Rate limit (429). Czekam ${wait}ms...`);
        updateProgress(null, -1, `Limit zapytań (429). Czekam ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return response;
    }
    updateProgress(null, -1, `Przekroczono limit prób dla ${url}`);
    throw new Error(`Przekroczono limit prób dla ${url}`);
  };

  try {
    let res = await (
      await fetch(requestBase + "positions?page=1" + requestFilter, auth)
    ).json();
    const totalSize = res.totalSize || 0;
    const pageCount = Math.ceil(totalSize / 20);

    for (let i = 1; i <= pageCount; i++) {
      const pageRes = await (
        await fetchWithRetry(
          requestBase + `positions?page=${i}` + requestFilter,
          auth,
        )
      ).json();

      if (pageRes.data) {
        for (let position of pageRes.data) {
          updateProgress(
            null,
            -1,
            `Pobieranie detali dla pozycji: ${position.orderNumber.name} (${position.code})`,
          );
          const detailsResponse = await fetchWithRetry(
            requestBase + position.orderNumber.link,
            auth,
          );
          const details = await detailsResponse.json();

          if (details && details.length > 0) {
            const openDirection = details[0].direction;
            let currentQty = 0;
            let currentAvgPrice = 0;

            for (let j = 0; j < details.length; j++) {
              const event = details[j];
              const actionType = event.eventType.action;

              const newTotalQty =
                actionType === "closed" || actionType === "liquidated"
                  ? 0
                  : parseFloat(event.avgQuantity || event.quantity);
              const newAvgPrice =
                actionType === "closed" || actionType === "liquidated"
                  ? 0
                  : parseFloat(event.avgPrice || event.price);

              if (
                actionType === "opened" ||
                (actionType === "modified" && newTotalQty > currentQty)
              ) {
                currentQty = newTotalQty;
                currentAvgPrice = newAvgPrice;
                continue;
              }

              if (
                actionType === "closed" ||
                actionType === "liquidated" ||
                (actionType === "modified" && newTotalQty < currentQty)
              ) {
                const closedQty = currentQty - newTotalQty;
                const entryPrice = currentAvgPrice;
                const exitPrice = parseFloat(event.price);

                const rate = await getNBPExchangeRate(
                  position.currency,
                  event.time,
                );

                let pnl = (exitPrice - entryPrice) * closedQty;
                if (openDirection === "sell") {
                  pnl = (entryPrice - exitPrice) * closedQty;
                }

                const hasFxFee = position.currency !== accountCurrency;
                const fxFee = hasFxFee ? Math.abs(pnl) * 0.005 : 0;
                const netPnL = pnl - fxFee;
                const netPnLPLN = netPnL * rate;
                const fxFeePLN = fxFee * rate;

                if (pnl > 0) {
                  summary["Zysk PLN"] += pnl * rate;
                } else {
                  summary["Strata PLN"] += pnl * rate;
                }
                summary["Opłaty FX PLN"] -= fxFeePLN;

                if (fxFee > 0) {
                  feeDetails.push({
                    type: "FEE_FX",
                    time: event.time,
                    code: position.code,
                    currency: position.currency,
                    interestInCurrency: -Math.abs(fxFee).toFixed(4),
                    accountCurrency: accountCurrency,
                    interestInAccountCurrency: -Math.abs(fxFeePLN).toFixed(4),
                  });
                }

                positionDetails.push({
                  type: "POSITION",
                  time: event.time,
                  openingTime: position.dateCreated,
                  code: position.code,
                  orderName: event.eventNumber
                    ? event.eventNumber.name
                    : position.orderNumber.name,
                  currency: position.currency,
                  quantity: closedQty,
                  direction: openDirection,
                  openPrice: entryPrice,
                  closePrice: exitPrice,
                  pnlNetPLN: netPnLPLN.toFixed(4),
                });

                updateProgress(
                  null,
                  -1,
                  `✅ Zamknięto ${closedQty} ${position.code} (Zysk/Strata: ${pnl.toFixed(2)} ${position.currency})`,
                );

                currentQty = newTotalQty;
                currentAvgPrice = newAvgPrice;
              }
            }
          }
        }
        const progress = Math.round((i / pageCount) * 100);
        updateProgress(
          `📈<b>Pobieranie pozycji:</b><br/>Trwa przetwarzanie strony ${i} z ${pageCount}...`,
          progress,
          `Pobrano pozycje ze strony: ${i}/${pageCount}`,
        );
      } else {
        const errorMsg = `Brak danych do pobrania. Zapisz logi i załącz je do zgłoszenia Problemu`;
        console.error(e);
        updateProgress(null, -1, e.toString(), errorMsg, false);
        stopDownloadingCleanup();
        return;
      }
    }
  } catch (e) {
    const errorMsg = `Błąd przy pozycjach. Zapisz logi i załącz je do zgłoszenia Problemu`;
    console.error(e);
    updateProgress(null, -1, e.toString(), errorMsg, false);
    stopDownloadingCleanup();
    return;
  }

  /*--- ODSETKI OD GOTÓWKI  ---*/
  try {
    let cursor = maxDate.getTime();
    cursor += 24 * 60 * 60 * 1000; /* +1 dzień zapasu */

    let hasNext = true;
    const interestUrl = (requestBase + "interest/v2").replace(
      /([^:]\/)\/+/g,
      "$1",
    );

    while (hasNext) {
      const fetchUrl = `${interestUrl}?limit=20&olderThan=${cursor}`;
      updateProgress(
        `💵 <b>Pobieranie odsetek:</b><br/>Znaleziono dotychczas: ${interestDetails.length}`,
        -1,
        `Pobieram odsetki (wcześniejsze od ${new Date(cursor).toISOString().split("T")[0]})`,
      );

      const response = await fetchWithRetry(fetchUrl, auth);

      if (!response.ok) {
        updateProgress(
          null,
          -1,
          `Błąd sieci: ${response.status} ${response.statusText} dla adresu: ${fetchUrl}`,
        );
        throw new Error(
          `Błąd sieci: ${response.status} ${response.statusText} dla adresu: ${fetchUrl}`,
        );
      }

      const res = await response.json();

      if (!res) {
        updateProgress(null, -1, `Odpowiedź API jest pusta (null/undefined).`);
        throw new Error("Odpowiedź API jest pusta (null/undefined).");
      }

      if (!res.interests) {
        hasNext = false;
        break;
      }

      if (res.interests.length > 0) {
        for (let item of res.interests) {
          const itemDate = new Date(item.executionDate);

          if (itemDate < minDate) {
            hasNext = false;
            continue;
          }

          if (itemDate <= maxDate && itemDate >= minDate) {
            const rate = await getNBPExchangeRate(
              item.currency,
              item.executionDate,
            );
            const interestAmt =
              typeof item.interestNetAmount === "number"
                ? item.interestNetAmount
                : parseFloat(
                    String(item.interestNetAmount).replace(",", "."),
                  ) || 0;
            const rateNum = Number(rate) || 1;
            const interestInPLN = interestAmt * rateNum;
            summary["Odsetki od gotówki PLN"] =
              (Number(summary["Odsetki od gotówki PLN"]) || 0) + interestInPLN;

            interestDetails.push({
              type: "CASH_INTEREST",
              time: itemDate.toISOString(),
              code: "CASH_INTEREST",
              orderName: item.description || "Interest on cash",
              currency: item.currency,
              interest: item.interestNetAmount,
              interestInPLN: interestInPLN.toFixed(4),
              quantity: 1,
              direction: "profit",
            });
            updateProgress(
              null,
              -1,
              `💰 Odsetki: ${item.interestNetAmount} ${item.currency} (${formatDate(item.executionDate)})`,
            );
          }
        }

        const lastItem = res.interests[res.interests.length - 1];
        cursor = lastItem.executionDate;

        if (!res.hasNext || cursor < minDate.getTime()) {
          hasNext = false;
        }

        await new Promise((r) => setTimeout(r, 100));
      } else {
        hasNext = false;
      }
    }
    updateProgress(null, -1, "Sukces: Pobrano odsetki od gotówki.");
  } catch (e) {
    const errorMsg = `Błąd przy odsetkach od gotówki. Zapisz logi i załącz je do zgłoszenia Problemu`;
    console.error(e);
    updateProgress(null, -1, e.toString(), errorMsg, false);
    stopDownloadingCleanup();
    return;
  }

  /*--- OPŁATY (OVERNIGHT FEES) ---*/
  try {
    const feeUrl = `https://live.trading212.com/rest/reports/overnight-holding-fee`;
    const res = await (
      await fetchWithRetry(feeUrl + "?page=1" + requestFilter, auth)
    ).json();

    const totalSize = res.totalSize || 0;
    const pageCount = Math.ceil(totalSize / 20);

    for (let i = 1; i <= pageCount; i++) {
      const fetchUrl = `${feeUrl}?page=${i}` + requestFilter;

      const pageRes = await (await fetchWithRetry(fetchUrl, auth)).json();

      if (pageRes.data) {
        for (let overnightFee of pageRes.data) {
          let d = new Date(overnightFee.time);
          if (d >= minDate && d <= maxDate) {
            const rate = await getNBPExchangeRate(
              overnightFee.accountCurrency,
              overnightFee.time,
            );
            const feeInPLN = parseFloat(overnightFee.interest) * rate;
            summary["Odsetki overnight PLN"] += feeInPLN;

            feeDetails.push({
              type: "FEE_OVERNIGHT",
              time: overnightFee.time,
              code: overnightFee.code,
              currency: overnightFee.accountCurrency,
              interest: overnightFee.interest,
              feeInPLN: feeInPLN.toFixed(4),
              quantity: overnightFee.quantity,
              direction: overnightFee.direction,
            });
            updateProgress(
              null,
              -1,
              `🌙 Opłata overnight: ${overnightFee.interest} ${overnightFee.accountCurrency} dla ${overnightFee.code}`,
            );
          }
        }
      }
      const progress = Math.round((i / pageCount) * 100);
      updateProgress(
        `🌙 <b>Pobieranie opłat overnight:</b><br/>Przetwarzanie strony ${i} z ${pageCount}...`,
        progress,
        `Opłaty: przetworzono stronę ${i}/${pageCount}`,
      );
    }
  } catch (e) {
    const errorMsg = `Błąd przy opłatach overnight. Zapisz logi i załącz je do zgłoszenia Problemu`;
    console.error(errorMsg);
    updateProgress(null, -1, errorMsg, errorMsg, false);
    stopDownloadingCleanup();
    return;
  }

  /*--- EKSPORT ---*/
  updateProgress(
    `⚙️ <b>Zakończono pobieranie.</b><br/>Przygotowywanie raportu (sortowanie danych)...`,
    100,
    `Pobieranie zakończone. Trwa sortowanie i generowanie piku...`,
    false,
  );
  const combinedData = [...positionDetails, ...feeDetails, ...interestDetails];
  combinedData.sort((a, b) => new Date(a.time) - new Date(b.time));

  const blob = new Blob([JSON.stringify(combinedData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `T212_CFD_${fromDateStr}_${toDateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);

  summary["Wyniki zamknięte PLN"] = summary["Zysk PLN"] + summary["Strata PLN"];
  summary["Łącznie netto PLN"] =
    summary["Wyniki zamknięte PLN"] +
    summary["Opłaty FX PLN"] +
    summary["Odsetki od gotówki PLN"] +
    summary["Odsetki overnight PLN"];

  const summaryText = `
Pamiętaj, że jest to bardzo przbyliżona kwota do prawdziwego wyniku, a nie dokładny wynik. Do obliczenia dokładnego wyniku użyj profesjonalnego narzędzia do obliczania podatków.

RAPORT TRADING 212 CFD
Okres: ${fromDateStr} - ${toDateStr}
--------------------------------------
Zysk: ${summary["Zysk PLN"].toFixed(2)} PLN
Strata: ${summary["Strata PLN"].toFixed(2)} PLN
Wynik (Trade): ${summary["Wyniki zamknięte PLN"].toFixed(2)} PLN
Opłaty FX: ${summary["Opłaty FX PLN"].toFixed(2)} PLN
Odsetki: ${summary["Odsetki od gotówki PLN"].toFixed(2)} PLN
Overnight: ${summary["Odsetki overnight PLN"].toFixed(2)} PLN
--------------------------------------
SUMA NETTO: ${summary["Łącznie netto PLN"].toFixed(2)} PLN
  `;

  const btnSaveResults = document.getElementById("t212-save-results");
  if (btnSaveResults) {
    btnSaveResults.style.display = "flex";
    btnSaveResults.onclick = () => {
      const blob = new Blob([summaryText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `T212_Summary_${fromDateStr}_${toDateStr}.txt`;
      a.click();
    };
  }

  updateProgress(
    `✅ <b>Eksport zakończony!</b><br/>Plik JSON został pobrany. Możesz teraz zapisać raport tekstowy lub przejrzeć logi. Pamiętaj, że jest to bardzo przbyliżona kwota do prawdziwego wyniku, a nie dokładny wynik. Do obliczenia dokładnego wyniku użyj profesjonalnego narzędzia do obliczania podatków.`,
    100,
    `Eksport zakończony sukcesem. Suma netto: ${summary["Łącznie netto PLN"].toFixed(2)} PLN`,
    false,
  );

  alert(
    `Gotowe! Pobrano ${combinedData.length} rekordów.\n\nWynik netto: ${summary["Łącznie netto PLN"].toFixed(2)} PLN. Pamiętaj, że jest to bardzo przbyliżona kwota do prawdziwego wyniku, a nie dokładny wynik. Do obliczenia dokładnego wyniku użyj profesjonalnego narzędzia do obliczania podatków.`,
  );
  /* Replace spinner with green check if no errors occurred */
  try {
    if (!encounteredError) {
      const sp = document.getElementById("t212-spinner");
      if (sp) {
        sp.style.animation = "none";
        sp.style.border = "none";
        sp.style.width = "18px";
        sp.style.height = "18px";
        sp.style.display = "inline-block";
        sp.innerHTML = successIcon;
      }
    }
  } catch (e) {}

  stopDownloadingCleanup();
}

export { getData, getInstruction };

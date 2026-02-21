export const getInstruction = () => {
  const instruction = `
  ===========================================================
  🚀 TRADING 212 CFD DATA EXPORTER
  ===========================================================
  Platforma Trading212 nie posiada natywnego eksportu danych CFD.
  Ten skrypt generuje plik JSON gotowy do rozliczeń podatkowych.

  Pełna instrukcja i Bookmarklet (szybsza metoda): 
  👉 https://darkspine433.github.io/T212-CFD-DATA/

  Kod źródłowy: https://github.com/DarkSpine433/T212-CFD-DATA/
  Autor: Dawid Konopiaty (DarkSpine433)
  ===========================================================

  ⚠️  WAŻNE OSTRZEŻENIE:
  Nie uruchamiaj skryptu kilkukrotnie w ciągu krótkiego czasu! 
  Zbyt częste zapytania mogą skutkować tymczasową blokadą konta 
  przez Trading212 (ok. 5 minut).

  INSTRUKCJA URUCHOMIENIA (KONSOLA):
  1. Zaloguj się do Trading212 w przeglądarce Chrome lub Firefox.
  2. Przejdź na konto CFD. 
     (Jeśli skrypt nie zadziała, otwórz wyszukiwarkę instrumentów CFD).
  3. Otwórz Narzędzia Deweloperskie naciskając klawisz [F12].
  4. Przejdź do zakładki "Console" (Konsola).
  5. Wklej cały skopiowany kod i naciśnij [ENTER].
     *Przeglądarka może wymagać wpisania 'allow pasting' przed wklejeniem.
  6. Postępuj zgodnie z komunikatami na ekranie:
     a) Wpisz walutę konta (np. PLN, EUR, USD, GBP, CHF, HUF itp.).
     b) Podaj datę POCZĄTKOWĄ w formacie RRRR-MM-DD (np. 2024-01-01).
     c) Podaj datę KOŃCOWĄ w formacie RRRR-MM-DD (np. 2024-12-31).
  7. Po zakończeniu pobierania (ok. 30-60s) zatwierdź komunikat OK.
  8. Plik 'Trading212_CFD_[DATA].json' zostanie automatycznie pobrany.

  9. Wczytaj pobrany plik na platformie wspierającej ten format.
  ===========================================================
`;
  return instruction;
};

async function getData() {
  /*---  Pobieranie dat ---*/
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
  const accountCurrency = prompt(
    "Wpisz walute twojego konta Obsługiwane waluty znajdziesz w instrukcji:",
    "PLN",
  ).toUpperCase();
  if (!accountCurrency) return;
  if (!currencyList.includes(accountCurrency)) {
    alert(
      `Nie obsługiwana waluta ${accountCurrency}. Obsługiwane waluty to ${currencyList.join(", ")}`,
    );
    return;
  }

  const fromDateStr = prompt(
    "Wpisz datę OD której ma wziąć dane (format RRRR-MM-DD):",
    `${new Date().getFullYear() - 1}-01-01`,
  );
  if (!fromDateStr) return;

  const toDateStr = prompt(
    "Wpisz datę DO której ma wziąć dane (format RRRR-MM-DD):",
    `${fromDateStr.split("-")[0]}-12-31`,
  );
  if (!toDateStr) return;

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

  console.log(`%c Rozpoczynam pobieranie: ${fromDateStr} - ${toDateStr}`);

  /*---  Tablice Danych ---*/
  let positionDetails = [];
  let interestDetails = [];
  let feeDetails = [];

  /*---  POZYCJE ---*/
  try {
    let res = await (
      await fetch(requestBase + "positions?page=1" + requestFilter, auth)
    ).json();
    const totalSize = res.totalSize || 0;
    const pageCount = Math.ceil(totalSize / 20);

    for (let i = 1; i <= pageCount; i++) {
      const pageRes = await (
        await fetch(requestBase + `positions?page=${i}` + requestFilter, auth)
      ).json();

      if (pageRes.data) {
        for (let position of pageRes.data) {
          await new Promise((r) => setTimeout(r, 50));

          const details = await (
            await fetch(requestBase + position.orderNumber.link, auth)
          ).json();

          if (details && details.length > 1) {
            const openEvent = details[0];
            const openDirection = openEvent.direction;

            for (let j = 1; j < details.length; j++) {
              const event = details[j];
              const actionType = event.eventType.action;

              const isClosedAction = actionType === "closed";
              const isPartialClose =
                actionType === "modified" && event.direction !== openDirection;

              if (isClosedAction || isPartialClose) {
                const currentAvgOpenPrice = parseFloat(event.avgPrice);
                const closePrice = parseFloat(event.price);
                const qty = parseFloat(event.quantity);

                let pnl = (closePrice - currentAvgOpenPrice) * qty;
                if (openDirection === "sell") {
                  pnl = (currentAvgOpenPrice - closePrice) * qty;
                }

                const closeValueInstrumentCurrency = qty * closePrice;

                const fxFee = (closeValueInstrumentCurrency * 0.005).toFixed(4);

                if (
                  parseFloat(fxFee) > 0 &&
                  position.currency.toUpperCase() !==
                    accountCurrency.toUpperCase()
                ) {
                  feeDetails.push({
                    type: "FEE_FX",
                    time: event.time,
                    code: position.code,
                    currency: position.currency,
                    accountCurrency: accountCurrency,
                    interest: fxFee,
                  });
                }

                positionDetails.push({
                  type: "POSITION",
                  time: event.time, // Czas zamknięcia tej konkretnej transzy
                  openingTime: position.dateCreated,
                  code: position.code,
                  orderName: event.eventNumber.name,
                  currency: position.currency,
                  quantity: qty,
                  direction: openDirection,
                  openDirection: openDirection,
                  closeDirection: event.direction,
                  price: event.price,
                  openPrice: currentAvgOpenPrice,
                  closePrice: closePrice,
                });
              }
            }
          }
        }
        console.log(`Pobrano pozycje: ${i}/${pageCount}`);
      } else {
        alert(
          `Nie udało się pobrać odpowiedzi Trading212. Skontaktuj sie z nami wklejajac caly ponizszy komunikat:\n` +
            JSON.stringify(pageRes),
        );
        return false;
      }
    }
  } catch (e) {
    console.error("Błąd przy pozycjach:", e);
    alert("Wystąpił błąd przy pobieraniu pozycji. Sprawdź konsolę.");
    return;
  }

  /*--- ODSETKI OD GOTÓWKI  ---*/
  try {
    let cursor = maxDate.getTime();
    cursor += 24 * 60 * 60 * 1000; // +1 dzień zapasu

    let hasNext = true;
    const interestUrl = (requestBase + "interest/v2").replace(
      /([^:]\/)\/+/g,
      "$1",
    );

    console.log(`DEBUG: URL odsetek to: ${interestUrl}`);

    while (hasNext) {
      const fetchUrl = `${interestUrl}?limit=20&olderThan=${cursor}`;
      console.log(`Pobieram: ${fetchUrl}`);

      const response = await fetch(fetchUrl, auth);

      if (!response.ok) {
        throw new Error(
          `Błąd sieci: ${response.status} ${response.statusText} dla adresu: ${fetchUrl}`,
        );
      }

      const res = await response.json();

      if (!res) throw new Error("Odpowiedź API jest pusta (null/undefined).");

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
            interestDetails.push({
              type: "CASH_INTEREST",
              time: itemDate.toISOString(),
              code: "CASH_INTEREST",
              orderName: item.description || "Interest on cash",
              currency: item.currency,
              interest: item.interestNetAmount,
              quantity: 1,
              direction: "profit",
            });
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
    console.log(`Sukces: Pobrano ${interestDetails.length} odsetek.`);
  } catch (e) {
    console.error("Szczegóły błędu:", e);
    alert(
      `BŁĄD POBIERANIA ODSETEK:\n\n${e.name}: ${e.message}\n\nCzytaj powyżej co poszło nie tak.`,
    );
  }

  /*--- OPŁATY (OVERNIGHT FEES) ---*/
  try {
    const feeUrl = `https://live.trading212.com/rest/reports/overnight-holding-fee`;
    const res = await (
      await fetch(feeUrl + "?page=1" + requestFilter, auth)
    ).json();
    const totalSize = res.totalSize || 0;
    const pageCount = Math.ceil(totalSize / 20);

    for (let i = 1; i <= pageCount; i++) {
      const pageRes = await (
        await fetch(feeUrl + `?page=${i}` + requestFilter, auth)
      ).json();

      if (pageRes.data) {
        const mapped = pageRes.data
          .filter((f) => {
            let d = new Date(f.time);
            return d >= minDate && d <= maxDate;
          })
          .map((overnightFee) => ({
            type: "FEE_OVERNIGHT",
            time: overnightFee.time,
            code: overnightFee.code,
            currency: overnightFee.accountCurrency,
            interest: overnightFee.interest,
            quantity: overnightFee.quantity,
            direction: overnightFee.direction,
          }));
        feeDetails = feeDetails.concat(mapped);
      }
      console.log(`Opłaty: strona ${i}/${pageCount}`);
    }
  } catch (e) {
    console.error("Błąd przy opłatach:", e);
    alert("Wystąpił błąd przy pobieraniu opłat. Sprawdź konsolę.", e);
    return;
  }

  /*--- EKSPORT ---*/
  const combinedData = [...positionDetails, ...feeDetails, ...interestDetails];
  combinedData.sort((a, b) => new Date(a.time) - new Date(b.time));

  const blob = new Blob([JSON.stringify(combinedData, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `T212_CFD_${fromDateStr}_${toDateStr}.json`;
  a.click();

  alert(`Gotowe! Pobrano ${combinedData.length} rekordów (Pozycje + Opłaty).`);
}

export { getData };

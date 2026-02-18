/*
Trading212 CFD nie posiada zwyklego eksportu raportu i nalezy go wygenrowac w ponizszy sposob:
 !!Koniecznie nie uruchamiaj skryptu kilkukrotnie w przeciagu kilku minut! Moze to skutkowac blokada dostepu do Trading212 na okolo 5min.
1. Otworz Chrome lub Firefox
2. Zaloguj sie do Trading212
3. Przejdz na konto CFD. Czasmi konieczne jest przejscie do wyszukiwarki instrumentow CFD, przyczyna nie jest nam znana.
4. Otworz "Developers Tools" w Firefox lub "DevTools" w Chrome przy pomocy przycisku F12.
5. Przejdz na zakladke "Console"/"Konsola" w Firefox/Chrome
6. Wklej caly ponizszy tekst i kliknij ENTER/Uruchom
6a. Przegladarka moze Cie poprosic o dodatkowa weryfikacje upewniajaca sie, ze chcesz uruchomic zewnetrzny skrypt
7. Na stronie t212 w której wkleiłeś skrypt pojawi się okno z zapytaniem od kiedy chcesz pobrac dane wpisz date w formacie RRRR-MM-DD
7a. Na stronie t212 w której wkleiłeś skrypt pojawi się okno z zapytaniem do kiedy chcesz pobrac dane wpisz date w formacie RRRR-MM-DD
8. Po okolo 30 wyświetli się komunikat o tym, ile udało pobrać się rekorduów kliknij ok. i powinien zostac pobrany plik 'Trading212_CFD.json'.
9. Wczytaj go na naszej platformie
10. Powodzenia!

source code https://github.com/DarkSpine433/T212-CFD-DATA/ 

*/

async function getData() {
  /*---  Pobieranie dat ---*/
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

  /*---  POZYCJE ---*/
  let positionDetails = [];
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
            const closeEvent = details[details.length - 1];
            const closeEventActionType = closeEvent.eventType.action;
            if (closeEventActionType != "closed") {
              console.log(
                "pozycja jeszcze jest nie zamknięta więc nie została dodana do pliku",
              );
              continue;
            }
            positionDetails.push({
              type: "POSITION",
              time: position.dateClosed,
              openingTime: position.dateCreated,
              code: position.code,
              orderName: position.orderNumber.name,
              currency: position.currency,
              quantity: openEvent.quantity,
              direction: openEvent.direction,
              openPrice: closeEvent.avgPrice,
              closePrice: closeEvent.price,
            });
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
  let interestDetails = [];
  try {
    if (typeof maxDate === "undefined")
      throw new Error(
        "Zmienna 'maxDate' nie istnieje. Kod wklejono w złym miejscu?",
      );
    if (typeof requestBase === "undefined")
      throw new Error("Zmienna 'requestBase' nie istnieje.");

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
        console.log("Brak pola 'interests' w odpowiedzi - kończę pętlę.");
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
  let feeDetails = [];
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
            orderName: overnightFee.orderNumber
              ? overnightFee.orderNumber.name
              : "N/A",
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

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
  /*---  1. Pobieranie dat ---*/
  let fromDateStr = prompt(
    "Wpisz datę OD której ma wziąć dane (format RRRR-MM-DD):",
    `${new Date().getFullYear() - 1}-01-01`,
  );
  if (!fromDateStr) return;

  let toDateStr = prompt(
    "Wpisz datę DO której ma wziąć dane (format RRRR-MM-DD):",
    `${fromDateStr.split("-")[0]}-12-31`,
  );
  if (!toDateStr) return;

  let minDate = new Date(fromDateStr);
  let maxDate = new Date(toDateStr);
  let requestBase = `https://live.trading212.com/rest/reports/`;
  let requestFilter = `&perPage=20&from=${fromDateStr}&to=${toDateStr}`;

  /*---  2. Mechanizm autoryzacji (Fix na błąd 401) ---*/
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };
  let session =
    getCookie("TRADING212_SESSION_LIVE") || getCookie("CUSTOMER_SESSION");

  let auth = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Trading212-Session": session,
    },
    credentials: "include",
  };

  console.log(`%c Rozpoczynam pobieranie: ${fromDateStr} - ${toDateStr}`);

  /*---  CZĘŚĆ 1: POZYCJE ---*/
  let positionDetails = [];
  try {
    let res = await (
      await fetch(requestBase + "positions?page=1" + requestFilter, auth)
    ).json();
    let totalSize = res.totalSize || 0;
    let pageCount = Math.ceil(totalSize / 20);

    for (let i = 1; i <= pageCount; i++) {
      let pageRes = await (
        await fetch(requestBase + `positions?page=${i}` + requestFilter, auth)
      ).json();

      if (pageRes.data) {
        for (let pos of pageRes.data) {
          await new Promise((r) => setTimeout(r, 50));

          let details = await (
            await fetch(requestBase + pos.orderNumber.link, auth)
          ).json();

          if (details && details.length > 0) {
            details.sort((a, b) => new Date(a.time) - new Date(b.time));

            let openEvent = details[0];
            let closeEvent = details[details.length - 1];

            positionDetails.push({
              type: "POSITION",
              time: pos.dateClosed,
              openingTime: pos.dateCreated,
              code: pos.code,
              orderName: pos.orderNumber.name,
              currency: pos.currency,
              quantity: openEvent.quantity,
              direction: openEvent.direction,
              openPrice: openEvent.price,
              closePrice: closeEvent.price,
              result: pos.result,
            });
          }
        }
      }
      console.log(`Pobrano pozycje: ${i}/${pageCount}`);
    }
  } catch (e) {
    console.error("Błąd przy pozycjach:", e);
    alert("Wystąpił błąd przy pobieraniu pozycji. Sprawdź konsolę.");
  }

  /*--- CZĘŚĆ 2: OPŁATY (OVERNIGHT FEES) ---*/
  let feeDetails = [];
  try {
    let feeUrl = `https://live.trading212.com/rest/reports/overnight-holding-fee`;
    let res = await (
      await fetch(feeUrl + "?page=1" + requestFilter, auth)
    ).json();
    let totalSize = res.totalSize || 0;
    let pageCount = Math.ceil(totalSize / 20);

    for (let i = 1; i <= pageCount; i++) {
      let pageRes = await (
        await fetch(feeUrl + `?page=${i}` + requestFilter, auth)
      ).json();

      if (pageRes.data) {
        let mapped = pageRes.data
          .filter((f) => {
            let d = new Date(f.time);
            return d >= minDate && d <= maxDate;
          })
          .map((f) => ({
            type: "FEE_OVERNIGHT",
            time: f.time,
            code: f.code,
            orderName: f.orderNumber ? f.orderNumber.name : "N/A",
            currency: f.accountCurrency,
            interest: f.interest,
            quantity: f.quantity,
            direction: f.direction,
          }));
        feeDetails = feeDetails.concat(mapped);
      }
      console.log(`Opłaty: strona ${i}/${pageCount}`);
    }
  } catch (e) {
    console.error("Błąd przy opłatach:", e);
  }

  /*--- CZĘŚĆ 3: EKSPORT ---*/
  let combinedData = [...positionDetails, ...feeDetails];
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

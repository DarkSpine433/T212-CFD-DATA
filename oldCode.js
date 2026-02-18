// Trading212 CFD nie posiada zwyklego eksportu raportu i nalezy go wygenrowac w ponizszy sposob:
// !!Koniecznie nie uruchamiaj skryptu kilkukrotnie w przeciagu kilku minut! Moze to skutkowac blokada dostepu do Trading212 na okolo 5min.
// Uruchomienie skryptu moze wyswietlic informacje "undefined" co jest OK. Po okolo 30 sekundach powinien automatycznie pobrac sie plik.
// 1. Otworz Chrome lub Firefox
// 2. Zaloguj sie do Trading212
// 3. Przejdz na konto CFD. Czasmi konieczne jest przejscie do wyszukiwarki instrumentow CFD, przyczyna nie jest nam znana.
// 4. Otworz "Developers Tools" w Firefox lub "DevTools" w Chrome przy pomocy przycisku F12.
// 5. Przejdz na zakladke "Console"/"Konsola" w Firefox/Chrome
// 6. Wklej caly ponizszy tekst i kliknij ENTER/Uruchom
// 6a. Przegladarka moze Cie poprosic o dodatkowa weryfikacje upewniajaca sie, ze chcesz uruchomic zewnetrzny skrypt
// 7. Po okolo 30 sekundach powinien zostac pobrany plik 'Trading212_CFD.json'.
// 8. Wczytaj go na naszej platformie
//SKRYPT POBIERA TYLKO DANE ZA ROK 2025!!!! By pobieral inne lata zmodyfikuj zakres dat kilka linii nizej!!!!
async function getData() {
  let requestBase = `https://live.trading212.com/rest/reports/`;
  let requestFilter = `&perPage=20&from=2025-01-01&to=2025-12-31`;
  let auth = {
    method: "GET",
    credentials: "include",
  };

  let result = await (
    await fetch(requestBase + "positions?page=1" + requestFilter, auth)
  ).json();
  if (!result) {
    alert(
      `BlaÂd|Nie zwrocono pierwszego wyniku.\nRequest: ` +
        requestBase +
        "positions?page=1" +
        requestFilter,
    );
    return false;
  }
  let totalSize = result.totalSize; //Liczba transakcji
  if (totalSize == undefined) {
    alert(
      `BlaÂd|Nie udalo sieÂ pobracÂ liczby transakcji CFD.\nPonizej szczegolÂy odpowiedzi Trading212. Skontaktuj sie z nami wklejajac caly ponizszy komunikat:\n` +
        JSON.stringify(result),
    );
    return false;
  }
  let pageCount = Math.floor(totalSize / 20) + 1; //Liczba stron, maksymalnie mozna pobrac 20 transakcji
  let transactions = [];
  for (let i = 0; i < pageCount; i++) {
    let pageResult = await (
      await fetch(requestBase + `positions?page=${i + 1}` + requestFilter, auth)
    ).json();
    transactions = transactions.concat(pageResult.data);
  }
  let positionDetails = [];
  for (let i = 0; i < transactions.length; i++) {
    let transactionDetails = await (
      await fetch(requestBase + transactions[i].orderNumber.link, auth)
    ).json();
    if (transactionDetails.length !== 2) continue;
    let openDetails = transactionDetails[0];
    let closeDetails = transactionDetails[1];
    positionDetails.push({
      code: transactions[i].code,
      orderName: transactions[i].orderNumber.name,
      currency: transactions[i].currency,
      openingTime: transactions[i].dateCreated,
      time: transactions[i].dateClosed,
      quantity: openDetails.quantity,
      direction: openDetails.direction,
      openDirection: openDetails.direction,
      closeDirection: closeDetails.direction,
      price: openDetails.price,
      closePrice: closeDetails.price,
    });
  }

  const a = document.createElement("a"); //Utworzenie elementu tymczasowego
  const file = new Blob([JSON.stringify(positionDetails, null, 2)], {
    type: "application/json",
  });
  a.href = URL.createObjectURL(file);
  a.download = "Trading212_CFD.json";
  a.click(); //Wywolanie pobrania
  URL.revokeObjectURL(a.href); //Usuniecie elementu
}
alert(
  "Rozpoczeto pobieranie danych, moze to potrwac okolo 30 sekund. Domysle pobiera tylko rok 2025. Postep pobierania danych mozna sledzic w zakladce Siec/Network konsoli.",
);
success = await getData();
if (success) {
  alert(
    `Pobierz plik i wczytaj w kalkulatorgieldowy.pl. Plik mogl zostac pobrany w tle do domyslnego katalogu.`,
  );
}

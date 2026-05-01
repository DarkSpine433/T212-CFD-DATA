(function () {
  const targetScriptUrl =
    "https://darkspine433.github.io/T212-data-exporter/js/generatorJsonData.js";

  fetch(targetScriptUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Błąd sieci: " + response.status);
      }
      return response.text();
    })
    .then((code) => {
      const script = document.createElement("script");
      script.textContent = code;
      document.head.appendChild(script);
      console.log("✅ Kod pomyślnie pobrany i uruchomiony.");
    })
    .catch((error) => {
      console.error("❌ Wystąpił błąd podczas pobierania skryptu:", error);
    });
})();

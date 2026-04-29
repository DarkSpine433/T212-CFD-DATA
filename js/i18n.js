const langTranslations = {
  pl: {
    cfd_data_title: "T212 CFD & CRYPTO EKSPORTER",
    cfd_data_subtitle: "Eksportuj i analizuj dane z Trading 212",
    cfd_data_desc:
      "Nasza nowa strona udostępnia narzędzia do eksportowania i analizowania danych z platformy Trading 212. Wszystko w nowoczesnym, przejrzystym interfejsie.",
    old_site_title: "⚠️ To jest poprzednia strona główna",
    old_site_desc:
      "Poniżej w okienku iframe wyświetlona jest najnowsza i w pełni funkcjonalna aplikacja <strong>T212 Data Exporter</strong>. Ta strona służy teraz jako portal do narzędzia. Wszystkie nowe funkcje i aktualizacje znajdują się w aplikacji osadzonej poniżej.",
    info_access:
      "💡 Przejdź do sekcji poniżej, aby uzyskać dostęp do pełnych narzędzi eksportowania danych z Trading 212.",
    info_click: "Kliknij tutaj, aby przejść do narzędzi",
    feature_fast: "Szybko",
    feature_fast_desc:
      "Natychmiastowy dostęp do wszystkich Twoich danych handlowych.",
    feature_secure: "Bezpiecznie",
    feature_secure_desc: "Twoje dane są przetwarzane lokalnie w przeglądarce.",
    feature_analytics: "Analityka",
    feature_analytics_desc:
      "Szczegółowa analiza i raportowanie Twoich transakcji.",
    tools_title: "🛠️ Instrukcja i info",
    loading_app: "Załadowywanie aplikacji T212 Data Exporter...",
    iframe_fail: "ℹ️ Jeśli okno się nie załaduje, możesz",
    iframe_open_new: "otworzyć aplikację w nowej karcie",
    about_title: "📝 O Projekcie",
    about_desc1:
      "T212 CFD Data to nowoczesne narzędzie stworzone dla traderów, którzy chcą mieć pełną kontrolę nad swoimi danymi. Aplikacja pozwala na eksportowanie historii transakcji, analizę wyników i generowanie szczegółowych raportów.",
    about_desc2:
      "Projekt jest aktywnie rozwijany i regularnie pojawiają się nowe funkcje. Jeśli masz pomysł na ulepszenie, jesteśmy otwarci na sugestie!",
  },
  en: {
    cfd_data_title: "T212 CFD & CRYPTO EXPORTER",
    cfd_data_subtitle: "Export and analyze data from Trading 212",
    cfd_data_desc:
      "Our new website provides tools for exporting and analyzing data from the Trading 212 platform. Everything in a modern, transparent interface.",
    old_site_title: "⚠️ This is the old homepage",
    old_site_desc:
      "Below in the iframe window is the latest and fully functional <strong>T212 Data Exporter</strong> application. This page now serves as a portal to the tool. All new features and updates are in the application embedded below.",
    info_access:
      "💡 Go to the section below to get access to the full tools for exporting data from Trading 212.",
    info_click: "Click here to go to the tools",
    feature_fast: "Fast",
    feature_fast_desc: "Instant access to all your trading data.",
    feature_secure: "Secure",
    feature_secure_desc: "Your data is processed locally in your browser.",
    feature_analytics: "Analytics",
    feature_analytics_desc:
      "Detailed analysis and reporting of your transactions.",
    tools_title: "🛠️ Instruction and Info",
    loading_app: "Loading T212 Data Exporter application...",
    iframe_fail: "ℹ️ If the iframe doesn't load, you can",
    iframe_open_new: "open the application in a new tab",
    about_title: "📝 About the Project",
    about_desc1:
      "T212 CFD Data is a modern tool created for traders who want full control over their data. The application allows you to export transaction history, analyze results, and generate detailed reports.",
    about_desc2:
      "The project is actively developed and new features are regularly added. If you have an idea for improvement, we are open to suggestions!",
  },
};

function getSystemLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get("lang");
  if (langParam && langTranslations[langParam]) return langParam;

  const lang = navigator.language || navigator.userLanguage;
  if (lang && lang.toLowerCase().startsWith("pl")) return "pl";
  return "en";
}

let currentLang = localStorage.getItem("siteLang") || getSystemLanguage();

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("siteLang", lang);
  updatePageTranslations();

  const switcher = document.getElementById("lang-switcher");
  if (switcher) switcher.value = lang;
}

function updatePageTranslations() {
  const dict = langTranslations[currentLang];
  if (!dict) return;

  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  if (dict["site_title"]) {
    document.title = dict["site_title"];
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", dict["og_title"] || dict["site_title"]);
    document
      .querySelector('meta[property="twitter:title"]')
      ?.setAttribute("content", dict["og_title"] || dict["site_title"]);
  }

  if (dict["meta_desc"]) {
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", dict["meta_desc"]);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", dict["og_desc"] || dict["meta_desc"]);
    document
      .querySelector('meta[property="twitter:description"]')
      ?.setAttribute("content", dict["og_desc"] || dict["meta_desc"]);
  }

  if (dict["meta_keywords"]) {
    document
      .querySelector('meta[name="keywords"]')
      ?.setAttribute("content", dict["meta_keywords"]);
  }

  const ogImage = "https://darkspine433.github.io/T212-CFD-DATA/og-image.png";
  document
    .querySelector('meta[property="og:image"]')
    ?.setAttribute("content", ogImage);
  document
    .querySelector('meta[property="twitter:image"]')
    ?.setAttribute("content", ogImage);
}

document.addEventListener("DOMContentLoaded", () => {
  updatePageTranslations();

  const switcher = document.getElementById("lang-switcher");
  if (switcher) {
    switcher.value = currentLang;
    switcher.addEventListener("change", (e) => {
      setLanguage(e.target.value);
    });
  }
});

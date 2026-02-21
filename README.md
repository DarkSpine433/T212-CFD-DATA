# 🚀 Trading212 CFD Data Exporter

[![GitHub stars](https://img.shields.io/github/stars/DarkSpine433/T212-CFD-DATA?style=for-the-badge)](https://github.com/DarkSpine433/T212-CFD-DATA/stargazers)
[![GitHub license](https://img.shields.io/github/license/DarkSpine433/T212-CFD-DATA?style=for-the-badge)](https://github.com/DarkSpine433/T212-CFD-DATA/blob/main/LICENSE)

Darmowe narzędzie open-source umożliwiające eksport szczegółowych danych transakcyjnych z konta **Trading212 CFD** do formatu JSON. Narzędzie zostało stworzone z myślą o inwestorach potrzebujących precyzyjnych danych do rozliczeń podatkowych (np. w Polsce do formularza **PIT-38**).

👉 **Strona narzędzia:** [darkspine433.github.io/T212-CFD-DATA/](https://darkspine433.github.io/T212-CFD-DATA/)

---

## ✨ Kluczowe Funkcje

- **Eksport Pozycji:** Pobiera dane o zamkniętych i częściowo zamkniętych pozycjach CFD.
- **Kalkulacja FX Fee:** Automatycznie wylicza koszty przewalutowania (0.5%) dla transakcji w walutach obcych.
- **Odsetki od Gotówki:** Eksportuje dane o odsetkach naliczonych od niezainwestowanych środków (Interest on Cash v2).
- **Opłaty Overnight:** Pobiera historię opłat za przetrzymywanie pozycji przez noc (Holding Fees).
- **Zgodność z PIT-38:** Wygenerowany plik JSON jest zoptymalizowany pod kątem popularnych narzędzi podatkowych, takich jak [kalkulatorgieldowy.pl](https://kalkulatorgieldowy.pl).
- **Bezpieczeństwo:** Skrypt działa w 100% lokalnie w przeglądarce. Twoje dane sesyjne i transakcyjne nie opuszczają Twojego komputera.

---

## 🛠️ Jak to działa?

Trading212 nie oferuje bezpośredniego eksportu do JSON dla kont CFD w swoim interfejsie. To narzędzie wykorzystuje Twoją aktywną sesję w przeglądarce, aby bezpiecznie pobrać te dane bezpośrednio z oficjalnego API Trading212.

### Metoda 1: Bookmarklet (Rekomendowana)

1. Dodaj przycisk ze [strony głównej](https://darkspine433.github.io/T212-CFD-DATA/) do paska zakładek.
2. Zaloguj się na Trading212 i przejdź na konto CFD.
3. Kliknij zapisaną zakładkę i postępuj zgodnie z komunikatami.

### Metoda 2: Konsola DevTools (Dla zaawansowanych / Mobile)

1. Skopiuj kod ze strony.
2. Na stronie Trading212 otwórz konsolę (`F12` -> Console).
3. Wklej kod i naciśnij `Enter`.

---

## 🏗️ Struktura Projektu

- `index.html`: Główna strona wizytówka z instrukcjami i generatorem kodu.
- `style.css`: System projektowy (Premium Dark Design) zapewniający responsywność i estetykę.
- `js/generatorJsonData.js`: Rdzeń aplikacji – logika komunikacji z API i przetwarzania danych.
- `js/oldCode.js`: Archiwalna wersja skryptu.

---

## 🛡️ Bezpieczeństwo i Prywatność

- **Kod Open Source:** Każdy może sprawdzić, co dokładnie robi skrypt przed jego uruchomieniem.
- **Brak Serwera:** Narzędzie nie posiada backendu. Komunikacja odbywa się wyłącznie na linii Twoja Przeglądarka ↔ Trading212 API.
- **Brak Przechowywania Danych:** Wygenerowane dane są zapisywane jako plik tymczasowy w pamięci RAM przeglądarki i natychmiast oferowane do pobrania na dysk.

---

## 👨‍💻 Kontrybucja

Projekt jest rozwijany przez społeczność dla społeczności. Jeśli chcesz pomóc:

1. Zrób Fork repozytorium.
2. Wprowadź zmiany lub poprawki.
3. Otwórz Pull Request.

Wszystkie zgłoszenia błędów i propozycje funkcji (Issues) są mile widziane!

---

## ⚖️ Disclaimer

Narzędzie jest udostępniane "tak jak jest" (as-is), bez żadnych gwarancji. Jako autor nie ponoszę odpowiedzialności za ewentualne błędy w obliczeniach lub konsekwencje podatkowe wynikające z użycia tych danych. Zawsze weryfikuj dane z oficjalnymi raportami PDF z Trading212.

---

**Autor:** Dawid Konopiaty ([@DarkSpine433](https://github.com/DarkSpine433))

# 🚀 Trading212 CFD Data Exporter

### Jeżeli uważasz to narzędzie za przydatne, zostaw gwiazdkę na GitHubie! 🌟

[![GitHub stars](https://img.shields.io/github/stars/DarkSpine433/T212-CFD-DATA?style=for-the-badge&color=fac814)](https://github.com/DarkSpine433/T212-CFD-DATA/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/DarkSpine433/T212-CFD-DATA?style=for-the-badge&color=blue)](https://github.com/DarkSpine433/T212-CFD-DATA/issues)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

Darmowe narzędzie umożliwiające eksport szczegółowych danych transakcyjnych z konta **Trading212 CFD** do formatu JSON. Projekt rozwiązuje problem braku natywnego eksportu danych CFD na platformie, dostarczając plik gotowy do rozliczeń podatkowych (np. dla polskiego formularza **PIT-38** i popularnych kalkulatorów giełdowych).

👉 **Oficjalna strona** [darkspine433.github.io/T212-CFD-DATA/](https://darkspine433.github.io/T212-CFD-DATA/)

---
<img width="398" height="627" alt="T212-exporter-showcase" src="https://github.com/user-attachments/assets/b5f688aa-cf4e-4236-bfee-c73d9e8dda19" />


## ✨ Kluczowe Funkcje

- **Kompleksowy eksport:** Pobiera dane o zamkniętych pozycjach, opłatach FX, odsetkach (`CASH_INTEREST`) oraz opłatach overnight.
- **Interaktywne UI:** Nowoczesny panel z paskiem postępu i konsolą logów wyświetlany bezpośrednio na stronie Trading212.
- **Anti-Ban System:** Mechanizm _Retry_ chroniący przed blokadą za zbyt dużą liczbę zapytań (błąd 429).
- **100% Prywatności:** Dane przetwarzane są wyłącznie lokalnie w Twojej przeglądarce.

---

## 🐛 Zgłaszanie Błędów

Jeśli skrypt napotka problem:

1. Kliknij przycisk **"Zapisz Logi"** w panelu narzędzia, aby pobrać plik `T212_Logs.txt`.
2. Otwórz zgłoszenie w zakładce [Issues](https://github.com/DarkSpine433/T212-CFD-DATA/issues).
3. Opisz sytuację i załącz pobrany plik z logami.

---

## 🏗️ Struktura Projektu

- `index.html` - Strona wizytówka i generator kodu.
- `style.css` - Design strony (Premium Dark Design).
- `js/generatorJsonData.js` - Główny silnik aplikacji i logika API.

---

## 👨‍💻 Kontrybucja

Chcesz ulepszyć projekt?

1. Zrób Fork repozytorium.
2. Wprowadź poprawki.
3. Otwórz Pull Request.

---

## ⚖️ Prawa Autorskie i Licencja

© 2026 Dawid Konopiaty. Wszelkie prawa zastrzeżone.

- **Użytkownicy końcowi:** Mogą bezpłatnie korzystać ze skryptu do celów prywatnych (eksport danych własnych).
- **Ograniczenia:** Zabrania się kopiowania, redystrybucji oraz publikowania kodu źródłowego na innych stronach internetowych bez uprzedniej pisemnej lub ustnej zgody autora.

Pełna treść postanowień znajduje się w pliku [LICENCE.md](LICENCE.md).

---

## ⚠️ Disclaimer (Oświadczenie)

Narzędzie jest udostępniane "tak jak jest" (as-is), całkowicie za darmo. Autor nie ponosi odpowiedzialności za ewentualne błędy w obliczeniach, ubytki danych oraz konsekwencje prawno-podatkowe wynikające z użycia wygenerowanego pliku. Wynik należy traktować jako estymację.

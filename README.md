**Trading212 CFD Data Exporter (PIT-38 Tool)**

**O projekcie**: Narzędzie pomaga przekształcić eksportowane dane CFD z Trading212 w wartości przychodów i kosztów potrzebne do rozliczenia PIT-38.

## 🚀 Uruchamianie

### 1. **Kalkulator webowy** (najprostsze)

Otwórz plik `calculator.html` w przeglądarce:

- Kliknij ikonę pliku lub przeciągnij i upuść pliki JSON (positionDetails.json, postions.json, itp.)
- Kliknij **"Oblicz (PLN)"**
- Wyniki będą wyświetlone natychmiast

**Wymagania**: żaden — działa w dowolnej przeglądarce (wymaga dostępu do internetowego API NBP dla pobrania kursów walut)

### 2. **Skrypt Node.js CLI** (dla automatyzacji)

```bash
# Bez argumentów (szuka plików w Pobrane/sampleData)
node js/processCfdData.js

# Z podanymi ścieżkami do plików JSON
node js/processCfdData.js /path/to/positionDetails.json /path/to/postions.json
```

**Wymagania**: Node.js 18+ (ma wbudowany `fetch`) lub zainstaluj `node-fetch` dla starszych wersji.

## 📋 Implementowane reguły

### NBP (kursy walut)

- **PLN**: kurs = 1.0 (bez wywołań API)
- **Inne waluty**: pobieranie kursu z API NBP, z 10-dniowym fallbackem wstecz
- **Błąd**: Jeśli po 10 próbach brak kursu → _"Błąd: Nie można pobrać kursu NBP dla daty [X]. Sprawdź połączenie lub spróbuj później"_

### Prowizje i opłaty

- **FEE_FX** (fee_fx, feeFx): zawsze → **Koszty** (wartość dodatnia)
- **FEE_OVERNIGHT** (fee_overnight, feeOvernight):
  - wartość dodatnia → **Przychody**
  - wartość ujemna → **Koszty** (dodawana jako wartość dodatnia)

### Rozliczanie transakcji

- Pole `value` dodatnie → **Przychody**
- Pole `value` ujemne → **Koszty**
- Przeliczenie na PLN wg kursu NBP dla daty zdarzenia

## 📁 Pliki projektu

```
T212-CFD-DATA/
├── calculator.html          # Kalkulator webowy (główny interfejs)
├── js/processCfdData.js     # Skrypt Node.js do przetwarzania JSON
├── index.html               # (opcjonalne) Stara strona
├── style.css                # (opcjonalne) Style
└── README.md                # Ten plik
```

## 📊 Dane testowe

Załączone pliki w `Pobrane/sampleData/`:

- `positionDetails.json`
- `positionDetails-2.json`
- `postions.json`

**Przykładowy output na tych danych:**

```
Przychody: 1,490,052.95 PLN
Koszty: 950,368.53 PLN
Netto: 539,684.42 PLN
```

## ⚙️ Detale techniczne

### Kalkulator HTML

- **Frontend**: vanilla JavaScript (bez frameworków)
- **Features**: drag & drop, aktualizacja na żywo, wsparcie NBP API z fallbackiem
- **Kompatybilność**: wszystkie nowoczesne przeglądarki

### Skrypt Node.js

- Czyta pliki JSON (event-based lub positions list)
- Przenoszenie danych na PLN z kursami NBP
- CLI output w terminalu

---

✅ **Wszystkie wymagania zaimplementowane i przetestowane na danych próbkowych.**

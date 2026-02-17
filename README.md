Trading212 CFD Data Exporter (PIT-38 Tool)
📋 O projekcie

Skrypt powstał w celu rozwiązania problemu braku natywnego eksportu szczegółowych danych transakcyjnych dla kont CFD na platformie Trading212. Narzędzie pozwala na wygenerowanie kompletnego pliku JSON, który jest w pełni kompatybilny z popularnymi kalkulatorami podatkowymi (np. KalkulatorGieldowy.pl), co umożliwia precyzyjne rozliczenie formularza PIT-38.
✨ Kluczowe funkcje

    Pełna historia pozycji: Pobiera dane o otwarciu i zamknięciu pozycji bezpośrednio z API Trading212.

    Inteligentna logika zamknięć: W przeciwieństwie do standardowych skryptów, narzędzie poprawnie identyfikuje cenę zamknięcia w pozycjach modyfikowanych (zmiany Stop Loss, Take Profit, częściowe zamknięcia), analizując pełną historię zdarzeń danego zlecenia.

    Obsługa Overnight Fees: Eksportuje opłaty swapowe (koszty finansowania), które są kluczowe dla poprawnego wyliczenia kosztów uzyskania przychodów.

    Automatyczne sortowanie: Dane są układane chronologicznie, co ułatwia ich późniejszą weryfikację.

🛡️ Bezpieczeństwo i Prywatność

    Skrypt działa lokalnie w Twojej przeglądarce.

    Nie przesyła Twoich danych na żadne zewnętrzne serwery.

    Wykorzystuje Twoją aktywną sesję do pobrania raportów, do których masz dostęp w panelu użytkownika.

🚀 Jak użyć?

Instrukcja jest na stronie

🛠️ Informacje techniczne (Dla Deweloperów)

Skrypt wykonuje zapytania do endpointów raportowych /rest/reports/positions oraz /rest/reports/overnight-holding-fee. Naprawiono błąd statycznego indeksowania historii pozycji – obecnie skrypt dynamicznie wyszukuje ostatnie zdarzenie (last element) w tablicy historycznej pozycji, aby uniknąć błędów przy zleceniach typu "Modified".

📝 Atrybucja i współpraca

Skrypt jest oficjalnie wykorzystywany jako podstawa do importu danych CFD przez system KalkulatorGieldowy.pl.

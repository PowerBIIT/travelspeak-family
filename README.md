# TravelSpeak Family

Prosta aplikacja do tłumaczenia dla rodziny jadącej jutro do Europy. Pomaga w rozmowie z innymi w prosty sposób.

## 🚀 Funkcje

- **Tłumaczenie głosowe** - mów po polsku, zobacz tłumaczenie
- **Tłumaczenie tekstowe** - wpisz tekst do przetłumaczenia
- **Gotowe zwroty offline** - najważniejsze frazy działające bez internetu
- **Historia tłumaczeń** - dostęp do poprzednich tłumaczeń
- **Duże przyciski** - łatwe w użyciu dla całej rodziny

## 🚀 Szybki deployment na Railway

### 1. Przygotowanie (5 minut)

Załóż konta:
- [DeepSeek](https://platform.deepseek.com/api_keys) - tłumaczenia (10$ kredytu wystarczy na miesiące)
- [AssemblyAI](https://www.assemblyai.com/app/account) - rozpoznawanie mowy (darmowe 416h/miesiąc)

### 2. Deploy na Railway

```bash
# W terminalu w folderze projektu
railway login
railway link
railway up
```

### 3. Dodaj klucze API w Railway

```bash
railway variables --set "DEEPSEEK_API_KEY=twój_klucz" --set "ASSEMBLYAI_API_KEY=twój_klucz"
railway up
```

Aplikacja będzie dostępna pod adresem który Railway poda po deploymencie.

## 📱 Instalacja na telefonie

1. Otwórz aplikację w przeglądarce na telefonie
2. **Android**: Kliknij "Dodaj do ekranu głównego"
3. **iOS**: Kliknij Udostępnij → "Dodaj do ekranu głównego"

## 📖 Jak używać

1. **Wybierz języki** - Polski ↔ Angielski/Francuski
2. **Tłumaczenie głosowe** - Naciśnij duży mikrofon i mów
3. **Tłumaczenie tekstowe** - Wpisz i kliknij "Przetłumacz"
4. **Gotowe zwroty** - Działają bez internetu!

## ✅ Przed wyjazdem

- [ ] Zainstaluj na wszystkich telefonach
- [ ] Sprawdź gotowe zwroty (działają offline)
- [ ] Przetestuj tłumaczenie głosowe
- [ ] Pokaż dzieciom gdzie są zwroty SOS

## 💡 Wskazówki

- Gotowe zwroty działają BEZ INTERNETU
- Kategoria SOS zawiera najważniejsze frazy
- Historia zapisuje ostatnie 50 tłumaczeń
- Możesz kopiować tłumaczenia przyciskiem

Powodzenia w podróży! 🎉
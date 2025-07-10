# TravelSpeak Family

Prosta aplikacja do tłumaczenia dla całej rodziny podczas wyjazdu do Anglii i Francji. Zaprojektowana z myślą o łatwości użycia przez wszystkich członków rodziny - od dzieci po dziadków.

## 🚀 Funkcje

- **Tłumaczenie głosowe** - mów po polsku, słuchaj w języku docelowym
- **Tłumaczenie tekstowe** - wpisz tekst do przetłumaczenia
- **Gotowe zwroty offline** - najważniejsze frazy działające bez internetu
- **Historia tłumaczeń** - dostęp do poprzednich tłumaczeń
- **Duże przyciski** - łatwe w użyciu dla osób starszych
- **3 rozmiary czcionki** - dostosowanie do potrzeb użytkownika

## 🛠 Technologie

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- PWA z Service Worker
- Zustand (zarządzanie stanem)

## 📋 Wymagania

- Node.js 18+
- Konta w serwisach:
  - [DeepSeek](https://deepseek.com) - tłumaczenia
  - [AssemblyAI](https://assemblyai.com) - speech-to-text
  - [AWS](https://aws.amazon.com) - Amazon Polly dla text-to-speech

## 🚀 Szybki start

1. **Sklonuj repozytorium**
```bash
git clone https://github.com/your-username/travelspeak-family.git
cd travelspeak-family
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Skonfiguruj zmienne środowiskowe**
```bash
cp .env.example .env.local
```

Następnie wypełnij plik `.env.local` swoimi kluczami API:
- `DEEPSEEK_API_KEY` - klucz API z DeepSeek
- `ASSEMBLYAI_API_KEY` - klucz API z AssemblyAI
- `AWS_ACCESS_KEY_ID` - klucz dostępu AWS
- `AWS_SECRET_ACCESS_KEY` - sekretny klucz AWS
- `AWS_REGION` - region AWS (domyślnie us-east-1)

4. **Uruchom aplikację lokalnie**
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment na Vercel

1. **Zainstaluj Vercel CLI**
```bash
npm i -g vercel
```

2. **Połącz z Vercel**
```bash
vercel link
```

3. **Dodaj zmienne środowiskowe**
```bash
vercel env add DEEPSEEK_API_KEY production
vercel env add ASSEMBLYAI_API_KEY production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add AWS_REGION production
```

4. **Deploy**
```bash
vercel --prod
```

## 📱 Instalacja na telefonie

Po deploymencie aplikacja działa jako PWA:

1. Otwórz aplikację w przeglądarce na telefonie
2. **Android**: Kliknij "Dodaj do ekranu głównego"
3. **iOS**: Kliknij przycisk Udostępnij → "Dodaj do ekranu głównego"

## 💰 Koszty

- **DeepSeek**: ~0.0004$ per tłumaczenie
- **AssemblyAI**: Darmowe 416h/miesiąc
- **Amazon Polly**: Darmowe 5M znaków/miesiąc
- **Łącznie**: ~5 PLN/miesiąc przy normalnym użyciu

## 🔒 Bezpieczeństwo

- Wszystkie klucze API przechowywane w zmiennych środowiskowych
- Limit 100 tłumaczeń dziennie
- Maksymalna długość tekstu: 500 znaków
- Maksymalny czas nagrania: 30 sekund

## 📖 Użycie

1. **Wybierz języki** na stronie głównej
2. **Tłumaczenie głosowe**: Naciśnij duży przycisk mikrofonu i mów
3. **Tłumaczenie tekstowe**: Wpisz tekst i kliknij "Przetłumacz"
4. **Gotowe zwroty**: Działają offline, idealne na lotnisko
5. **Historia**: Przejrzyj poprzednie tłumaczenia

## ✅ Przed wyjazdem

- [ ] Zainstaluj aplikację na wszystkich telefonach
- [ ] Przetestuj tłumaczenie głosowe
- [ ] Sprawdź czy gotowe zwroty działają offline
- [ ] Dostosuj wielkość czcionki dla dziadków
- [ ] Pokaż dzieciom gdzie są zwroty SOS
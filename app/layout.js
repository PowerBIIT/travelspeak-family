import "./globals.css";

export const metadata = {
  title: "TravelSpeak Family",
  description: "Prosta aplikacja do tłumaczenia dla całej rodziny",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TravelSpeak" />
      </head>
      <body>{children}</body>
    </html>
  );
}
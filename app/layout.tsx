import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mantenimiento de Flota",
  description: "Sistema sencillo para registrar mantenimiento de vehiculos.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

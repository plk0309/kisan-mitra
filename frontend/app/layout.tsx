import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "किसान मित्र | Kisan Mitra",
  description: "AI agriculture assistant for Indian farmers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
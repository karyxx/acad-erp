import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acad-ERP",
  description: "Minimalist Academic ERP System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

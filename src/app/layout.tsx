import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeetingRecorder AI",
  description: "Grave reunioes, transcreva com IA e gere acoes automaticamente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Sidebar />
        <main className="lg:pl-56 min-h-screen relative">
          {/* Hero gradient atmosphere */}
          <div className="gradient-hero pointer-events-none fixed inset-x-0 top-0 h-[500px] lg:left-56 z-0" />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 pt-16 lg:pt-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

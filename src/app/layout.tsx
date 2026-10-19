import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Devansh Portfolio Hub",
    template: "%s | Devansh Portfolio Hub",
  },
  description:
    "Devansh Verma: Computer Science student, competitive programmer, and AI/ML & deep learning enthusiast. Projects, achievements, certificates, and Codeforces and LeetCode progress.",
  openGraph: {
    title: "Devansh Verma | Portfolio",
    description:
      "Projects, achievements, certificates, and competitive programming progress.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

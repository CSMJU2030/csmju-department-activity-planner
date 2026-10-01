import { Navigation } from "@/components/layout/Navigation";
import { CoreSession } from "@/components/layout/CoreSession";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "กิจกรรมนักศึกษา | CSMJU2030",
  description: "วางแผนกิจกรรม ร่วมทีม และพัฒนากิจกรรมนักศึกษาไปด้วยกัน",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The layout must render even when the backend is down or the user is signed out.
  const { session, available } = await getSession()
    .then((session) => ({ session, available: true }))
    .catch(() => ({ session: null, available: false }));
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">ข้ามไปเนื้อหา</a>
        <Navigation canCreate={session?.canCreate ?? false} signedIn={session !== null} />
        <CoreSession signedIn={session !== null} available={available} />
        <div id="main-content" className="flex-1" tabIndex={-1}>{children}</div>
        <footer className="site-footer">CSMJU2030 · Activity Planning &amp; Improvement System<br />สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</footer>
      </body>
    </html>
  );
}

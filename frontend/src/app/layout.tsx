import { Navigation } from "@/components/layout/Navigation";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession, type Session } from "@/lib/session";

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
  const session: Session | null = await getSession().catch(() => null);
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><a href="#main-content" className="skip-link">ข้ามไปเนื้อหา</a><Navigation canCreate={session?.canCreate ?? false} signedIn={session !== null} />{process.env.NODE_ENV !== "production" && <p className="bg-secondary text-primary text-sm leading-relaxed px-6 py-2 text-center">โหมดพัฒนา · {session?.me.email ?? "ยังไม่ได้เข้าสู่ระบบ"} · ข้อมูลอยู่ในฐานข้อมูลของระบบย่อยผ่าน backend</p>}<div id="main-content" className="flex-1" tabIndex={-1}>{children}</div><footer className="site-footer">CSMJU2030 · Activity Planning &amp; Improvement System<br />สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</footer></body>
    </html>
  );
}

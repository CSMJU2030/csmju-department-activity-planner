"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="dashboard-shell"><div className="empty-panel">
    <h1>ยังโหลดข้อมูลไม่ได้</h1>
    <p>กรุณาตรวจสอบว่า backend ของระบบย่อยและฐานข้อมูลพร้อมใช้งาน แล้วลองอีกครั้ง</p>
    <button className="primary-link" onClick={reset}>ลองใหม่</button>
  </div></main>;
}

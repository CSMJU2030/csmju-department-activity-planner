"use client";
import { useState } from "react";
import Link from "next/link";
import type { ActivityItem } from "@/types/activity";
import { activityStatusLabels, categoryLabels, formatActivityDate } from "@/lib/activity-presentation";

export function ActivityCatalog({ activities }: { activities: ActivityItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const visible = activities.filter(a =>
    (filter === "all" || a.status === filter) &&
    [a.title, a.description, a.location, categoryLabels[a.category] ?? a.category].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );
  return <section className="space-y-6" aria-labelledby="catalog-title">
    <div className="section-heading"><div><p className="eyebrow">ค้นหาประสบการณ์ใหม่</p><h2 id="catalog-title">กิจกรรมทั้งหมด</h2></div><span className="muted" aria-live="polite">พบ {visible.length} กิจกรรม</span></div>
    <div className="catalog-toolbar">
      <label className="search-field"><span>ค้นหากิจกรรม</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อกิจกรรม สถานที่ หรือหมวดหมู่…" /></label>
      <label className="filter-field"><span>สถานะกิจกรรม</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">ทุกสถานะ</option>{Object.entries(activityStatusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {visible.length === 0 ? <div className="empty-panel"><span className="empty-symbol" aria-hidden="true">⌕</span><h3>ยังไม่พบกิจกรรมที่ตรงกัน</h3><p>ลองใช้คำค้นอื่น หรือเลือกดูทุกสถานะ</p><button className="secondary-link" onClick={()=>{setQuery("");setFilter("all");}}>ล้างตัวกรอง</button></div> :
      <div className="activity-grid">{visible.map(a=><article key={a.id} className="activity-card">
        <div className="activity-art" aria-hidden="true"><span>{categoryLabels[a.category] ?? a.category}</span><span className="art-glyph">{a.category === "workshop" ? "{ }" : "CS /"}</span><span className="art-caption">LEARN · CONNECT · GROW</span></div>
        <div className="activity-card-body"><div className="flex flex-wrap gap-2 items-center"><span className="status-pill" data-status={a.status}>{activityStatusLabels[a.status]}</span><span className="muted">{categoryLabels[a.category] ?? a.category}</span></div>
          <h3><Link href={`/activities/${a.id}`}>{a.title}</Link></h3><p className="muted line-clamp-2">{a.description}</p>
          <dl className="activity-meta"><div><dt>วันและเวลา</dt><dd>{formatActivityDate(a.startAt)}</dd></div><div><dt>สถานที่</dt><dd>{a.location}</dd></div></dl>
          <div className="card-bottom"><span className="muted">ผู้เข้าร่วม <strong className="text-neutral">{a.currentParticipants}/{a.maxParticipants}</strong> คน</span><Link href={`/activities/${a.id}`} className="secondary-link">ดูรายละเอียด →</Link></div>
        </div></article>)}</div>}
  </section>;
}

"use client";
import { ActivityStatusBadge } from "@/components/activities/ActivityStatusBadge";
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
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-label-md text-primary-container">ค้นหาประสบการณ์ใหม่</p><h2 id="catalog-title">กิจกรรมทั้งหมด</h2></div><span className="text-body-md leading-relaxed text-on-surface-variant" aria-live="polite">พบ {visible.length} กิจกรรม</span></div>
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end [&_label>span]:block [&_label>span]:mb-2 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-outline-variant [&_input]:bg-surface-container-lowest [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-body-md [&_input]:focus:ring-2 [&_input]:focus:ring-accent [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-outline-variant [&_select]:bg-surface-container-lowest [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-body-md">
      <label className="flex-1"><span>ค้นหากิจกรรม</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อกิจกรรม สถานที่ หรือหมวดหมู่…" /></label>
      <label className="w-full md:w-64"><span>สถานะกิจกรรม</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">ทุกสถานะ</option>{Object.entries(activityStatusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {visible.length === 0 ? <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest text-center p-8 [&_h3]:text-headline-md [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:text-body-md [&_p]:text-on-surface-variant [&_p]:mb-6"><span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-container/10 text-primary-container text-headline-md" aria-hidden="true">⌕</span><h3>ยังไม่พบกิจกรรมที่ตรงกัน</h3><p>ลองใช้คำค้นอื่น หรือเลือกดูทุกสถานะ</p><button className="inline-flex items-center justify-center min-h-11 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" onClick={()=>{setQuery("");setFilter("all");}}>ล้างตัวกรอง</button></div> :
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{visible.map(a=><article key={a.id} className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="h-40 bg-primary-container/10 text-primary-container p-6 relative overflow-hidden" aria-hidden="true"><span>{categoryLabels[a.category] ?? a.category}</span><span className="absolute right-6 top-6 text-display-lg font-display">{a.category === "workshop" ? "{ }" : "CS /"}</span><span className="absolute bottom-6 left-6 text-label-md">LEARN · CONNECT · GROW</span></div>
        <div className="p-6 [&_h3]:text-headline-md [&_h3]:mt-4 [&_h3]:mb-2"><div className="flex flex-wrap gap-2 items-center"><ActivityStatusBadge status={a.status} /><span className="text-body-md leading-relaxed text-on-surface-variant">{categoryLabels[a.category] ?? a.category}</span></div>
          <h3><Link href={`/activities/${a.id}`}>{a.title}</Link></h3><p className="text-body-md leading-relaxed text-on-surface-variant line-clamp-2">{a.description}</p>
          <dl className="grid gap-2 mt-6 text-body-md [&>div]:flex [&>div]:gap-4 [&_dt]:w-20 [&_dt]:shrink-0 [&_dt]:text-on-surface-variant [&_dd]:min-w-0 [&_dd]:break-words"><div><dt>วันและเวลา</dt><dd>{formatActivityDate(a.startAt)}</dd></div><div><dt>สถานที่</dt><dd>{a.location}</dd></div></dl>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-outline-variant/40"><span className="text-body-md leading-relaxed text-on-surface-variant">ผู้เข้าร่วม <strong className="text-on-surface">{a.currentParticipants}/{a.maxParticipants}</strong> คน</span><Link href={`/activities/${a.id}`} className="inline-flex items-center justify-center min-h-11 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">ดูรายละเอียด →</Link></div>
        </div></article>)}</div>}
  </section>;
}

"use client";

import Link from "next/link";
import { CheckIcon } from "@/csmju";
import { useActionState, useState } from "react";
import { createActivityAction } from "@/app/actions/activity";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type Result = { success: boolean; error?: string; activityId?: string };

export function CreateActivityForm() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const dateError =
    startAt && endAt && endAt <= startAt
      ? "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น"
      : "";
  const [result, submit, pending] = useActionState<Result, FormData>(
    async (_previous, data) => {
      try {
        return await createActivityAction(data);
      } catch {
        return { success: false, error: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" };
      }
    },
    { success: false }
  );

  if (result.success && result.activityId) {
    return (
      <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest text-center p-8 [&_h3]:text-headline-md [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:text-body-md [&_p]:text-on-surface-variant [&_p]:mb-6" aria-labelledby="created-title">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-container/10 text-primary-container" aria-hidden="true"><CheckIcon className="h-6 w-6" /></span>
        <h2 id="created-title" className="text-2xl font-bold text-primary" role="status">
          สร้างกิจกรรมเรียบร้อยแล้ว
        </h2>
        <p className="mt-3">{title} พร้อมเปิดรับผู้เข้าร่วมแล้ว</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="btn-gradient inline-flex items-center justify-center min-h-11 rounded-lg px-4 py-2.5 text-label-md text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50" href={`/organizer/${result.activityId}/manage`}>
            ไปหน้าจัดการกิจกรรม →
          </Link>
          <Link className="inline-flex items-center justify-center min-h-11 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" href={`/activities/${result.activityId}`}>
            ดูหน้ากิจกรรม
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form action={submit} className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start [&>:first-child]:min-w-0 xl:[&>:first-child]:col-span-2">
      <fieldset disabled={pending} className="min-w-0 space-y-6">
        <section className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm p-6 space-y-5" aria-labelledby="basic-title">
          <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/40 [&>span]:bg-primary-container/10 [&>span]:text-primary-container [&>span]:px-3 [&>span]:py-2 [&>span]:rounded-lg [&_p]:text-on-surface-variant [&_p]:mt-1">
            <span aria-hidden="true">01</span>
            <div>
              <h2 id="basic-title">เล่าไอเดียกิจกรรมของคุณ</h2>
              <p>ชื่อและรายละเอียดที่ชัดเจนช่วยให้เพื่อนตัดสินใจเข้าร่วม</p>
            </div>
          </div>
          <Input
            id="title"
            name="title"
            label="ชื่อกิจกรรม *"
            placeholder="เช่น Git & GitHub Workshop สำหรับมือใหม่"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-describedby="title-count"
          />
          <p id="title-count" className="text-body-md leading-relaxed text-on-surface-variant text-right">
            {title.length} / 150 ตัวอักษร
          </p>

          <Input
            id="category"
            name="category"
            label="หมวดหมู่กิจกรรม *"
            placeholder="ระบุหมวดหมู่ เช่น วิชาการ, อบรมเชิงปฏิบัติการ, กีฬา"
            required
            maxLength={150}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-describedby="category-count"
          />
          <p id="category-count" className="text-body-md leading-relaxed text-on-surface-variant text-right">
            {category.length} / 150 ตัวอักษร
          </p>

          <Textarea
            id="description"
            name="description"
            label="รายละเอียดกิจกรรม *"
            placeholder={
              "กิจกรรมนี้เกี่ยวกับอะไร?\nผู้เข้าร่วมจะได้เรียนรู้อะไร?\nต้องเตรียมตัวหรืออุปกรณ์อะไรบ้าง?"
            }
            rows={7}
            required
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-describedby="description-count"
          />
          <p id="description-count" className="text-body-md leading-relaxed text-on-surface-variant text-right">
            {description.length} / 5,000 ตัวอักษร
          </p>
        </section>

        <section className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm p-6 space-y-5" aria-labelledby="schedule-title">
          <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/40 [&>span]:bg-primary-container/10 [&>span]:text-primary-container [&>span]:px-3 [&>span]:py-2 [&>span]:rounded-lg [&_p]:text-on-surface-variant [&_p]:mt-1">
            <span aria-hidden="true">02</span>
            <div>
              <h2 id="schedule-title">วัน เวลา และสถานที่</h2>
              <p>ระบุเวลาประเทศไทย เพื่อให้ผู้เข้าร่วมวางแผนได้</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="startAt"
              name="startAt"
              label="วันและเวลาเริ่มต้น *"
              type="datetime-local"
              required
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            <Input
              id="endAt"
              name="endAt"
              label="วันและเวลาสิ้นสุด *"
              type="datetime-local"
              required
              min={startAt || undefined}
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? "date-error" : undefined}
            />
          </div>
          {dateError && (
            <p id="date-error" role="alert" className="text-primary text-sm">
              {dateError}
            </p>
          )}
          <Input
            id="location"
            name="location"
            label="สถานที่จัดกิจกรรม *"
            placeholder="เช่น ห้อง CS201 อาคารวิทยาศาสตร์"
            maxLength={200}
            required
          />
        </section>

        <section className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm p-6 space-y-5" aria-labelledby="capacity-title">
          <div className="flex gap-4 items-start pb-4 border-b border-outline-variant/40 [&>span]:bg-primary-container/10 [&>span]:text-primary-container [&>span]:px-3 [&>span]:py-2 [&>span]:rounded-lg [&_p]:text-on-surface-variant [&_p]:mt-1">
            <span aria-hidden="true">03</span>
            <div>
              <h2 id="capacity-title">จำนวนผู้เข้าร่วม</h2>
              <p>กำหนดจำนวนที่เหมาะกับพื้นที่และรูปแบบกิจกรรม</p>
            </div>
          </div>
          <div className="max-w-xs">
            <Input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              label="จำนวนที่เปิดรับ (คน) *"
              min={1}
              step={1}
              defaultValue={30}
              required
            />
          </div>
          <p className="text-body-md leading-relaxed text-on-surface-variant">
            เมื่อมีผู้ลงทะเบียนครบ ระบบจะเปลี่ยนสถานะเป็น “ที่นั่งเต็ม”
          </p>
        </section>

        {result.error && (
          <div className="p-4 bg-primary-container/10 text-primary-container rounded-lg text-body-md" role="alert">
            {result.error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <Link href="/my-activities" className="inline-flex items-center justify-center min-h-11 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            กลับไปกิจกรรมของฉัน
          </Link>
          <Button type="submit" disabled={pending || Boolean(dateError)}>
            {pending ? "กำลังบันทึกกิจกรรม…" : "สร้างและเปิดรับสมัคร →"}
          </Button>
        </div>
      </fieldset>

      <aside className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm p-6 [&_ol]:grid [&_ol]:gap-6 [&_ol]:my-6 [&_li>strong]:block [&_li>span]:block [&_li>span]:text-on-surface-variant">
        <p className="text-label-md text-primary-container">จากไอเดียสู่กิจกรรมจริง</p>
        <h2>
          พร้อมเริ่มสิ่งใหม่
          <br />
          ไปด้วยกันไหม?
        </h2>
        <p>กรอกข้อมูล 3 ส่วน แล้วเปิดพื้นที่ให้เพื่อน ๆ มาเข้าร่วมกิจกรรมของคุณ</p>
        <ol>
          <li>
            <strong>ข้อมูลกิจกรรม</strong>
            <span>บอกว่าใครเหมาะกับกิจกรรมนี้ และจะได้อะไรกลับไป</span>
          </li>
          <li>
            <strong>กำหนดการ</strong>
            <span>ตรวจวัน เวลา และสถานที่ให้ตรงกัน</span>
          </li>
          <li>
            <strong>จำนวนที่เปิดรับ</strong>
            <span>ระบุจำนวนผู้เข้าร่วมสูงสุด</span>
          </li>
        </ol>
        <div className="p-4 bg-primary-container/10 text-primary-container rounded-lg text-body-md">
          <strong>เมื่อกดสร้างกิจกรรม</strong>
          <p>
            กิจกรรมจะเปิดรับสมัครทันที และคุณสามารถแก้ไขรายละเอียดได้จากหน้าจัดการ
          </p>
        </div>
      </aside>
    </form>
  );
}

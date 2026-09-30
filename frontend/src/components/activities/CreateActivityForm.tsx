"use client";

import Link from "next/link";
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
      <section className="empty-panel" aria-labelledby="created-title">
        <span className="empty-symbol" aria-hidden="true">✓</span>
        <h2 id="created-title" className="text-2xl font-bold text-primary" role="status">
          สร้างกิจกรรมเรียบร้อยแล้ว
        </h2>
        <p className="mt-3">{title} พร้อมเปิดรับผู้เข้าร่วมแล้ว</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="primary-link" href={`/organizer/${result.activityId}/manage`}>
            ไปหน้าจัดการกิจกรรม →
          </Link>
          <Link className="secondary-link" href={`/activities/${result.activityId}`}>
            ดูหน้ากิจกรรม
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form action={submit} className="create-layout">
      <fieldset disabled={pending} className="min-w-0 space-y-6">
        <section className="workspace-card space-y-5" aria-labelledby="basic-title">
          <div className="form-section-title">
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
          <p id="title-count" className="muted text-right">
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
          <p id="category-count" className="muted text-right">
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
          <p id="description-count" className="muted text-right">
            {description.length} / 5,000 ตัวอักษร
          </p>
        </section>

        <section className="workspace-card space-y-5" aria-labelledby="schedule-title">
          <div className="form-section-title">
            <span aria-hidden="true">02</span>
            <div>
              <h2 id="schedule-title">วัน เวลา และสถานที่</h2>
              <p>ระบุเวลาประเทศไทย เพื่อให้ผู้เข้าร่วมวางแผนได้</p>
            </div>
          </div>
          <div className="form-two-columns">
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

        <section className="workspace-card space-y-5" aria-labelledby="capacity-title">
          <div className="form-section-title">
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
          <p className="muted">
            เมื่อมีผู้ลงทะเบียนครบ ระบบจะเปลี่ยนสถานะเป็น “ที่นั่งเต็ม”
          </p>
        </section>

        {result.error && (
          <div className="form-notice" role="alert">
            {result.error}
          </div>
        )}

        <div className="form-submit-bar">
          <Link href="/my-activities" className="secondary-link">
            กลับไปกิจกรรมของฉัน
          </Link>
          <Button type="submit" disabled={pending || Boolean(dateError)}>
            {pending ? "กำลังบันทึกกิจกรรม…" : "สร้างและเปิดรับสมัคร →"}
          </Button>
        </div>
      </fieldset>

      <aside className="create-guide">
        <p className="eyebrow">จากไอเดียสู่กิจกรรมจริง</p>
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
        <div className="form-notice">
          <strong>เมื่อกดสร้างกิจกรรม</strong>
          <p>
            กิจกรรมจะเปิดรับสมัครทันที และคุณสามารถแก้ไขรายละเอียดได้จากหน้าจัดการ
          </p>
        </div>
      </aside>
    </form>
  );
}
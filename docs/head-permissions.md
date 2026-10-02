# สิทธิ์ Head ภายในระบบกิจกรรม

Core ยืนยันตัวตนและ role ทุก request; ระบบย่อยเก็บเฉพาะสิทธิ์สร้างกิจกรรมที่ผูกกับ Core `sub` ใน `activity_heads`
เฉพาะ Core role `admin` จัดการได้ ไม่มี bootstrap admin จำลอง ไม่มีการแต่งตั้งตัวเองโดย student/staff

## ใช้งาน

1. เปิด PostgreSQL local แล้วรัน migration `20261002000001_activity_heads` ด้วย `pnpm --filter backend prisma:deploy`
2. รีสตาร์ท backend หลัง generate Prisma client (`pnpm --filter backend prisma:generate`)
3. ลงชื่อเข้าใช้ด้วย Core admin และเปิด `/admin/heads` หรือเมนู “จัดการสิทธิ์ Head”
4. ตรวจรหัสผู้ใช้ Core จริงจากทีม Core แล้วกรอกเพื่อแต่งตั้ง ไม่ใช้อีเมล/รหัสนักศึกษาที่เดาเอง
5. ผู้ใช้ต้องมี role student ตอนสร้างกิจกรรม และมี active Head ในฐานข้อมูล

การ grant ซ้ำจะต่ออายุข้อมูลผู้แต่งตั้งล่าสุดโดยไม่สร้างรายการซ้ำ; การ revoke เก็บผู้ถอนและเวลาล่าสุด ไม่ลบสิทธิ์หรือกิจกรรม
หน้านี้แสดงข้อมูลแต่งตั้ง/ถอนสิทธิ์ล่าสุด ไม่ใช่ประวัติ audit ครบทุกการเปลี่ยนแปลง
การถอนสิทธิ์หยุดการสร้างใหม่ แต่ไม่เปลี่ยนเจ้าของกิจกรรมเดิม
`CLASS_HEAD_CORE_USER_IDS` ไม่ได้ใช้แล้ว และไม่มีการนำรายการเดิมหรือข้อมูล demo มาตั้งสิทธิ์อัตโนมัติ

## API

- `GET /api/v1/admin/activity-heads`: รายการสิทธิ์ เฉพาะ Core admin
- `POST /api/v1/admin/activity-heads`: `{ coreUserId: "<Core sub>" }` แต่งตั้ง/เปิดใช้งานอีกครั้ง
- `DELETE /api/v1/admin/activity-heads/:coreUserId`: ถอนสิทธิ์ active
- `GET /api/v1/me/activity-capabilities`: สถานะสร้างกิจกรรมของผู้ใช้ปัจจุบันจากฐานข้อมูล

ระบบยังไม่ตรวจว่ารหัสเป้าหมายมีอยู่จริงใน Core เพราะยังไม่มีการเชื่อม endpoint ทะเบียนบุคคลสำหรับหน้าจอนี้
การ grant ไม่ได้เปลี่ยน Core role; ผู้ใช้ที่ role staff/admin จึงไม่ได้เป็นนักศึกษาผู้สร้างเพียงเพราะมีรายการ Head

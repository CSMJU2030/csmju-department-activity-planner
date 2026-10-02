# csmju-department-activity-planner

Department Activity Planner — ระบบวางแผนและประเมินกิจกรรมนักศึกษา สาขาวิชาวิทยาการคอมพิวเตอร์ ระบบย่อยของโครงการ CSMJU2030

ย้ายมาจากโปรเจกต์ MIS (`activity` ตัวเดียวแบบ Next.js + Prisma ในตัว) โดยคงฟังก์ชันเดิมไว้ทั้งหมด
แต่แยกโครงสร้างตามมาตรฐาน CSMJU2030: **frontend ห้ามต่อฐานข้อมูลตรง** (ARC-01) ข้อมูลและกฎธุรกิจอยู่ที่ backend NestJS

มาตรฐานกลางอยู่ใน `standards/` (submodule ของ CSMJU2030/csmju2030-standards ตรึงที่ **v1.7.0**, auth contract 1.2)

| ทำอะไรได้ | ใคร |
|---|---|
| ดูกิจกรรม · ลงทะเบียน/ยกเลิก · สมัครทีมงาน · ประเมินเมื่อกิจกรรมจบ | ผู้ใช้ที่ login (student · staff · admin) — alumni ดูได้อย่างเดียว |
| สร้างกิจกรรม | **นักศึกษาที่เป็นหัวหน้าห้อง** เท่านั้น |
| แก้กิจกรรม · เปลี่ยนสถานะ · เพิ่มตำแหน่งทีมงาน · รับ/ปฏิเสธผู้สมัคร · ดูผลประเมิน | เจ้าของกิจกรรม (ผู้สร้าง) เท่านั้น |

## โครงสร้าง

```text
csmju-department-activity-planner/
├── frontend/          Next.js 16 (App Router) — พอร์ต 3002 ประตูเดียวของระบบย่อย
├── backend/           NestJS 11 + Prisma 7.9.1 — พอร์ต 4202 (ตรวจ JWT ผ่าน JWKS ด้วย jose)
├── standards/         git submodule → csmju2030-standards@v1.7.0
├── subsystem.yaml     manifest ที่ CI และ conformance อ่าน (DevOps/PM เป็นเจ้าของ)
├── .standards-version
└── docker-compose.yml PostgreSQL ของระบบย่อยเอง (พอร์ต 5434) + backend
```

- `backend/src/auth/`, `backend/src/common/` รองรับ auth contract 1.2: RS256/JWKS, อายุ access token, `azp`, state-bound SSO และไม่ log URL callback ที่มี token
- `backend/src/activities/` คือโดเมนของระบบนี้ (ย้ายมาจาก `activity.repository.ts` + Server Actions ของ MIS)
- frontend ส่ง `/api/*`, `/auth/login`, `/auth/callback`, `/auth/logout` ต่อไปที่ backend — คุกกี้ SSO อยู่ origin เดียวกับหน้าเว็บ
- Server Actions ใน frontend ยังตรวจรูปแบบฟอร์มเหมือนเดิม แล้วส่งต่อไป backend พร้อมคุกกี้ของผู้ใช้

## รันในเครื่องและเชื่อม Core Hub

ใช้ Core Hub จริง `https://csmju2030.jowave.com` ไม่ต้องรัน Core Hub ในเครื่อง
ลบ `LOCAL_TEST_ROLE` / `LOCAL_DEV_AUTH` จากไฟล์ env เดิมก่อนเริ่ม — ระบบไม่มีผู้ใช้จำลองหรือทางลัดตรวจ JWT แล้ว
PL ต้องลงทะเบียน/อนุมัติ/เปิดใช้งานระบบใน Core ก่อน (name `csmju-department-activity-planner`)
callback ปัจจุบัน `http://localhost:3002/auth/callback` ต้องตรงกับทะเบียนทุกตัวอักษร
พอร์ต 3002 เป็นค่าของ checkout นี้; ขอพอร์ต 32xx จากทีมก่อนเปลี่ยนและแจ้ง Core ให้อัปเดต callback พร้อมกัน

```bash
git submodule update --init standards/      # ให้ standards/ ตรงกับ .standards-version (ห้ามใส่ --remote)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
pnpm install

docker compose up -d csmju-department-activity-planner-db     # PostgreSQL พอร์ต 5434
pnpm --filter backend prisma:deploy                            # สร้างตารางจาก migration

pnpm --filter backend start:dev      # :4202
pnpm --filter frontend dev           # :3002
```

เปิด `http://localhost:3002` → กด "เข้าสู่ระบบผ่าน CSMJU Core Hub"

### แต่งตั้ง Head ในเว็บเรา

ใช้บัญชีที่ Core ส่ง role `admin` เข้า `/admin/heads` เพื่อแต่งตั้ง/ถอนสิทธิ์ตามรหัส Core user (`sub`) จริง
สิทธิ์เก็บในตาราง `activity_heads` ของ PostgreSQL เรา; ไม่เปลี่ยนบทบาทใน Core และไม่แต่งตั้งจากค่าที่ส่งมาใน token เพิ่มเอง
ผู้สร้างกิจกรรมต้องเป็น `student` และมี Head ที่ active ในฐานข้อมูลทุกครั้งที่เรียก API
`CLASS_HEAD_CORE_USER_IDS` เดิมไม่ใช้ตัดสินสิทธิ์แล้ว; ผู้ดูแลต้องแต่งตั้งรายชื่อจริงผ่านหน้าเว็บ ไม่มีการนำค่าตัวอย่างมาแต่งตั้งอัตโนมัติ
การถอนสิทธิ์หยุดการสร้างกิจกรรมใหม่ แต่ยังให้เจ้าของจัดการกิจกรรมที่สร้างไว้ได้
ระบบยังไม่มี API ตรวจรายชื่อผู้ใช้ Core อัตโนมัติ ผู้ดูแลต้องตรวจรหัสให้ถูกต้องก่อนกรอก
รัน `pnpm --filter backend prisma:deploy` หลังเปิด Docker เพื่อเพิ่มตารางโดยไม่ลบข้อมูลเดิม

ดูรายการส่งต่อให้ PL/PM และวิธีตรวจเชื่อมต่อจริงใน [docs/core-integration.md](docs/core-integration.md)

## ทดสอบ

```bash
pnpm --filter backend test            # unit: auth · DTO validation · กฎธุรกิจของกิจกรรม
pnpm --filter backend test:e2e        # SSO callback + สิทธิ์ (ไม่ต้องมี PostgreSQL)
pnpm --filter frontend test           # Server Action: ตรวจฟอร์มและสิ่งที่ส่งต่อไป backend

# ต้องมี PostgreSQL local (docker compose ด้านบน) และ migration แล้ว
DATABASE_URL=postgresql://postgres:<รหัสผ่าน>@localhost:5434/csmju_department_activity_planner \
  pnpm --filter backend test:integration     # row lock · ที่นั่งเต็มพร้อมกัน · CHECK constraint จริง

pnpm --filter backend generate:openapi   # อัปเดต backend/openapi.json ทุกครั้งที่แก้ endpoint/DTO (API-01)
rm -rf frontend/.next && pnpm -r typecheck
./standards/scripts/run-all-checks.sh .      # static — เหมือน CI
node standards/conformance/run.js            # runtime — ต้องรันระบบจริง
```

## API (`/api/v1`, ห่อ `{ success, data }` ตามมาตรฐาน)

| Method · path | สิทธิ์ | ทำอะไร |
|---|---|---|
| `GET /activities?page=&limit=` | อ่าน | รายการกิจกรรม (เรียงใหม่สุดก่อน) |
| `GET /activities/:id` | อ่าน | รายละเอียด + จำนวนผู้ลงทะเบียนจริง |
| `POST /activities` | หัวหน้าห้อง | สร้างกิจกรรม |
| `PATCH /activities/:id` | เจ้าของ | แก้ข้อมูล (ส่งเฉพาะฟิลด์ที่แก้) |
| `PATCH /activities/:id/status` | เจ้าของ | เปลี่ยนสถานะ |
| `GET·POST /activities/:id/roles` | อ่าน · เจ้าของ | ตำแหน่งทีมงาน |
| `POST /activities/:id/roles/:roleId/applications` | ร่วมกิจกรรม | สมัครทีมงาน |
| `GET /activities/:id/applications` · `PATCH …/:applicationId` | เจ้าของ | ดู · รับ/ปฏิเสธผู้สมัคร |
| `POST /activities/:id/registrations` · `DELETE …/registrations/me` | ร่วมกิจกรรม | ลงทะเบียน · ยกเลิกของตัวเอง |
| `GET /activities/:id/participation` | อ่าน | สถานะของฉันในกิจกรรมนี้ |
| `GET·POST /activities/:id/evaluations` | เจ้าของ · ร่วมกิจกรรม | ผลประเมิน · ส่งแบบประเมิน |
| `GET /me/activities` · `/me/organized-activities` · `/me/activity-capabilities` | อ่าน | กิจกรรมของฉัน · รายชื่อผู้ลงทะเบียนในกิจกรรมที่ฉันจัด · ปุ่มที่ควรแสดง |

ข้อความ error ของกฎธุรกิจเป็นภาษาไทยเหมือน MIS เดิม (เช่น "ที่นั่งสำหรับกิจกรรมนี้เต็มแล้ว")

## ฐานข้อมูล

- ตาราง `activity_activities`, `activity_roles`, `activity_team_applications`, `activity_registrations`, `activity_evaluations`
  (snake_case ตาม DD-02) เก็บ `core_user_id` / `created_by` เป็นอ้างอิงภายนอกไปยัง Core Hub เท่านั้น — ไม่มีตาราง users
- migration เริ่มต้น `20260930000001_init` รวม CHECK constraint เดิมของ MIS (ที่นั่ง > 0 · เวลาสิ้นสุด > เริ่ม · โควตาทีม 1–999 · คะแนน 1–5)
- ทุกการแก้กิจกรรมล็อกแถวเดียวกัน (`SELECT … FOR UPDATE`) จึงไม่จองเกินที่นั่งแม้มีหลาย request/หลาย process
- migration ห้ามลบ ห้าม squash

ดูรายการสิ่งที่ต่างจาก MIS เดิม และข้อสมมติที่ตั้งเอง ใน [`REPORT.md`](REPORT.md)

# REPORT — csmju-department-activity-planner

การย้ายโปรเจกต์ MIS (Next.js + Prisma ในตัว) เข้าโครงสร้างมาตรฐาน CSMJU2030 (branch `feature/department-activity-planner/migrate-mis`)

## ผลรัน

```
./standards/scripts/run-all-checks.sh .   → 17 / 19 ผ่านในเครื่อง (อีก 2 ข้ออธิบายด้านล่าง)
  ❌ SEC-01 — เจอรหัสผ่านใน backend/.env ในเครื่อง (ไฟล์ gitignore ไม่เข้า commit/CI)
  ⚠ ARC-02/03 — สคริปต์ข้ามเพราะเครื่องไม่มี jq ผมเทียบ whitelist ด้วยสคริปต์ Node แทน: ไม่พบ violation
  ❌ GH-04 check-submodule-pointer.sh  — ตรวจ pointer ที่ "commit แล้ว" (ตอนนี้ HEAD ยังชี้ fea19d8/v1.0.0)
     pointer ที่ stage ไว้คือ bc8f2c9 = v1.5.2 ตรงกับ ci.yml → จะผ่านหลัง commit
pnpm --filter backend test        → 7 suites · 98 tests ผ่าน (auth 47 + activity 51)
pnpm --filter backend test:e2e    → 20 tests ผ่าน (SSO callback + สิทธิ์)
pnpm --filter frontend test       → 7 tests ผ่าน (Server Action boundary)
pnpm -r typecheck · pnpm -r lint · backend/frontend build → ผ่าน
```

**ยังไม่ได้รัน** (เครื่องนี้ไม่มี Docker/PostgreSQL และไม่มี Core Hub รัน):
- `pnpm --filter backend test:integration` (7 เคส: row lock, ที่นั่งเต็มพร้อมกัน, CHECK constraint จริง) — จะ skip เองถ้าไม่มี DATABASE_URL local
- `node standards/conformance/run.js` (L1–L3) และการ login ผ่าน Core Hub จริง
- ยังไม่ได้เปิดเว็บทดสอบ flow ทั้งหมดในเบราว์เซอร์

## ไฟล์ที่สร้าง/แก้ไข
- `backend/` — NestJS ใหม่: ชั้น auth/common คัดลอกจาก reference, `src/activities/` (controller · service · DTO) ย้ายตรรกะจาก `activity.repository.ts` + Server Actions ของ MIS
- `backend/prisma/` — schema เดิมของ MIS + migration `20260930000001_init` (สร้างจาก schema; เพิ่ม CHECK constraint เดิมด้วยมือ)
- `backend/test/`, `backend/src/**/*.spec.ts` — เทสต์ auth เดิม + เทสต์ activity ใหม่ + integration ต่อ PostgreSQL จริง
- `frontend/` — UI ของ MIS ทั้งหมด (หน้า · component · CSS) เปลี่ยนเฉพาะชั้นข้อมูล: `src/lib/api.ts`, `src/lib/session.ts`, `src/app/actions/activity.ts`, `SignedOut`, ปุ่มออกจากระบบ
- `docker-compose.yml`, `README.md`, `REPORT.md`, `pnpm-workspace.yaml` (เพิ่ม allowBuilds), `package.json` (เพิ่ม scripts), `.standards-version` = 1.5.2, `standards` → v1.5.2

**ไม่ได้แตะ** (กฎ GH-03): `.github/`, `subsystem.yaml`, `.gitmodules`, ไฟล์ใน `standards/`

## ชั้น auth ที่คัดลอกมา
- คัดลอกจาก demo-student-subsystem: `src/auth/**`, `src/common/**`, `src/config/**`, `src/health/`, `src/prisma/`, `src/core-hub/express-request.ts` (เฉพาะ type augmentation), `main.ts`, `Dockerfile`, jest/eslint/tsconfig
- แก้ไข: `permissions.ts` (สิทธิ์ของโดเมนนี้ตามที่มาตรฐานอนุญาต) และค่า default ชื่อระบบ/พอร์ตใน `configuration.ts`, `health.controller.ts`, `main.ts`, `env`, `Dockerfile`; เพิ่ม `activity.classHeadCoreUserIds` ใน configuration — ตรรกะตรวจ JWT/JWKS ไม่ถูกแก้
- ไม่ได้เอา `src/core-hub/*` (reference data ของห้อง), `rooms/`, `bookings/` มา

## Role mapping ที่ประกาศ (ตารางเดิมของ reference — ยังไม่ได้เทียบกับ default_role_mapping ในทะเบียน)
| core role | subsystem role |
|---|---|
| student | STUDENT |
| alumni · guest | ALUMNI |
| staff · lecturer | STAFF |
| admin | ADMIN |

## สิ่งที่ต่างจาก MIS เดิม (ต้องอ่าน)
1. **โหมดผู้ใช้ทดสอบชั่วคราว (แบบ MIS เดิม)** — ตั้ง `LOCAL_TEST_ROLE=HEAD|STUDENT` (backend) กับ `LOCAL_DEV_AUTH=true` (frontend) แล้วใช้งานได้โดยไม่มี Core Hub และไม่มีหน้า login เหมือน MIS เดิม ค่าเริ่มต้นเมื่อไม่ตั้ง = ตรวจ JWT ของ Core Hub ตามมาตรฐาน โหมดนี้คือ `LocalIdentityGuard` ใน `backend/src/dev/` **แยกจากชั้น auth ที่คัดลอกมา** (ไม่ได้แก้ไฟล์ใน `src/auth`) แต่ถือเป็นทางลัดยืนยันตัวตน: ปฏิเสธตอน production, ไม่รับ header/cookie/ฟอร์ม, log เตือนตอนสตาร์ท ต้องลบก่อนใช้จริง (ขั้นตอนใน README) ถ้าเปิดโหมดนี้ conformance จะไม่ผ่าน (ไม่มี 401)
2. **เมื่อใช้ Core Hub จริง** — ต้อง login ก่อนดูกิจกรรมได้ (MIS เดิมเปิดดูได้โดยไม่ login) และผู้ใช้มาจาก JWT
3. **หัวหน้าห้อง** — โหมดทดสอบ: `LOCAL_TEST_ROLE=HEAD` · โหมด Core Hub: JWT ไม่มีข้อมูลนี้ จึงกำหนดผ่าน `CLASS_HEAD_CORE_USER_IDS` (ต้องยืนยันกับ PM ว่าจะได้ข้อมูลนี้จากไหน)
4. **ชื่อที่แสดง** — token มีแค่ `sub`/`email`/`role` ไม่มีชื่อ "ผู้จัด" และชื่อผู้สมัครทีมงานจึงแสดงเป็นอีเมล (เดิมเป็น `displayName` ของผู้ใช้ทดสอบ)
5. **เปลี่ยนสถานะกิจกรรม** — MIS เดิมอนุญาตแค่ `OPEN/CLOSED/CANCELLED` ทั้งที่ dropdown มี `FULL/IN_PROGRESS/COMPLETED` (และ `CLOSED` ไม่มีใน enum ของ DB) ทำให้เลือก COMPLETED ไม่ได้และประเมินผลไม่เคยเปิดได้ ระบบใหม่รับสถานะเท่าที่ dropdown เสนอ (`OPEN/FULL/IN_PROGRESS/COMPLETED/CANCELLED`) ส่วน `DRAFT` ยังถูกปฏิเสธเหมือนเดิม
6. **แก้กิจกรรม** — โค้ดเดิมส่ง `startAt/endAt = null` ไปที่ Prisma ตอนแก้ ซึ่งน่าจะทำให้บันทึกไม่ผ่าน ระบบใหม่คงเวลาเดิมไว้ถ้าฟอร์มไม่ส่งเวลามา
7. **โค้ดเดิมไม่ตรงกันเอง** — `schema.prisma` ใช้ `coreUserId`/snake_case แต่ repository และ migration ของ MIS ใช้ `userId`/camelCase (typecheck ของ MIS ไม่น่าผ่าน) ระบบใหม่ใช้ schema ตามมาตรฐาน (`core_user_id`) และสร้าง migration ใหม่จาก schema ข้อมูลใน DB เดิมของ MIS ไม่ถูกย้าย (ตารางว่างตามบันทึกของ MIS)
8. **API ใช้ pagination** — รายการกิจกรรมจำกัด 100 ต่อหน้า (frontend ดึงครบทุกหน้าให้)
9. `POST /activities` ตรวจ `endAt > startAt` และเวลาต้องมี timezone; field แปลกปลอมใน body ถูกปฏิเสธ (400) แทนที่จะถูกเมิน

ทุกกฎธุรกิจอื่น (ล็อกแถวกันจองเกิน, ที่นั่งเต็ม/เปิดใหม่อัตโนมัติ, โควตาทีม, ตัดสินผู้สมัครได้ครั้งเดียว, ประเมินได้เมื่อ COMPLETED และต้องลงทะเบียน, ข้อความ error ภาษาไทย, CHECK constraint ใน DB) ย้ายมาตรงตัว

## ข้อสมมติที่ตั้งเอง (เพราะมาตรฐานไม่ได้ระบุ)
1. พอร์ต: frontend 3002 (ตรงกับ `base_url` ใน scaffold), backend 4202
2. สิทธิ์: ทุก role ที่ map ได้ ยกเว้น alumni ร่วมกิจกรรมได้ (เดิมทุกคนที่ login ร่วมได้); เจ้าของกิจกรรมตรวจที่ service (`created_by = sub`)
3. `GET …/applications`, `…/evaluations` จำกัดเฉพาะเจ้าของที่ API (เดิมจำกัดที่หน้าเว็บ)
4. Prisma pin 7.9.1 ตามมาตรฐาน (MIS ใช้ 7.10.0)

## สิ่งที่ยังทำไม่ได้ / เคสที่ยังไม่ผ่าน
- `subsystem.yaml` ยังเป็น placeholder (`probes` ชี้ `/api/v1/<resources>`, `standards_version` เก่า) — DevOps/PM เป็นเจ้าของ (GH-03) ต้องแจ้งให้ตั้ง `probes` เป็น `/api/v1/activities` ก่อนรัน conformance
- ยังไม่ได้ลงทะเบียนระบบใน Core Hub และยังไม่ได้รัน conformance
- `backend/openapi.json` สร้างแล้ว (17 เส้นทาง ผ่าน `pnpm --filter backend generate:openapi` ไม่ต้องใช้ DB/Core Hub และได้ไฟล์เดิมทุกครั้ง) แต่ schema ของ response ยังไม่ได้ระบุ (เห็นเฉพาะ request/params) และ frontend ยังเขียน type ของ API เอง (TODO(API-01) เหมือน reference) ยังไม่ได้ generate ด้วย openapi-typescript — ไฟล์นี้ CODEOWNERS ให้ PM ร่วม approve
- UI ยังใช้ Tailwind ตรงๆ และมี emoji/`<img>` เหมือน MIS ยังไม่ผ่าน `@csmju2030/design-system` (ไม่ได้ตรวจในรอบนี้)
- ยังไม่มี seed ข้อมูลตัวอย่าง (MIS เดิมก็ไม่มี)

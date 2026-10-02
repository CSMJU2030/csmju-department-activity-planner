# สถานะการเตรียมเชื่อม Core Hub

ปรับโค้ดตามมาตรฐานที่ตรึงใน repository: standards 1.7.0 / authentication contract 1.2
เอกสารนี้อธิบายโค้ดระบบย่อย ไม่ใช่การประกาศว่าทะเบียนหรือสิทธิ์ใน Core อนุมัติแล้ว

## การเข้าสู่ระบบ

- หน้าเว็บเริ่มที่ `GET /auth/login?next=<path>` สร้าง nonce สุ่ม 32 ไบต์ เก็บ state cookie 600 วินาที
- ส่ง browser ไป Core Web `/sso/authorize?subsystem=csmju-department-activity-planner&state=...`
- Callback ตรวจ state แบบ constant-time และล้าง state ก่อนตรวจ JWT; callback ไม่มี state ทิ้ง token แล้วเริ่ม flow ใหม่
- JWT ตรวจ RS256, kid/JWKS, signature, issuer, audience, exp, sub, iat, อายุไม่เกิน 900 วินาทีบวก clock tolerance และ azp เมื่อมี
- Cookie `csmju_department_activity_planner_access_token` เป็น HttpOnly / Lax / Path=/ และ Secure ใน production
- `/api/v1/me` ส่งเฉพาะข้อมูลผู้ใช้กับ `session.expiresAt`; ไม่ส่ง token ให้ JavaScript
- API ที่ไม่มี session ตอบ JSON 401; frontend ต่ออายุผ่าน top-level navigation มีตัวกันวน 30 วินาที และหยุดถ้ามีฟอร์มแก้ค้าง
- `POST /auth/logout` ล้าง cookie ของระบบย่อยและส่งไปหน้ายืนยัน logout ของ Core
- ไม่มีผู้ใช้จำลองใน runtime; test double และกุญแจที่สร้างในชุดทดสอบใช้เฉพาะการทดสอบ

## ค่าที่ต้องตกลงกับ PL / PM / Core

| รายการ | ค่าปัจจุบัน / สิ่งที่ต้องยืนยัน |
|---|---|
| ชื่อในทะเบียน | `csmju-department-activity-planner` ต้องตรงกับ SUBSYSTEM_ID ทั้ง frontend/backend |
| Core API / Web | `https://csmju2030.jowave.com` ตามเอกสาร standards |
| callback ในเครื่อง | `http://localhost:3002/auth/callback` ต้องได้รับอนุญาตสำหรับทดสอบ HTTP |
| พอร์ต frontend | ขอพอร์ต 32xx ที่ทีมจัดสรร; ยังไม่เดาพอร์ตใหม่แทน 3002 |
| callback deployment | URL HTTPS ของ frontend ที่ทีมจัดให้ + `/auth/callback` |
| อนุมัติ | ทะเบียนต้อง APPROVED / ACTIVE และมี role mapping ที่ทีมยืนยัน |
| role mapping ของโค้ด | student→STUDENT, alumni/guest→ALUMNI, staff/lecturer→STAFF, admin→ADMIN |
| หัวหน้าห้อง | Core admin แต่งตั้ง Core user `sub` จริงที่หน้า `/admin/heads`; สิทธิ์ใน activity_heads และต้องมี role student ด้วย |
| แหล่งตำแหน่งระยะยาว | PM ยืนยัน API/สัญญาก่อนแทนรายการค่าตั้งปัจจุบัน |
| Manifest / conformance | `subsystem.yaml` เดิมยังมี placeholder และ standards_version เก่า ให้ DevOps/PM ตรวจและอนุมัติค่า endpoint/owners/roles |

ระบบเก็บข้อมูลกิจกรรมใน PostgreSQL ของตนเอง ไม่มีการเข้าถึงฐานข้อมูล Core โดยตรง
ข้อมูล demo ที่เคยใส่ยังอยู่ แต่ owner `local-head-001` ไม่ใช่บัญชี Core จริง จึงไม่ควรใช้ยืนยันสิทธิ์ผู้จัดหรือย้ายสิทธิ์ให้ผู้ใช้จริงโดยอัตโนมัติ

## ตรวจเชื่อมต่อจริงหลังทีมพร้อม

1. ตั้ง env จากตัวอย่าง โดยคง DATABASE_URL ของระบบย่อย; อย่าเผยแพร่ `.env`, รหัสผ่าน, token หรือ URL callback ที่มี token
2. รีสตาร์ท backend และ frontend แล้วเปิด frontend ด้วย hostname ที่ตรงกับ callback ในทะเบียน
3. ลงชื่อเข้าใช้จากเว็บระบบย่อยด้วยบัญชี Core จริง → กลับหน้าเดิม; ตรวจ `/api/v1/me` ได้ id จาก Core
4. ใช้ Core admin แต่งตั้ง Head จากหน้า `/admin/heads` แล้วทดสอบนักศึกษาทั่วไปสร้างไม่ได้, นักศึกษาที่แต่งตั้งสร้างได้, ผู้ใช้อื่นแก้กิจกรรมของคนอื่นไม่ได้
5. ทดลอง session หมดเวลาและ logout; หาก callback state หมดเวลาให้ใช้ปุ่มเข้าสู่ระบบอีกครั้ง
6. หลัง PM ปรับ manifest ให้รัน conformance กับ Core จริง และบันทึกผลก่อนประกาศพร้อมใช้งาน

ชุดทดสอบอัตโนมัติในเครื่องใช้ FakeCoreHub / in-memory Prisma เพื่อทดสอบสัญญาและสิทธิ์อย่างแยกจากข้อมูลจริง ไม่ใช่ผลรับรองเชื่อม Core production

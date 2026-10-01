/**
 * LOCAL DEVELOPMENT ONLY - a stand-in for CSMJU Core Hub so this subsystem can
 * be run and clicked through on a laptop before the real Core Hub is available.
 *
 * It does what Core Hub does for a subsystem and nothing more:
 *   - serves a JWKS document (public key only) at :3000/api/v1/.well-known/jwks.json
 *   - serves a tiny "who are you?" page at :3100/api/sso/<subsystem> and then
 *     redirects the browser to <subsystem>/auth/callback with an RS256 token
 *
 * The subsystem code is unchanged: it downloads this JWKS, selects the key by
 * `kid` and verifies the signature exactly as it would for the real Core Hub.
 * The signing key is generated in memory on every start and is never written
 * anywhere, so restarting this script signs everybody out.
 *
 *   pnpm --filter backend dev:core-hub
 */
import { createServer } from 'http';
import { createSigningKey, jwksDocument, signCoreHubToken } from '../helpers/token-factory';

const API_PORT = Number(process.env.DEV_CORE_HUB_API_PORT ?? 3000);
const WEB_PORT = Number(process.env.DEV_CORE_HUB_WEB_PORT ?? 3100);
const CALLBACK_URL = process.env.DEV_CALLBACK_URL ?? 'http://localhost:3002/auth/callback';
const TOKEN_TTL_SEC = 8 * 60 * 60;

/** Fixed ids so CLASS_HEAD_CORE_USER_IDS in backend/.env can name the class head. */
const USERS = {
  head: {
    label: 'หัวหน้าห้อง (นักศึกษา · สร้างกิจกรรมได้)',
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'head@dev.local',
    role: 'student',
  },
  student: {
    label: 'นักศึกษาทั่วไป',
    sub: '00000000-0000-4000-8000-000000000002',
    email: 'student@dev.local',
    role: 'student',
  },
  student2: {
    label: 'นักศึกษาอีกคน (ไว้ทดสอบที่นั่งเต็ม)',
    sub: '00000000-0000-4000-8000-000000000004',
    email: 'student2@dev.local',
    role: 'student',
  },
  staff: {
    label: 'อาจารย์ / เจ้าหน้าที่',
    sub: '00000000-0000-4000-8000-000000000003',
    email: 'staff@dev.local',
    role: 'lecturer',
  },
} as const;

type UserKey = keyof typeof USERS;

async function main(): Promise<void> {
  const key = await createSigningKey('dev-core-hub');

  createServer((req, res) => {
    if (req.url?.startsWith('/api/v1/.well-known/jwks.json')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(jwksDocument([key])));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  }).listen(API_PORT, '127.0.0.1');

  createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${WEB_PORT}`);

      if (url.pathname.startsWith('/api/sso/')) {
        const links = (Object.keys(USERS) as UserKey[])
          .map((id) => `<li><a href="/pick?user=${id}">${USERS[id].label}</a> <small>${USERS[id].email}</small></li>`)
          .join('');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(
          `<!doctype html><meta charset="utf-8"><title>Dev Core Hub</title>` +
            `<body style="font-family:sans-serif;max-width:32rem;margin:3rem auto;line-height:1.7">` +
            `<h1>Dev Core Hub</h1><p>ตัวจำลองสำหรับรันในเครื่องเท่านั้น เลือกผู้ใช้ทดสอบ:</p><ul>${links}</ul>`,
        );
        return;
      }

      if (url.pathname === '/pick') {
        const user = USERS[(url.searchParams.get('user') ?? '') as UserKey];
        if (!user) {
          res.writeHead(400, { 'content-type': 'text/plain' });
          res.end('unknown user');
          return;
        }
        const token = await signCoreHubToken(key, {
          sub: user.sub,
          email: user.email,
          role: user.role,
          sid: `dev-${user.sub}`,
          issuer: process.env.CORE_HUB_ISSUER ?? 'core-hub',
          audience: process.env.CORE_HUB_AUDIENCE ?? 'csmju2030',
          expiresInSec: TOKEN_TTL_SEC,
        });
        res.writeHead(302, {
          location: `${CALLBACK_URL}?${new URLSearchParams({ access_token: token, token_type: 'Bearer' })}`,
        });
        res.end();
        return;
      }

      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
    })();
  }).listen(WEB_PORT, '127.0.0.1');

  console.log(`Dev Core Hub (NOT the real one)`);
  console.log(`  JWKS  http://localhost:${API_PORT}/api/v1/.well-known/jwks.json`);
  console.log(`  Login http://127.0.0.1:${WEB_PORT}/api/sso/csmju-department-activity-planner`);
  console.log(`  Class head id for backend/.env: CLASS_HEAD_CORE_USER_IDS=${USERS.head.sub}`);
}

void main();

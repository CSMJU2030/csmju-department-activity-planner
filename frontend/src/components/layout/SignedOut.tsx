import { ssoUrl } from "@/lib/session";

/**
 * Shown instead of a page when there is no Core Hub session. The subsystem has
 * no sign-in form of its own (SEC-05): the button sends the browser to Core
 * Hub's SSO launcher, which signs the user in if needed and redirects back to
 * /auth/callback here with a Core Hub token.
 */
export function SignedOut() {
  return (
    <main className="dashboard-shell">
      <div className="empty-panel">
        <h1>กรุณาเข้าสู่ระบบผ่าน CSMJU2030</h1>
        <p>ระบบนี้ใช้บัญชีเดียวกับ CSMJU Core Hub ไม่มีหน้า login ของตัวเอง</p>
        <a className="primary-link" href={ssoUrl}>
          เข้าสู่ระบบผ่าน CSMJU Core Hub
        </a>
      </div>
    </main>
  );
}

import { timingSafeEqual } from 'node:crypto';

export const sessionCookieName = (id: string): string => `${id.replace(/-/g, '_')}_access_token`;
export const stateCookieName = (id: string): string => `${id.replace(/-/g, '_')}_sso_state`;

export function readCookie(header: string | undefined, name: string): string | null {
  for (const part of (header ?? '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try { return decodeURIComponent(part.slice(separator + 1).trim()) || null; }
    catch { return null; }
  }
  return null;
}

export function buildCookie(name: string, value: string, path: string, maxAgeSec: number, secure: boolean): string {
  return [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, 'HttpOnly', 'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`, ...(secure ? ['Secure'] : [])].join('; ');
}

/** The origin is a fixed sentinel: only relative local paths are accepted. */
export function safeNext(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 512 ||
      !value.startsWith('/') || value.startsWith('//') || value.includes('\\') ||
      [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return '/';
  try {
    const url = new URL(value, 'https://subsystem.invalid');
    if (url.origin !== 'https://subsystem.invalid' || url.pathname === '/auth' || url.pathname.startsWith('/auth/')) return '/';
    return url.pathname + url.search + url.hash;
  } catch { return '/'; }
}

export function matchingState(actual: string, expected: string): boolean {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

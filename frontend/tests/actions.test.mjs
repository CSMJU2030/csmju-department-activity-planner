import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Test the real Server Action boundary: input validation and what is forwarded
// to the backend. Business rules and the database are covered in the backend.
function setup(response = { ok: true, data: { id: 'saved' } }) {
  const calls = [], invalidated = [];
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/app/actions/activity.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, console, Date, URLSearchParams,
    require(name) {
      if (name === 'next/cache') return { revalidatePath: path => invalidated.push(path) };
      if (name === '@/lib/api') return { call: async (path, init) => { calls.push({ path, ...init }); return state.response; } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const state = { response };
  return { calls, invalidated, state, ...exports };
}

// Objects built inside the vm context have a different prototype; compare them as plain JSON.
const plain = value => JSON.parse(JSON.stringify(value));

function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    title: ' Workshop ',
    description: ' เรียนรู้ร่วมกัน ',
    category: 'workshop',
    location: ' CS201 ',
    maxParticipants: '30',
    startAt: '2026-10-10T09:00',
    endAt: '2026-10-10T12:00',
    ...overrides
  })) {
    data.set(key, value);
  }
  return data;
}

test('creation converts the Thai local schedule to UTC and forwards clean values', async () => {
  const s = setup();
  const result = await s.createActivityAction(form({ createdBy: 'attacker' }));
  assert.equal(result.success, true);
  assert.equal(result.activityId, 'saved');
  const [call] = s.calls;
  assert.equal(call.path, '/api/v1/activities');
  assert.equal(call.method, 'POST');
  assert.equal(call.body.title, 'Workshop');
  assert.equal(call.body.startAt, '2026-10-10T02:00:00.000Z');
  assert.equal(call.body.endAt, '2026-10-10T05:00:00.000Z');
  assert.equal('createdBy' in call.body, false);
  assert.ok(s.invalidated.includes('/my-activities'));
});

test('invalid create and edit inputs never reach the backend', async () => {
  const s = setup();
  for (const input of [
    { title: ' ' },
    { title: new Blob(['file']) },
    { title: 'x'.repeat(151) },
    { description: 'x'.repeat(5001) },
    { category: 'invalid' },
    { location: 'x'.repeat(201) },
    ...['0', '-1', '1.5', 'Infinity', '2147483648'].map(maxParticipants => ({ maxParticipants }))
  ]) {
    assert.equal((await s.createActivityAction(form(input))).success, false);
    assert.equal((await s.updateActivityAction(form({ activityId: 'a', ...input }))).success, false);
  }
  for (const input of [{ startAt: '2026-02-30T09:00' }, { endAt: '2026-10-10T08:00' }, { endAt: '2026-10-10T09:00' }, { startAt: '' }]) {
    assert.equal((await s.createActivityAction(form(input))).success, false);
  }
  assert.equal(s.calls.length, 0);
});

test('editing sends no schedule when the form has none, so the stored times stay', async () => {
  const s = setup();
  const data = form({ activityId: 'a' });
  data.delete('startAt');
  data.delete('endAt');
  assert.equal((await s.updateActivityAction(data)).success, true);
  const [call] = s.calls;
  assert.equal(call.method, 'PATCH');
  assert.equal(call.path, '/api/v1/activities/a');
  assert.equal('startAt' in call.body, false);
  assert.equal('endAt' in call.body, false);
});

test('a backend refusal reaches the form in the backend wording; a lost session reads Unauthorized', async () => {
  const s = setup({ ok: false, status: 409, message: 'ที่นั่งสำหรับกิจกรรมนี้เต็มแล้ว' });
  assert.deepEqual(plain(await s.registerActivityAction('a')), { success: false, error: 'ที่นั่งสำหรับกิจกรรมนี้เต็มแล้ว' });
  s.state.response = { ok: false, status: 401, message: 'ยังไม่ได้เข้าสู่ระบบ' };
  assert.deepEqual(plain(await s.registerActivityAction('a')), { success: false, error: 'Unauthorized' });
  assert.equal(s.invalidated.length, 0);
});

test('registration, cancellation and team application use the expected endpoints', async () => {
  const s = setup();
  await s.registerActivityAction('a');
  await s.cancelRegistrationAction('a');
  await s.applyTeamRoleAction('a', 'r');
  assert.deepEqual(s.calls.map(c => `${c.method} ${c.path}`), [
    'POST /api/v1/activities/a/registrations',
    'DELETE /api/v1/activities/a/registrations/me',
    'POST /api/v1/activities/a/roles/r/applications',
  ]);
});

test('invalid statuses and team role capacities are rejected before the backend', async () => {
  const s = setup();
  for (const status of ['DRAFT', 'invalid', null]) {
    assert.equal((await s.updateActivityStatusAction('a', status)).success, false);
  }
  assert.equal((await s.respondTeamApplicationAction('a', 'app', 'PENDING')).success, false);
  for (const input of [{ roleName: '' }, { roleName: 'x'.repeat(101) }, { roleDescription: 'x'.repeat(501) }, { maxMembers: '0' }, { maxMembers: '1.5' }, { maxMembers: '1000' }]) {
    assert.equal((await s.createActivityRoleAction('a', form({ roleName: 'Staff', maxMembers: '2', ...input }))).success, false);
  }
  assert.equal(s.calls.length, 0);
  for (const status of ['OPEN', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) {
    assert.equal((await s.updateActivityStatusAction('a', status)).success, true);
  }
  assert.equal(s.calls.length, 5);
});

test('evaluation validates scores and text, and forwards normalized feedback', async () => {
  const s = setup();
  const evaluation = overrides => form({ activityId: 'a', rating: '5', liked: ' ได้ฝึกจริง ', improvement: ' เพิ่มเวลา ', ...overrides });
  for (const rating of ['', '0', '6', '1.5', 'NaN', '1e0', new Blob(['file'])]) {
    assert.equal((await s.submitEvaluationAction(evaluation({ rating }))).success, false);
  }
  for (const key of ['liked', 'improvement']) {
    for (const value of [' ', 'x'.repeat(2001), new Blob(['file'])]) {
      assert.equal((await s.submitEvaluationAction(evaluation({ [key]: value }))).success, false);
    }
  }
  assert.equal(s.calls.length, 0);
  assert.equal((await s.submitEvaluationAction(evaluation({ userId: 'attacker' }))).success, true);
  assert.deepEqual(plain(s.calls[0].body), { rating: 5, liked: 'ได้ฝึกจริง', improvement: 'เพิ่มเวลา' });
});

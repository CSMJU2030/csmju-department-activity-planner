import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateActivityRoleDto } from './dto/create-activity-role.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { RespondApplicationDto } from './dto/respond-application.dto';
import { UpdateActivityStatusDto } from './dto/update-activity-status.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

/** Same pipeline options as main.ts, so a DTO that passes here passes over HTTP. */
async function accepts<T extends object>(
  type: new () => T,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; value: T }> {
  const value = plainToInstance(type, body);
  const errors = await validate(value, { whitelist: true, forbidNonWhitelisted: true });
  return { ok: errors.length === 0, value };
}

const activity = (overrides: Record<string, unknown> = {}) => ({
  title: ' Workshop ',
  description: ' เรียนรู้ร่วมกัน ',
  category: ' Workshop ',
  location: ' CS201 ',
  maxParticipants: 30,
  startAt: '2026-10-10T09:00:00+07:00',
  endAt: '2026-10-10T12:00:00+07:00',
  ...overrides,
});

describe('CreateActivityDto', () => {
  it('accepts a valid activity and normalises the text fields', async () => {
    const { ok, value } = await accepts(CreateActivityDto, activity());
    expect(ok).toBe(true);
    expect(value.title).toBe('Workshop');
    expect(value.description).toBe('เรียนรู้ร่วมกัน');
    expect(value.category).toBe('workshop');
    expect(value.location).toBe('CS201');
  });

  it.each([
    ['blank title', { title: ' ' }],
    ['title over 150 characters', { title: 'x'.repeat(151) }],
    ['description over 5000 characters', { description: 'x'.repeat(5001) }],
    ['unknown category', { category: 'invalid' }],
    ['location over 200 characters', { location: 'x'.repeat(201) }],
    ['zero seats', { maxParticipants: 0 }],
    ['negative seats', { maxParticipants: -1 }],
    ['fractional seats', { maxParticipants: 1.5 }],
    ['seats above the 32-bit limit', { maxParticipants: 2147483648 }],
    ['seats sent as a string', { maxParticipants: '30' }],
    ['impossible date', { startAt: '2026-02-30T09:00:00+07:00' }],
    ['date without a timezone offset', { startAt: '2026-10-10T09:00' }],
    ['title that is not text', { title: 42 }],
    ['smuggled createdBy', { createdBy: 'attacker' }],
  ])('rejects %s', async (_name, overrides) => {
    expect((await accepts(CreateActivityDto, activity(overrides))).ok).toBe(false);
  });
});

describe('UpdateActivityDto', () => {
  it('accepts a partial update and rejects out-of-range values', async () => {
    expect((await accepts(UpdateActivityDto, { title: 'New title' })).ok).toBe(true);
    expect((await accepts(UpdateActivityDto, {})).ok).toBe(true);
    expect((await accepts(UpdateActivityDto, { maxParticipants: 0 })).ok).toBe(false);
    expect((await accepts(UpdateActivityDto, { category: 'invalid' })).ok).toBe(false);
    expect((await accepts(UpdateActivityDto, { status: 'COMPLETED' })).ok).toBe(false);
  });
});

describe('UpdateActivityStatusDto', () => {
  it.each(['OPEN', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])('accepts %s', async (status) => {
    expect((await accepts(UpdateActivityStatusDto, { status })).ok).toBe(true);
  });

  it.each(['DRAFT', 'invalid', null])('rejects %s', async (status) => {
    expect((await accepts(UpdateActivityStatusDto, { status })).ok).toBe(false);
  });
});

describe('RespondApplicationDto', () => {
  it('only accepts ACCEPTED or REJECTED', async () => {
    expect((await accepts(RespondApplicationDto, { status: 'ACCEPTED' })).ok).toBe(true);
    expect((await accepts(RespondApplicationDto, { status: 'REJECTED' })).ok).toBe(true);
    expect((await accepts(RespondApplicationDto, { status: 'PENDING' })).ok).toBe(false);
  });
});

describe('CreateActivityRoleDto', () => {
  const role = (overrides: Record<string, unknown> = {}) => ({
    roleName: 'Staff',
    maxMembers: 2,
    ...overrides,
  });

  it('accepts a valid role', async () => {
    expect((await accepts(CreateActivityRoleDto, role())).ok).toBe(true);
  });

  it.each([
    { roleName: '' },
    { roleName: 'x'.repeat(101) },
    { description: 'x'.repeat(501) },
    { maxMembers: 0 },
    { maxMembers: 1.5 },
    { maxMembers: 101 },
  ])('rejects %j', async (overrides) => {
    expect((await accepts(CreateActivityRoleDto, role(overrides))).ok).toBe(false);
  });
});

describe('CreateEvaluationDto', () => {
  const evaluation = (overrides: Record<string, unknown> = {}) => ({
    rating: 5,
    liked: ' ได้ฝึกจริง ',
    improvement: ' เพิ่มเวลา ',
    ...overrides,
  });

  it('accepts valid feedback and trims the text', async () => {
    const { ok, value } = await accepts(CreateEvaluationDto, evaluation());
    expect(ok).toBe(true);
    expect(value.liked).toBe('ได้ฝึกจริง');
    expect(value.improvement).toBe('เพิ่มเวลา');
  });

  it.each([
    { rating: 0 },
    { rating: 6 },
    { rating: 1.5 },
    { rating: '5' },
    { liked: ' ' },
    { liked: 'x'.repeat(2001) },
    { improvement: ' ' },
    { improvement: 'x'.repeat(2001) },
    { coreUserId: 'attacker' },
  ])('rejects %j', async (overrides) => {
    expect((await accepts(CreateEvaluationDto, evaluation(overrides))).ok).toBe(false);
  });
});

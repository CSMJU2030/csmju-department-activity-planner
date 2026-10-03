import { SubsystemRole } from './core-hub-identity';
import { mapCoreRoleToSubsystemRole, mapVerifiedIdentityToSubsystemRole } from './role-mapping';

describe('Core role -> subsystem role mapping (spec §14)', () => {
  it('grants local ADMIN only to the configured verified identity', () => {
    expect(mapVerifiedIdentityToSubsystemRole('staff', 'selected', ['selected'])).toBe(SubsystemRole.ADMIN);
    expect(mapVerifiedIdentityToSubsystemRole('staff', 'other', ['selected'])).toBe(SubsystemRole.STAFF);
    expect(mapVerifiedIdentityToSubsystemRole('staff', 'selected', [])).toBe(SubsystemRole.STAFF);
    expect(mapVerifiedIdentityToSubsystemRole(undefined, 'selected', ['selected'])).toBeNull();
    expect(mapVerifiedIdentityToSubsystemRole('unknown', 'selected', ['selected'])).toBeNull();
  });
  it.each([
    ['student', SubsystemRole.STUDENT],
    ['alumni', SubsystemRole.ALUMNI],
    ['staff', SubsystemRole.STAFF],
    ['lecturer', SubsystemRole.STAFF],
    ['guest', SubsystemRole.ALUMNI],
    ['admin', SubsystemRole.ADMIN],
  ])('maps core role "%s" to %s', (coreRole, expected) => {
    expect(mapCoreRoleToSubsystemRole(coreRole)).toBe(expected);
  });

  it('is case and whitespace tolerant', () => {
    expect(mapCoreRoleToSubsystemRole('  STAFF ')).toBe(SubsystemRole.STAFF);
  });

  it('returns null for a Core Hub role this subsystem does not know', () => {
    expect(mapCoreRoleToSubsystemRole('finance-officer')).toBeNull();
  });

  it('returns null when the token carries no role claim', () => {
    expect(mapCoreRoleToSubsystemRole(undefined)).toBeNull();
  });
});

import { SubsystemRole } from './core-hub-identity';
import { Permission, ROLE_PERMISSIONS, can, canAny } from './permissions';

describe('Subsystem permission model (spec §15, §16)', () => {
  describe('STUDENT', () => {
    const role = SubsystemRole.STUDENT;

    it('can browse, take part, create and manage its own activities', () => {
      expect(can(role, Permission.ACTIVITY_READ)).toBe(true);
      expect(can(role, Permission.ACTIVITY_PARTICIPATE)).toBe(true);
      expect(can(role, Permission.ACTIVITY_CREATE)).toBe(true);
      expect(can(role, Permission.ACTIVITY_MANAGE_OWN)).toBe(true);
    });
  });

  describe('ALUMNI', () => {
    it('can only look at activities', () => {
      const role = SubsystemRole.ALUMNI;
      expect(can(role, Permission.ACTIVITY_READ)).toBe(true);
      expect(can(role, Permission.ACTIVITY_PARTICIPATE)).toBe(false);
      expect(can(role, Permission.ACTIVITY_CREATE)).toBe(false);
    });
  });

  describe('STAFF', () => {
    it('browses and takes part but does not organise', () => {
      const role = SubsystemRole.STAFF;
      expect(can(role, Permission.ACTIVITY_READ)).toBe(true);
      expect(can(role, Permission.ACTIVITY_PARTICIPATE)).toBe(true);
      expect(can(role, Permission.ACTIVITY_CREATE)).toBe(false);
      expect(can(role, Permission.ACTIVITY_MANAGE_OWN)).toBe(false);
    });
  });

  describe('ADMIN', () => {
    it('holds every permission', () => {
      for (const permission of Object.values(Permission)) {
        expect(can(SubsystemRole.ADMIN, permission)).toBe(true);
      }
    });
  });

  it('canAny passes when at least one permission matches', () => {
    expect(
      canAny(SubsystemRole.STAFF, [Permission.ACTIVITY_CREATE, Permission.ACTIVITY_READ]),
    ).toBe(true);
    expect(
      canAny(SubsystemRole.ALUMNI, [Permission.ACTIVITY_CREATE, Permission.ACTIVITY_PARTICIPATE]),
    ).toBe(false);
  });

  it('defines permissions for every subsystem role', () => {
    for (const role of Object.values(SubsystemRole)) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });
});

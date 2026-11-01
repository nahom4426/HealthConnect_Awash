import { describe, it, expect, beforeEach } from 'vitest';
import {
  emptyNotificationForm, validateNotificationForm, notificationWarnings, toClaimPayload,
  saveNotificationFormLocally, loadNotificationForm, normalizeNotificationForm, formatFormDate,
} from '../notificationForm';

function filledForm() {
  const f = emptyNotificationForm();
  f.policyHolder.fullName = 'Abebe Kebede';
  f.policyHolder.phone = '0911000000';
  f.vehicle.policyNo = 'SIC-MOT-001';
  f.vehicle.plateNo = 'AA 3-12345';
  f.driver.fullName = 'Kebede Alemu';
  f.driver.licenceNo = 'DL-778';
  f.accident.date = '2026-10-30';
  f.accident.time = '14:20';
  f.accident.place = 'Bole, near Edna Mall';
  f.accident.description = 'Rear-ended at a red light.';
  return f;
}

describe('motor notification form', () => {
  beforeEach(() => localStorage.clear());

  it('needs the core fields before submitting', () => {
    const errors = validateNotificationForm(emptyNotificationForm());
    expect(Object.keys(errors)).toEqual(expect.arrayContaining([
      'policyHolder.fullName', 'vehicle.policyNo', 'vehicle.plateNo', 'driver.fullName', 'accident.date', 'accident.description',
    ]));
    expect(validateNotificationForm(filledForm())).toEqual({});
  });

  it('asks for the VAT number only when VAT registered', () => {
    const f = filledForm();
    f.policyHolder.vatRegistered = false;
    expect(validateNotificationForm(f)['policyHolder.vatNumber']).toBeUndefined();
    f.policyHolder.vatRegistered = true;
    expect(validateNotificationForm(f)['policyHolder.vatNumber']).toBeDefined();
  });

  it('warns, without blocking, when the licence expired before the accident', () => {
    const f = filledForm();
    f.driver.licenceExpiryDate = '2026-01-01';
    expect(notificationWarnings(f)).toHaveLength(1);
    expect(validateNotificationForm(f)).toEqual({});
  });

  it('maps onto the existing claim API fields and keeps the whole form', () => {
    const f = filledForm();
    f.accident.speed = 'about 40 km/h';
    f.driver.reasonForDriving = 'EMPLOYED';
    const payload = toClaimPayload(f, { coverageType: 'OWN_DAMAGE', causeOfLoss: 'COLLISION', estimatedAmount: '45000', reportedChannel: 'PHONE', reportedAt: '2026-10-30T15:00:00Z' });
    expect(payload).toMatchObject({
      policyNumber: 'SIC-MOT-001', productModule: 'motor', incidentDate: '2026-10-30T14:20:00', incidentTime: '14:20',
      incidentLocation: 'Bole, near Edna Mall', licenseNumber: 'DL-778', estimatedAmount: 45000,
      plateNumber: 'AA 3-12345', driverName: 'Kebede Alemu', driverLicenseNumber: 'DL-778',
      driverRelationship: 'EMPLOYED', vehicleSpeed: 40,
      submittedVia: 'STAFF', reportedChannel: 'PHONE', reportedAt: '2026-10-30T15:00:00Z',
    });
    expect(payload.thirdPartyName).toBeUndefined();
    expect(payload.notificationForm).toBe(f);
  });

  it('prints the backend copy first, then this browser\'s copy, then the basic claim fields', () => {
    const f = filledForm();
    expect(loadNotificationForm({ claimUuid: 'u1', notificationForm: f }).source).toBe('claim');

    saveNotificationFormLocally({ claimUuid: 'u2', claimNumber: 'CLM-2' }, f);
    const local = loadNotificationForm({ claimUuid: 'u2' });
    expect(local.source).toBe('local');
    expect(local.form.driver.fullName).toBe('Kebede Alemu');

    const partial = loadNotificationForm({ claimUuid: 'u3', policyNumber: 'P-9', description: 'Hit a pole' });
    expect(partial.source).toBe('partial');
    expect(partial.form.vehicle.policyNo).toBe('P-9');
    expect(partial.form.accident.description).toBe('Hit a pole');
  });

  it('fills older saved forms with new fields', () => {
    const form = normalizeNotificationForm({ policyHolder: { fullName: 'X' }, injuries: [{ name: 'Y' }] });
    expect(form.policyHolder.fullName).toBe('X');
    expect(form.accident.otherParty.plateNo).toBe('');
    expect(form.injuries[0]).toEqual({ name: 'Y', address: '', identity: '' });
  });

  it('writes dates the way the paper form does', () => {
    expect(formatFormDate('2026-10-30')).toBe('30/10/2026');
    expect(formatFormDate('')).toBe('');
  });

  it('gives forms saved before the declaration an empty declaration, and keeps a filled one', () => {
    expect(normalizeNotificationForm({ policyHolder: { fullName: 'Abebe' } }).declaration)
      .toEqual({ date: '', insuredName: '', driverName: '', witness1: '', witness2: '' });
    const filled = normalizeNotificationForm({ declaration: { date: '2026-11-01', insuredName: 'Abebe', witness1: 'Selam' } });
    expect(filled.declaration).toMatchObject({ date: '2026-11-01', insuredName: 'Abebe', driverName: '', witness1: 'Selam' });
  });
});

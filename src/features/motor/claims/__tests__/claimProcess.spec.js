import { describe, it, expect, beforeEach } from 'vitest';
import {
  emptyProcess, documentChecklist, missingDocuments, currentStage, stageGate, waitingOn, stageSteps,
  loadProcess, saveProcess, netSettlement, closedOutcome, daysOpen, processFor,
} from '../claimProcess';

const upload = (documentType) => ({ documentUuid: documentType, documentType });

describe('motor claim process', () => {
  beforeEach(() => localStorage.clear());

  it('maps backend statuses onto the seven stages', () => {
    const p = emptyProcess();
    expect(currentStage({ status: 'SUBMITTED' }, p)).toBe(2);
    expect(currentStage({ status: 'IN_PROCESS' }, p)).toBe(3);
    expect(currentStage({ status: 'BID_ASSIGNED' }, p)).toBe(4);
    expect(currentStage({ status: 'BID_COMPLETED' }, p)).toBe(5);
    expect(currentStage({ status: 'IN_MAINTENANCE' }, p)).toBe(6);
    expect(currentStage({ status: 'MAINTENANCE_COMPLETED' }, p)).toBe(7);
    expect(currentStage({ status: 'HANDOVER_COMPLETED' }, p)).toBe(8);
  });

  it('needs power of attorney only when a representative filed the claim', () => {
    const p = emptyProcess();
    expect(documentChecklist(p, []).find(d => d.type === 'POWER_OF_ATTORNEY').state).toBe('na');
    p.representative = true;
    expect(documentChecklist(p, []).find(d => d.type === 'POWER_OF_ATTORNEY').state).toBe('pending');
  });

  it('wants the original of the licence and title deed seen, not only the copy', () => {
    const p = emptyProcess();
    const uploads = [upload('DRIVING_LICENCE')];
    expect(documentChecklist(p, uploads).find(d => d.type === 'DRIVING_LICENCE').state).toBe('original');
    p.documents.DRIVING_LICENCE = { originalSeen: true };
    expect(documentChecklist(p, uploads).find(d => d.type === 'DRIVING_LICENCE').state).toBe('received');
  });

  it('opens the documents gate only when every required document is in', () => {
    const p = emptyProcess();
    const all = ['NOTIFICATION_FORM_SIGNED', 'DRIVING_LICENCE', 'VEHICLE_TITLE_DEED', 'POLICE_REPORT', 'PROFORMA_INVOICE'].map(upload);
    p.documents.DRIVING_LICENCE = { originalSeen: true };
    expect(missingDocuments(p, all.slice(0, 4)).map(d => d.type)).toEqual(['VEHICLE_TITLE_DEED', 'PROFORMA_INVOICE']);
    p.documents.VEHICLE_TITLE_DEED = { originalSeen: true };
    const gate = stageGate(2, { claim: { status: 'SUBMITTED' }, proc: p, uploads: all });
    expect(gate.every(i => i.done)).toBe(true);
  });

  it('says what a claim is waiting on for the list', () => {
    const p = emptyProcess();
    expect(waitingOn({ status: 'SUBMITTED' }, p, [])).toBe('Claim notification form +4 more');
    expect(waitingOn({ status: 'IN_PROCESS' }, p, [])).toBe('Adjustor assigned');
    expect(waitingOn({ status: 'BID_COMPLETED', garageUuid: 'GAR-200' }, p, [])).toBe('Excess / contribution settled, or none applies');
  });

  it('keeps a rejected claim closed at the stage it stopped', () => {
    const p = emptyProcess();
    p.closed = { outcome: 'REJECTED', reason: 'Not covered', atStage: 3 };
    const claim = { status: 'IN_PROCESS' };
    expect(closedOutcome(claim, p)).toBe('REJECTED');
    const steps = stageSteps(claim, p);
    expect(steps[2].state).toContain('closed');
    expect(steps[1].state).toContain('done');
    expect(waitingOn(claim, p, [])).toBe('');
  });

  it('pays the selected quote minus the excess', () => {
    expect(netSettlement({ bidAmount: 30000 }, { excess: { amount: '2500', receiptNo: 'R1' } })).toBe(27500);
    expect(netSettlement({ bidAmount: 30000 }, { excess: { none: true } })).toBe(30000);
    expect(netSettlement(null, {})).toBeNull();
  });

  it('remembers process marks per claim', () => {
    const p = emptyProcess();
    p.excess = { none: true };
    saveProcess('c1', p);
    expect(loadProcess('c1').excess).toEqual({ none: true });
    expect(loadProcess('c2').excess).toBeNull();
  });

  it('counts days since the claim was reported', () => {
    expect(daysOpen({ createdAt: '2026-10-28T08:00:00' }, new Date('2026-11-01T09:00:00'))).toBe(4);
    expect(daysOpen({})).toBeNull();
  });

  it('takes what the server stores over this browser\'s copy', () => {
    saveProcess('c9', { ...emptyProcess(), excess: { amount: 100, receiptNo: 'OLD' }, reportedChannel: 'PHONE' });
    const proc = processFor({
      claimUuid: 'c9', status: 'REJECTED', filedByRepresentative: true, reportedChannel: 'WALK_IN',
      documentMarks: [{ documentType: 'DRIVING_LICENCE', status: 'RECEIVED', originalSeen: true }],
      excess: { none: false, amount: 2500, receiptNo: 'R-7' }, salvage: { status: 'RETURNED', note: 'bumper' },
      closed: { outcome: 'REJECTED', reason: 'No valid licence', statusBeforeClose: 'IN_PROCESS', closedBy: 'Tigist' },
    });
    expect(proc.representative).toBe(true);
    expect(proc.reportedChannel).toBe('WALK_IN');
    expect(proc.documents.DRIVING_LICENCE).toEqual({ status: 'RECEIVED', originalSeen: true, reason: '' });
    expect(proc.excess).toEqual({ amount: 2500, receiptNo: 'R-7' });
    expect(proc.salvage).toEqual({ status: 'RETURNED', note: 'bumper' });
    expect(proc.closed).toMatchObject({ outcome: 'REJECTED', reason: 'No valid licence', atStage: 3, by: 'Tigist' });
    expect(currentStage({ status: 'REJECTED' }, proc)).toBe(3);
  });

  it('keeps this browser\'s copy where the server stores nothing, and clears a closure the server reopened', () => {
    saveProcess('c10', { ...emptyProcess(), excess: { none: true }, closed: { outcome: 'WITHDRAWN', reason: 'x', atStage: 4 } });
    expect(processFor({ claimUuid: 'c10', status: 'BID_ASSIGNED' })).toMatchObject({ excess: { none: true }, closed: { outcome: 'WITHDRAWN' } });
    expect(processFor({ claimUuid: 'c10', status: 'BID_ASSIGNED', closed: null }).closed).toBeNull();
  });
});

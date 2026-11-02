import { describe, it, expect } from 'vitest';
import { registryIsMissing } from '../moduleStore';

describe('module registry on an older AuthService', () => {
  it('treats a 404 as "no registry yet"', () => {
    expect(registryIsMissing({ status: 404, message: 'Not Found' })).toBe(true);
  });

  it('treats the old 500 "No static resource modules/me." as "no registry yet"', () => {
    expect(registryIsMissing({ status: 500, message: 'No static resource modules/me.' })).toBe(true);
  });

  it('keeps real failures as errors', () => {
    expect(registryIsMissing({ status: 500, message: 'An unexpected error occurred.' })).toBe(false);
    expect(registryIsMissing({ status: 401, message: 'Unauthorized' })).toBe(false);
    expect(registryIsMissing({ status: 0, message: 'Network Error' })).toBe(false);
    expect(registryIsMissing(null)).toBe(false);
  });
});

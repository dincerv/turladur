import { describe, expect, it } from 'vitest';

import { COMPANY, getCompanyEmail, getCompanyMailto } from './company';

describe('company emails', () => {
  it('uses .com.tr privacy and support addresses', () => {
    expect(COMPANY.emails.privacy).toBe('privacy@turta.com.tr');
    expect(COMPANY.emails.support).toBe('destek@turta.com.tr');
    expect(getCompanyEmail('privacy')).toBe('privacy@turta.com.tr');
  });

  it('builds mailto with optional subject', () => {
    expect(getCompanyMailto('privacy')).toBe('mailto:privacy@turta.com.tr');
    expect(getCompanyMailto('privacy', 'KVKK')).toBe(
      'mailto:privacy@turta.com.tr?subject=KVKK',
    );
  });
});

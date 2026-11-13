import { describe, expect, it } from 'vitest';
import {
  contactMessageSchema,
  sanitizeContactPlainText,
  toContactMessagePayload,
} from '@turta/shared-validators';

describe('contact form validation', () => {
  it('strips html and control characters', () => {
    expect(
      sanitizeContactPlainText('  Merhaba <script>x</script> dünya  '),
    ).toBe('Merhaba x dünya');
  });

  it('accepts a valid payload and sanitizes fields', () => {
    const parsed = contactMessageSchema.parse({
      name: '  Ayşe Yılmaz  ',
      email: 'ayse@example.com',
      phone: '',
      subject: 'support',
      message: 'Bu bir test mesajıdır, en az on karakter.',
      privacy: true,
    });
    const payload = toContactMessagePayload(parsed, '');
    expect(payload.name).toBe('Ayşe Yılmaz');
    expect(payload.phone).toBeUndefined();
    expect(payload.subject).toBe('support');
    expect(payload.website).toBe('');
  });

  it('rejects short messages and invalid email', () => {
    const result = contactMessageSchema.safeParse({
      name: 'A',
      email: 'not-an-email',
      subject: 'other',
      message: 'kısa',
      privacy: false,
    });
    expect(result.success).toBe(false);
  });
});

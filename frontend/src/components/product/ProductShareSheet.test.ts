import { describe, expect, it, vi } from 'vitest';
import {
  buildGmailComposeUrl,
  buildShareTargets,
  isMobileShareDevice,
  openEmailShare,
  openShareHref,
} from './ProductShareSheet.tsx';

describe('buildShareTargets', () => {
  it('builds a mailto link for email sharing', () => {
    const targets = buildShareTargets('https://diyar.sa/p/1', 'Test product');
    const email = targets.find((target) => target.id === 'email');

    expect(email?.href).toContain('mailto:?');
    expect(email?.href).toContain(encodeURIComponent('Test product'));
    expect(email?.href).toContain(encodeURIComponent('https://diyar.sa/p/1'));
  });
});

describe('buildGmailComposeUrl', () => {
  it('builds a Gmail compose URL with subject and body', () => {
    const url = buildGmailComposeUrl('Product', 'Product\nhttps://diyar.sa/p/1');

    expect(url).toContain('mail.google.com/mail/');
    expect(url).toContain(encodeURIComponent('Product'));
    expect(url).toContain(encodeURIComponent('https://diyar.sa/p/1'));
  });
});

describe('openShareHref', () => {
  it('clicks a temporary anchor for custom schemes', () => {
    const click = vi.fn();
    const anchor = { href: '', rel: '', style: { display: '' }, click } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
    const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);

    openShareHref('mailto:?subject=Hi');

    expect(createElement).toHaveBeenCalledWith('a');
    expect(anchor.href).toBe('mailto:?subject=Hi');
    expect(click).toHaveBeenCalledOnce();
    expect(removeChild).toHaveBeenCalledWith(anchor);

    createElement.mockRestore();
    appendChild.mockRestore();
    removeChild.mockRestore();
  });
});

describe('openEmailShare', () => {
  it('opens Gmail compose on desktop', () => {
    vi.spyOn(window, 'open').mockReturnValue({} as Window);
    const ua = vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Windows NT 10.0');

    openEmailShare({
      subject: 'Product',
      body: 'Product\nhttps://diyar.sa/p/1',
      mailtoHref: 'mailto:?subject=Product',
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('mail.google.com/mail/'),
      '_blank',
      'noopener,noreferrer',
    );

    ua.mockRestore();
  });

  it('uses mailto on mobile', () => {
    const ua = vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('iPhone');
    const click = vi.fn();
    const anchor = { href: '', rel: '', style: { display: '' }, click } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);

    openEmailShare({
      subject: 'Product',
      body: 'Product\nhttps://diyar.sa/p/1',
      mailtoHref: 'mailto:?subject=Product',
    });

    expect(click).toHaveBeenCalledOnce();
    expect(isMobileShareDevice()).toBe(true);

    ua.mockRestore();
  });
});
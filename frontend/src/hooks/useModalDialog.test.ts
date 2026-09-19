/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useModalDialog } from './useModalDialog.ts';

describe('useModalDialog', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.textContent = 'Close';
    container.appendChild(button);
    document.body.appendChild(container);

    const ref = { current: container };
    renderHook(() => useModalDialog(true, onClose, ref));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);

    container.remove();
  });
});

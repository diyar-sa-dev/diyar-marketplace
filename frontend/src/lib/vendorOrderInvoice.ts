import { apiClient } from '../api/client.ts';
import { ensureCsrfCookie } from './csrf.ts';

function isHtmlInvoice(payload: string): boolean {
  const trimmed = payload.trim();

  return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html');
}

export async function openVendorOrderInvoice(vendorOrderId: string): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (printWindow === null) {
    throw new Error('Unable to open print window');
  }

  printWindow.document.write('<!DOCTYPE html><html><body><p>Loading invoice…</p></body></html>');

  try {
    await ensureCsrfCookie();

    const response = await apiClient.get<string>(
      `/dashboard/vendor/orders/${vendorOrderId}/invoice`,
      {
        headers: {
          Accept: 'text/html, application/xhtml+xml',
        },
        responseType: 'text',
        transformResponse: [(data) => data],
      },
    );

    const html = typeof response.data === 'string' ? response.data : '';

    if (!isHtmlInvoice(html)) {
      throw new Error('Invalid invoice response');
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    window.setTimeout(() => {
      printWindow.print();
    }, 300);
  } catch (error) {
    printWindow.close();
    throw error;
  }
}

const BLOCKED_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base']);

function stripUnsafeAttributes(element: Element): void {
  for (const attr of [...element.attributes]) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on') || name === 'srcdoc') {
      element.removeAttribute(attr.name);
    }
  }
}

/**
 * Removes script/iframe tags and event-handler attributes before rendering HTML content.
 */
export function sanitizeHtml(html: string): string {
  if (!html.trim()) {
    return '';
  }

  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '');
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('*').forEach((node) => {
    if (BLOCKED_TAGS.has(node.tagName.toLowerCase())) {
      node.remove();
      return;
    }
    stripUnsafeAttributes(node);
  });

  return doc.body.innerHTML;
}

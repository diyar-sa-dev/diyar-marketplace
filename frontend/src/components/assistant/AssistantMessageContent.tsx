import type { ReactNode } from 'react';

const LIST_LINE = /^(\s*)([*\-•]|\d+\.)\s+(.+)$/;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-b-${index}`} className="font-bold text-diyar-dark">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: Array<{ depth: number; text: string }> };

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraphBuffer: string[] = [];
  let listItems: Array<{ depth: number; text: string }> = [];

  const flushParagraph = () => {
    const text = paragraphBuffer.join('\n').trim();
    if (text) {
      blocks.push({ kind: 'paragraph', text });
    }
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ kind: 'list', items: listItems });
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const match = line.match(LIST_LINE);
    if (match) {
      flushParagraph();
      const indent = match[1].replace(/\t/g, '    ').length;
      const depth = Math.floor(indent / 4);
      listItems.push({ depth, text: match[3].trim() });
      continue;
    }

    flushList();
    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  flushList();
  return blocks;
}

function renderList(items: Array<{ depth: number; text: string }>, key: string) {
  type Node = { depth: number; text: string; children: Node[] };
  const roots: Node[] = [];

  items.forEach((item) => {
    const node: Node = { ...item, children: [] };
    if (item.depth === 0 || roots.length === 0) {
      roots.push(node);
      return;
    }

    let cursor = roots[roots.length - 1];
    for (let depth = 1; depth < item.depth; depth += 1) {
      const child = cursor.children[cursor.children.length - 1];
      if (!child) {
        break;
      }
      cursor = child;
    }
    cursor.children.push(node);
  });

  const renderNodes = (nodes: Node[], prefix: string): ReactNode => (
    <ul className="list-disc space-y-1.5 ps-4 marker:text-diyar-brown/70">
      {nodes.map((node, index) => (
        <li key={`${prefix}-${index}`} className="leading-relaxed">
          {renderInline(node.text, `${prefix}-${index}`)}
          {node.children.length > 0 ? renderNodes(node.children, `${prefix}-${index}-c`) : null}
        </li>
      ))}
    </ul>
  );

  return renderNodes(roots, key);
}

type AssistantMessageContentProps = {
  content: string;
  className?: string;
};

export function AssistantMessageContent({ content, className = '' }: AssistantMessageContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-3 text-sm md:text-base leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        if (block.kind === 'list') {
          return <div key={`list-${index}`}>{renderList(block.items, `list-${index}`)}</div>;
        }

        return (
          <p key={`p-${index}`} className="whitespace-pre-wrap">
            {renderInline(block.text, `p-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

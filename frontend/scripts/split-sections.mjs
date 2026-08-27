import fs from 'node:fs';
import path from 'node:path';

const srcPath = 'src/components/home/Sections.tsx';
const src = fs.readFileSync(srcPath, 'utf8');
const lines = src.split(/\r?\n/);
const exports = [];

for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(/^export function (\w+)/);
  if (match) {
    exports.push({ name: match[1], start: i });
  }
}

exports.push({ name: 'END', start: lines.length });

const importsEnd = lines.findIndex((line) => line.startsWith('function RailArrows'));
const importsOnly = lines.slice(0, importsEnd).join('\n');
const railBlock = lines.slice(importsEnd, exports[0].start).join('\n');
const outDir = 'src/components/home/sections';

fs.mkdirSync(outDir, { recursive: true });

const railImports = importsOnly
  .replaceAll("from '../", "from '../../")
  .replaceAll("from '../../hooks", "from '../../../hooks")
  .replaceAll("from '../../lib", "from '../../../lib")
  .replaceAll("from '../../api", "from '../../../api")
  .replaceAll("from '../../utils", "from '../../../utils");

fs.writeFileSync(
  path.join(outDir, 'RailArrows.tsx'),
  `${railImports}\n\n${railBlock.replace('function RailArrows', 'export function RailArrows')}\n`,
);

const sectionImports = `import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import ProductCard from '../../cards/ProductCard.tsx';
import ServiceCard from '../../cards/ServiceCard.tsx';
import { useCategories, useProducts, useVendors } from '../../../hooks/catalog/useCatalog.ts';
import { useBlogArticles } from '../../../hooks/blog/useBlogArticles.ts';
import { formatBlogReadingTime } from '../../../lib/formatBlogReadingTime.ts';
import { formatLocaleDate } from '../../../lib/intlLocale.ts';
import { serviceKeys } from '../../../hooks/services/queryKeys.ts';
import { fetchServices } from '../../../api/services.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import { validateNewsletterEmail } from '../../../lib/platformForms.ts';
import { parseApiError } from '../../../utils/errors.ts';
import { subscribeNewsletter } from '../../../api/platform.ts';
import { useAuth } from '../../../hooks/auth/useAuth.ts';
import { useLoyaltySummary } from '../../../hooks/loyalty/useLoyalty.ts';
import { skipDashboardTutorial } from '../../../lib/dashboardTutorialStorage.ts';
import { isValidStoreSlug, storePath } from '../../../lib/storePath.ts';
import { StarRating } from '../../product/StarRating.tsx';
import { mapProductCard } from '../../../lib/catalogMappers.ts';
import SectionEmptyState from '../SectionEmptyState.tsx';
import { RailArrows } from './RailArrows.tsx';
import {
  Star,
  Quote,
  ArrowLeft,
  Send,
  Sparkles,
  UploadCloud,
  Store,
  Briefcase,
  Paintbrush,
  Smartphone,
  Scan,
  Box,
  BellRing,
  Wrench,
  ShieldCheck,
  Truck,
  HeadphonesIcon,
  CreditCard,
  PenTool,
  Twitter,
  Instagram,
  MessageCircle,
  Heart,
  Bookmark,
  Eye,
  Gift,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

`;

for (let i = 0; i < exports.length - 1; i += 1) {
  const { name, start } = exports[i];
  const end = exports[i + 1].start;
  const body = lines.slice(start, end).join('\n');
  fs.writeFileSync(path.join(outDir, `${name}.tsx`), sectionImports + body);
}

const barrel = exports
  .slice(0, -1)
  .map(({ name }) => `export { ${name} } from './sections/${name}.tsx';`)
  .join('\n');

fs.writeFileSync(srcPath, `${barrel}\n`);

console.log(`Split ${exports.length - 1} home sections.`);

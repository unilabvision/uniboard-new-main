import type { SiteApplicationFieldType, SiteApplicationFormFieldOption } from '@/app/types/siteApplicationForms';

/** Types that use an options list (choices / scale points). */
export const OPTION_FIELD_TYPES = new Set<SiteApplicationFieldType>([
  'select',
  'checkbox',
  'dropdown',
  'linear_scale',
  'rating',
]);

export const FIELD_TYPE_GROUPS: Array<{
  id: string;
  tr: string;
  en: string;
  types: SiteApplicationFieldType[];
}> = [
  {
    id: 'text',
    tr: 'Metin',
    en: 'Text',
    types: ['text', 'textarea', 'email', 'tel', 'number', 'url'],
  },
  {
    id: 'choice',
    tr: 'Seçim',
    en: 'Choice',
    types: ['select', 'checkbox', 'dropdown'],
  },
  {
    id: 'scale',
    tr: 'Ölçek',
    en: 'Scale',
    types: ['linear_scale', 'rating'],
  },
  {
    id: 'datetime',
    tr: 'Tarih & saat',
    en: 'Date & time',
    types: ['date', 'time'],
  },
  {
    id: 'media',
    tr: 'Dosya',
    en: 'File',
    types: ['file'],
  },
];

export const ALL_FIELD_TYPES: SiteApplicationFieldType[] = FIELD_TYPE_GROUPS.flatMap(
  (g) => g.types
);

export function defaultOptionsForType(
  type: SiteApplicationFieldType
): SiteApplicationFormFieldOption[] | undefined {
  if (type === 'select' || type === 'checkbox' || type === 'dropdown') {
    return [
      { value: 'option_1', label_tr: 'Seçenek 1', label_en: 'Option 1' },
      { value: 'option_2', label_tr: 'Seçenek 2', label_en: 'Option 2' },
    ];
  }
  if (type === 'linear_scale' || type === 'rating') {
    const max = type === 'rating' ? 5 : 5;
    return Array.from({ length: max }, (_, i) => {
      const n = String(i + 1);
      return { value: n, label_tr: n, label_en: n };
    });
  }
  return undefined;
}

export function isOptionFieldType(type: SiteApplicationFieldType): boolean {
  return OPTION_FIELD_TYPES.has(type);
}

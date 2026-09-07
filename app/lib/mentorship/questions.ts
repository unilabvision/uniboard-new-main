import type {
  MentorshipApplicationQuestion,
  MentorshipQuestionOption,
  MentorshipQuestionType,
} from '@/app/types/mentorship';

export const MENTORSHIP_QUESTION_TYPES = [
  'text',
  'textarea',
  'select',
  'url',
  'number',
  'checkbox',
] as const;

export function newQuestionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function fieldKeyFromLabel(label: string, existingKeys: Set<string>): string {
  const trMap: Record<string, string> = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
  };
  const normalized = label
    .trim()
    .toLowerCase()
    .split('')
    .map((ch) => trMap[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const base = normalized || 'soru';
  let key = base;
  let i = 2;
  while (existingKeys.has(key)) {
    key = `${base}_${i++}`;
  }
  return key;
}

export function defaultMentorshipQuestions(): MentorshipApplicationQuestion[] {
  return [
    {
      id: newQuestionId(),
      field_key: 'motivation',
      field_type: 'textarea',
      label_tr: 'Bu mentörlüğe neden başvuruyorsunuz?',
      label_en: 'Why are you applying for this mentorship?',
      placeholder_tr: 'Kısaca motivasyonunuzu yazın',
      placeholder_en: 'Briefly describe your motivation',
      required: true,
      order_index: 0,
      options: [],
    },
    {
      id: newQuestionId(),
      field_key: 'goals',
      field_type: 'textarea',
      label_tr: 'Bu mentörlükten ne bekliyorsunuz / hedefleriniz neler?',
      label_en: 'What do you expect from this mentorship / what are your goals?',
      placeholder_tr: 'Hedeflerinizi yazın',
      placeholder_en: 'Describe your goals',
      required: false,
      order_index: 1,
      options: [],
    },
    {
      id: newQuestionId(),
      field_key: 'experience',
      field_type: 'textarea',
      label_tr: 'İlgili deneyiminiz var mı?',
      label_en: 'Do you have relevant experience?',
      placeholder_tr: 'Deneyiminizi yazın',
      placeholder_en: 'Describe your experience',
      required: false,
      order_index: 2,
      options: [],
    },
  ];
}

function normalizeOptions(raw: unknown): MentorshipQuestionOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((opt, index) => {
      if (typeof opt === 'string') {
        const value = opt.trim();
        if (!value) return null;
        return { value, label_tr: value, label_en: value };
      }
      if (!opt || typeof opt !== 'object') return null;
      const row = opt as Record<string, unknown>;
      const labelTr =
        typeof row.label_tr === 'string'
          ? row.label_tr.trim()
          : typeof row.label === 'string'
            ? row.label.trim()
            : '';
      const labelEn =
        typeof row.label_en === 'string'
          ? row.label_en.trim()
          : typeof row.label === 'string'
            ? row.label.trim()
            : labelTr;
      const value =
        typeof row.value === 'string' && row.value.trim()
          ? row.value.trim()
          : labelTr || `option_${index + 1}`;
      if (!labelTr && !labelEn) return null;
      return {
        value,
        label_tr: labelTr || labelEn,
        label_en: labelEn || labelTr,
      };
    })
    .filter((opt): opt is MentorshipQuestionOption => Boolean(opt));
}

export function normalizeMentorshipQuestions(
  raw: unknown
): MentorshipApplicationQuestion[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      return normalizeMentorshipQuestions(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];

  const existingKeys = new Set<string>();
  const questions: MentorshipApplicationQuestion[] = [];

  raw.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const row = item as Record<string, unknown>;
    const labelTr =
      typeof row.label_tr === 'string'
        ? row.label_tr.trim()
        : typeof row.label === 'string'
          ? row.label.trim()
          : '';
    const labelEn =
      typeof row.label_en === 'string' ? row.label_en.trim() : labelTr;
    if (!labelTr && !labelEn) return;

    const typeRaw = typeof row.field_type === 'string' ? row.field_type : 'textarea';
    const field_type = (MENTORSHIP_QUESTION_TYPES as readonly string[]).includes(typeRaw)
      ? (typeRaw as MentorshipQuestionType)
      : 'textarea';

    let field_key =
      typeof row.field_key === 'string' && row.field_key.trim()
        ? row.field_key.trim()
        : fieldKeyFromLabel(labelTr || labelEn, existingKeys);
    if (existingKeys.has(field_key)) {
      field_key = fieldKeyFromLabel(field_key, existingKeys);
    }
    existingKeys.add(field_key);

    questions.push({
      id:
        typeof row.id === 'string' && row.id.trim()
          ? row.id.trim()
          : newQuestionId(),
      field_key,
      field_type,
      label_tr: labelTr || labelEn,
      label_en: labelEn || labelTr,
      placeholder_tr:
        typeof row.placeholder_tr === 'string' ? row.placeholder_tr : '',
      placeholder_en:
        typeof row.placeholder_en === 'string' ? row.placeholder_en : '',
      required: Boolean(row.required),
      order_index:
        typeof row.order_index === 'number' && Number.isFinite(row.order_index)
          ? row.order_index
          : index,
      options: normalizeOptions(row.options),
    });
  });

  return questions
    .sort((a, b) => a.order_index - b.order_index)
    .map((q, index) => ({ ...q, order_index: index }));
}

export function localizeMentorshipQuestions(
  questions: MentorshipApplicationQuestion[],
  locale: string
) {
  const lang = locale === 'en' ? 'en' : 'tr';
  return questions.map((q) => ({
    field_key: q.field_key,
    field_type: q.field_type,
    label: lang === 'en' ? q.label_en || q.label_tr : q.label_tr || q.label_en,
    placeholder:
      (lang === 'en'
        ? q.placeholder_en || q.placeholder_tr
        : q.placeholder_tr || q.placeholder_en) || null,
    required: q.required,
    order_index: q.order_index,
    options: (q.options || []).map((opt) => ({
      value: opt.value,
      label: lang === 'en' ? opt.label_en || opt.label_tr : opt.label_tr || opt.label_en,
    })),
  }));
}

export function formatAnswerValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v : String(v)))
      .filter(Boolean)
      .join(', ');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** motivation / goals / experience anahtarlarını klasik kolonlara da yazar */
export function splitLegacyAnswerFields(answers: Record<string, unknown> | null | undefined) {
  const src = answers && typeof answers === 'object' ? answers : {};
  const asText = (key: string) => {
    const v = src[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  return {
    motivation: asText('motivation'),
    goals: asText('goals'),
    experience: asText('experience'),
  };
}

export function validateRequiredAnswers(
  questions: MentorshipApplicationQuestion[],
  answers: Record<string, unknown> | null | undefined
): string | null {
  const src = answers && typeof answers === 'object' ? answers : {};
  for (const q of questions) {
    if (!q.required) continue;
    const value = src[q.field_key];
    if (q.field_type === 'checkbox') {
      if (!Array.isArray(value) || value.length === 0) {
        return `"${q.label_tr || q.label_en}" zorunludur`;
      }
      continue;
    }
    if (value == null || (typeof value === 'string' && !value.trim())) {
      return `"${q.label_tr || q.label_en}" zorunludur`;
    }
  }
  return null;
}

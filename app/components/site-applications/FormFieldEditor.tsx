'use client';

import React, { useMemo } from 'react';
import {
  AlignLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Hash,
  Link2,
  List,
  Mail,
  Phone,
  Plus,
  TextCursorInput,
  Trash2,
} from 'lucide-react';
import { fieldKeyFromLabel } from '@/app/lib/siteApplications/forms';
import type {
  SiteApplicationFieldType,
  SiteApplicationFormFieldInput,
  SiteApplicationFormFieldOption,
} from '@/app/types/siteApplicationForms';

const FIELD_TYPE_META: Record<
  SiteApplicationFieldType,
  { tr: string; en: string; icon: React.ElementType }
> = {
  text: { tr: 'Kısa yanıt', en: 'Short answer', icon: TextCursorInput },
  textarea: { tr: 'Paragraf', en: 'Paragraph', icon: AlignLeft },
  email: { tr: 'E-posta', en: 'Email', icon: Mail },
  tel: { tr: 'Telefon', en: 'Phone', icon: Phone },
  number: { tr: 'Sayı', en: 'Number', icon: Hash },
  date: { tr: 'Tarih', en: 'Date', icon: Calendar },
  url: { tr: 'Web adresi', en: 'URL', icon: Link2 },
  select: { tr: 'Çoktan seçmeli', en: 'Multiple choice', icon: List },
};

const FIELD_TYPES = Object.keys(FIELD_TYPE_META) as SiteApplicationFieldType[];

const texts = {
  tr: {
    question: 'Soru',
    questionEn: 'Soru (EN)',
    type: 'Soru türü',
    required: 'Zorunlu',
    placeholder: 'Yardımcı metin (isteğe bağlı)',
    placeholderEn: 'Placeholder (EN)',
    advanced: 'Gelişmiş ayarlar',
    fieldKey: 'Alan anahtarı',
    options: 'Seçenekler',
    addOption: 'Seçenek ekle',
    addQuestion: 'Soru ekle',
    remove: 'Sil',
    moveUp: 'Yukarı',
    moveDown: 'Aşağı',
    optionLabel: 'Seçenek',
    emptyHint: 'Henüz soru yok. Varsayılan alanları ekleyin veya yeni soru oluşturun.',
  },
  en: {
    question: 'Question',
    questionEn: 'Question (EN)',
    type: 'Question type',
    required: 'Required',
    placeholder: 'Helper text (optional)',
    placeholderEn: 'Placeholder (EN)',
    advanced: 'Advanced settings',
    fieldKey: 'Field key',
    options: 'Options',
    addOption: 'Add option',
    addQuestion: 'Add question',
    remove: 'Remove',
    moveUp: 'Up',
    moveDown: 'Down',
    optionLabel: 'Option',
    emptyHint: 'No questions yet. Add default fields or create a new question.',
  },
};

function updateField(
  index: number,
  patch: Partial<SiteApplicationFormFieldInput>,
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>
) {
  setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
}

function moveField(
  index: number,
  direction: -1 | 1,
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>
) {
  setFields((prev) => {
    const next = [...prev];
    const target = index + direction;
    if (target < 0 || target >= next.length) return prev;
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((field, i) => ({ ...field, order_index: i }));
  });
}

function updateSelectOption(
  fieldIndex: number,
  optionIndex: number,
  patch: Partial<SiteApplicationFormFieldOption>,
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>
) {
  setFields((prev) =>
    prev.map((field, i) => {
      if (i !== fieldIndex) return field;
      const options = [...(field.options || [])];
      options[optionIndex] = { ...options[optionIndex], ...patch };
      return { ...field, options };
    })
  );
}

interface FormFieldEditorProps {
  locale: string;
  fields: SiteApplicationFormFieldInput[];
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>;
  onAddField?: () => void;
}

export default function FormFieldEditor({
  locale,
  fields,
  setFields,
  onAddField,
}: FormFieldEditorProps) {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const isEn = locale === 'en';

  const autoKeys = useMemo(() => new Set(fields.map((f) => f.field_key)), [fields]);

  const handleLabelChange = (index: number, labelTr: string, field: SiteApplicationFormFieldInput) => {
    const patch: Partial<SiteApplicationFormFieldInput> = { label_tr: labelTr };
    const looksAuto =
      !field.field_key ||
      field.field_key.startsWith('field_') ||
      field.field_key === fieldKeyFromLabel(field.label_tr || '', new Set());

    if (looksAuto && labelTr.trim()) {
      const others = new Set(fields.filter((_, i) => i !== index).map((f) => f.field_key));
      patch.field_key = fieldKeyFromLabel(labelTr, others);
    }
    if (!field.label_en?.trim() && labelTr.trim()) {
      patch.label_en = labelTr;
    }
    updateField(index, patch, setFields);
  };

  const addField = () => {
    if (onAddField) {
      onAddField();
      return;
    }
    setFields((prev) => [
      ...prev,
      {
        field_key: `field_${prev.length + 1}`,
        field_type: 'text',
        label_tr: '',
        label_en: '',
        required: false,
        order_index: prev.length,
      },
    ]);
  };

  if (fields.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-600 p-10 text-center text-neutral-500">
        <p className="text-sm mb-4">{t.emptyHint}</p>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#990000] text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t.addQuestion}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const typeMeta = FIELD_TYPE_META[field.field_type];
        const TypeIcon = typeMeta.icon;

        return (
          <div
            key={`${field.field_key}-${index}`}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 shadow-sm overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-neutral-100 dark:border-neutral-700/80">
              <div className="flex-1 min-w-0 space-y-3">
                <input
                  value={field.label_tr}
                  onChange={(e) => handleLabelChange(index, e.target.value, field)}
                  placeholder={t.question}
                  className="w-full text-lg font-medium bg-transparent border-0 border-b border-transparent focus:border-[#990000] focus:outline-none pb-1 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
                <input
                  value={field.label_en}
                  onChange={(e) => updateField(index, { label_en: e.target.value }, setFields)}
                  placeholder={t.questionEn}
                  className="w-full text-sm bg-transparent border-0 border-b border-neutral-200 dark:border-neutral-600 focus:border-[#990000] focus:outline-none pb-1 text-neutral-600 dark:text-neutral-400 placeholder:text-neutral-400"
                />
              </div>
              <div className="shrink-0">
                <label className="sr-only">{t.type}</label>
                <div className="relative">
                  <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <select
                    value={field.field_type}
                    onChange={(e) => {
                      const nextType = e.target.value as SiteApplicationFieldType;
                      const patch: Partial<SiteApplicationFormFieldInput> = { field_type: nextType };
                      if (nextType === 'select' && !field.options?.length) {
                        patch.options = [
                          { value: 'option_1', label_tr: 'Seçenek 1', label_en: 'Option 1' },
                        ];
                      }
                      updateField(index, patch, setFields);
                    }}
                    className="appearance-none pl-9 pr-8 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm font-medium min-w-[11rem]"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {isEn ? FIELD_TYPE_META[ft].en : FIELD_TYPE_META[ft].tr}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {field.field_type === 'select' ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{t.options}</p>
                  {(field.options || []).map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border-2 border-neutral-300 shrink-0" />
                      <input
                        value={opt.label_tr}
                        onChange={(e) => {
                          const label = e.target.value;
                          updateSelectOption(
                            index,
                            optIndex,
                            {
                              label_tr: label,
                              label_en: opt.label_en || label,
                              value: opt.value || fieldKeyFromLabel(label, autoKeys),
                            },
                            setFields
                          );
                        }}
                        placeholder={`${t.optionLabel} ${optIndex + 1}`}
                        className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2 text-sm dark:bg-neutral-900"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            index,
                            { options: (field.options || []).filter((_, i) => i !== optIndex) },
                            setFields
                          )
                        }
                        className="p-2 text-neutral-400 hover:text-red-600"
                        aria-label={t.remove}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        index,
                        {
                          options: [
                            ...(field.options || []),
                            {
                              value: `option_${(field.options?.length || 0) + 1}`,
                              label_tr: '',
                              label_en: '',
                            },
                          ],
                        },
                        setFields
                      )
                    }
                    className="text-sm text-[#990000] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t.addOption}
                  </button>
                </div>
              ) : (
                <input
                  disabled
                  placeholder={
                    field.field_type === 'textarea'
                      ? 'Uzun yanıt metni...'
                      : isEn
                        ? FIELD_TYPE_META[field.field_type].en
                        : FIELD_TYPE_META[field.field_type].tr
                  }
                  className="w-full rounded-lg border border-dashed border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30"
                />
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={field.placeholder_tr || ''}
                  onChange={(e) => updateField(index, { placeholder_tr: e.target.value }, setFields)}
                  placeholder={t.placeholder}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2 text-sm dark:bg-neutral-900"
                />
                <input
                  value={field.placeholder_en || ''}
                  onChange={(e) => updateField(index, { placeholder_en: e.target.value }, setFields)}
                  placeholder={t.placeholderEn}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2 text-sm dark:bg-neutral-900"
                />
              </div>

              <details className="group">
                <summary className="text-xs text-neutral-500 cursor-pointer hover:text-[#990000]">
                  {t.advanced}
                </summary>
                <div className="mt-2">
                  <input
                    value={field.field_key}
                    onChange={(e) => updateField(index, { field_key: e.target.value }, setFields)}
                    placeholder={t.fieldKey}
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2 text-sm font-mono dark:bg-neutral-900"
                  />
                </div>
              </details>
            </div>

            <div className="flex items-center justify-between px-5 py-3 bg-neutral-50/80 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-neutral-700">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={!!field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked }, setFields)}
                  className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
                />
                {t.required}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveField(index, -1, setFields)}
                  className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                  title={t.moveUp}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={index === fields.length - 1}
                  onClick={() => moveField(index, 1, setFields)}
                  className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                  title={t.moveDown}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFields((prev) => prev.filter((_, i) => i !== index))}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title={t.remove}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addField}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-[#990000]/50 hover:text-[#990000] transition-colors"
      >
        <Plus className="w-5 h-5" />
        {t.addQuestion}
      </button>
    </div>
  );
}

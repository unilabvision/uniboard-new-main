'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  CloudUpload,
  Hash,
  Link2,
  List,
  Mail,
  Phone,
  Plus,
  Star,
  TextCursorInput,
  Trash2,
} from 'lucide-react';
import { fieldKeyFromLabel } from '@/app/lib/siteApplications/forms';
import {
  defaultOptionsForType,
  FIELD_TYPE_GROUPS,
  isOptionFieldType,
} from '@/app/lib/siteApplications/fieldTypes';
import {
  formatFileSize,
  getMaxFileBytesForFormType,
} from '@/app/lib/siteApplications/files';
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
  time: { tr: 'Saat', en: 'Time', icon: Clock },
  url: { tr: 'Web adresi', en: 'URL', icon: Link2 },
  select: { tr: 'Çoktan seçmeli', en: 'Multiple choice', icon: Circle },
  checkbox: { tr: 'Onay kutuları', en: 'Checkboxes', icon: CheckSquare },
  dropdown: { tr: 'Açılır menü', en: 'Dropdown', icon: List },
  linear_scale: { tr: 'Doğrusal ölçek', en: 'Linear scale', icon: Hash },
  rating: { tr: 'Derecelendirme', en: 'Rating', icon: Star },
  file: { tr: 'Dosya yükleme', en: 'File upload', icon: CloudUpload },
};

const texts = {
  tr: {
    question: 'Soru metni (TR) — sitede Türkçe bu görünür',
    questionEn: 'Soru metni (EN) — English site',
    type: 'Soru türü',
    required: 'Zorunlu',
    placeholder: 'Yardımcı metin (TR)',
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
    scaleHint: 'Ölçek noktaları (1’den N’ye)',
    ratingHint: 'Yıldız sayısı',
    previewOnly: 'Önizleme — başvuru formunda tıklanabilir',
    scaleLow: 'Düşük',
    scaleHigh: 'Yüksek',
    previewFile: 'Dosya yükleme alanı',
    previewShort: 'Kısa yanıt metni',
    previewLong: 'Uzun yanıt metni…',
    fileLimitTeam: 'Ekip formu dosya limiti (depolama)',
    fileLimitEvent: 'Dosya boyutu limiti',
    localeHint:
      'Üst satır = Türkçe (TR site). Alt satır = İngilizce. Sağdaki önizleme seçili panele göre güncellenir; canlı sitede görmek için “Kaydet ve yayınla” şart.',
    badgeTr: 'TR',
    badgeEn: 'EN',
  },
  en: {
    question: 'Question text (EN) — shown on English site',
    questionEn: 'Question text (TR) — Turkish site',
    type: 'Question type',
    required: 'Required',
    placeholder: 'Helper text (EN)',
    placeholderEn: 'Helper text (TR)',
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
    scaleHint: 'Scale points (1 to N)',
    ratingHint: 'Number of stars',
    previewOnly: 'Preview — clickable on the live form',
    scaleLow: 'Low',
    scaleHigh: 'High',
    previewFile: 'File upload field',
    previewShort: 'Short answer text',
    previewLong: 'Long answer text…',
    fileLimitTeam: 'Team form file limit (storage)',
    fileLimitEvent: 'File size limit',
    localeHint:
      'Primary row follows UI language. Right preview updates live; use Save & publish to push to the public site.',
    badgeTr: 'TR',
    badgeEn: 'EN',
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

function FieldTypePicker({
  value,
  isEn,
  onChange,
  label,
}: {
  value: SiteApplicationFieldType;
  isEn: boolean;
  onChange: (type: SiteApplicationFieldType) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const meta = FIELD_TYPE_META[value] || FIELD_TYPE_META.text;
  const Icon = meta.icon;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <label className="sr-only">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 min-w-[12.5rem] pl-3 pr-2.5 py-2 rounded-xl border text-sm font-medium transition-colors ${
          open
            ? 'border-[#990000] bg-white dark:bg-neutral-900 ring-2 ring-[#990000]/20'
            : 'border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-300'
        }`}
      >
        <Icon className="w-4 h-4 text-neutral-500 shrink-0" />
        <span className="flex-1 text-left text-neutral-800 dark:text-neutral-100">
          {isEn ? meta.en : meta.tr}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[17rem] max-h-[22rem] overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 shadow-xl py-2">
          {FIELD_TYPE_GROUPS.map((group, gi) => (
            <div key={group.id} className={gi > 0 ? 'mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-800' : ''}>
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {isEn ? group.en : group.tr}
              </p>
              {group.types.map((ft) => {
                const item = FIELD_TYPE_META[ft];
                const ItemIcon = item.icon;
                const selected = ft === value;
                return (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => {
                      onChange(ft);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                      selected
                        ? 'bg-[#990000]/10 text-[#990000]'
                        : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <ItemIcon className="w-4 h-4 shrink-0 opacity-80" />
                    <span className="font-medium">{isEn ? item.en : item.tr}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChoiceOptionsEditor({
  field,
  index,
  t,
  autoKeys,
  setFields,
  variant,
}: {
  field: SiteApplicationFormFieldInput;
  index: number;
  t: (typeof texts)['tr'];
  autoKeys: Set<string>;
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>;
  variant: 'radio' | 'checkbox' | 'dropdown';
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{t.options}</p>
      {(field.options || []).map((opt, optIndex) => (
        <div key={optIndex} className="flex items-center gap-2">
          {variant === 'radio' && (
            <span className="w-5 h-5 rounded-full border-2 border-neutral-300 shrink-0" />
          )}
          {variant === 'checkbox' && (
            <span className="w-5 h-5 rounded border-2 border-neutral-300 shrink-0" />
          )}
          {variant === 'dropdown' && (
            <span className="w-5 text-center text-xs text-neutral-400 shrink-0">{optIndex + 1}</span>
          )}
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
  );
}

function ScaleEditor({
  field,
  index,
  setFields,
  hint,
  variant,
  previewOnlyLabel,
  lowLabel,
  highLabel,
}: {
  field: SiteApplicationFormFieldInput;
  index: number;
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>;
  hint: string;
  variant: 'linear_scale' | 'rating';
  previewOnlyLabel: string;
  lowLabel: string;
  highLabel: string;
}) {
  const count = Math.max(2, Math.min(10, field.options?.length || 5));
  const options =
    field.options?.length
      ? field.options
      : Array.from({ length: count }, (_, i) => {
          const v = String(i + 1);
          return { value: v, label_tr: v, label_en: v };
        });

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {hint}
        </label>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            disabled={count <= 2}
            onClick={() => {
              const n = Math.max(2, count - 1);
              updateField(
                index,
                {
                  options: Array.from({ length: n }, (_, i) => {
                    const v = String(i + 1);
                    return { value: v, label_tr: v, label_en: v };
                  }),
                },
                setFields
              );
            }}
            className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
            aria-label="-"
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
            {count}
          </span>
          <button
            type="button"
            disabled={count >= 10}
            onClick={() => {
              const n = Math.min(10, count + 1);
              updateField(
                index,
                {
                  options: Array.from({ length: n }, (_, i) => {
                    const v = String(i + 1);
                    return { value: v, label_tr: v, label_en: v };
                  }),
                },
                setFields
              );
            }}
            className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
            aria-label="+"
          >
            +
          </button>
        </div>
      </div>

      {variant === 'rating' ? (
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-1.5" aria-hidden>
            {options.map((opt) => (
              <Star
                key={opt.value}
                className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow-sm"
              />
            ))}
          </div>
          <p className="text-[11px] text-neutral-400">{previewOnlyLabel}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2 px-1">
            <span className="text-[11px] text-neutral-400">{lowLabel}</span>
            <span className="text-[11px] text-neutral-400">{highLabel}</span>
          </div>
          <div className="relative flex items-center justify-between gap-1 px-1">
            <div
              aria-hidden
              className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-neutral-200 dark:bg-neutral-600 rounded-full"
            />
            {options.map((opt) => (
              <div key={opt.value} className="relative z-[1] flex flex-col items-center gap-1.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-sm">
                  {opt.label_tr}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-400 pt-1">{previewOnlyLabel}</p>
        </div>
      )}
    </div>
  );
}

interface FormFieldEditorProps {
  locale: string;
  fields: SiteApplicationFormFieldInput[];
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>;
  onAddField?: () => void;
  /** team | event — controls file size hint for team forms */
  formType?: 'team' | 'event';
}

export default function FormFieldEditor({
  locale,
  fields,
  setFields,
  onAddField,
  formType = 'team',
}: FormFieldEditorProps) {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const isEn = locale === 'en';
  const autoKeys = useMemo(() => new Set(fields.map((f) => f.field_key)), [fields]);
  const maxFileBytes = getMaxFileBytesForFormType(formType);
  const fileLimitLabel = formType === 'team' ? t.fileLimitTeam : t.fileLimitEvent;

  const handleLabelChange = (index: number, labelTr: string, field: SiteApplicationFormFieldInput) => {
    const patch: Partial<SiteApplicationFormFieldInput> = { label_tr: labelTr };
    // Only fill empty EN — do not rewrite field_key while typing (remounts inputs).
    if (!field.label_en?.trim() && labelTr.trim()) {
      patch.label_en = labelTr;
    }
    updateField(index, patch, setFields);
  };

  const syncFieldKeyFromLabel = (index: number, field: SiteApplicationFormFieldInput) => {
    const labelTr = field.label_tr?.trim();
    if (!labelTr) return;
    const looksAuto =
      !field.field_key ||
      field.field_key.startsWith('field_') ||
      field.field_key === fieldKeyFromLabel(field.label_tr || '', new Set());
    if (!looksAuto) return;
    const others = new Set(fields.filter((_, i) => i !== index).map((f) => f.field_key));
    updateField(index, { field_key: fieldKeyFromLabel(labelTr, others) }, setFields);
  };

  const handleTypeChange = (index: number, field: SiteApplicationFormFieldInput, nextType: SiteApplicationFieldType) => {
    const patch: Partial<SiteApplicationFormFieldInput> = { field_type: nextType };
    if (isOptionFieldType(nextType)) {
      if (!field.options?.length || !isOptionFieldType(field.field_type)) {
        patch.options = defaultOptionsForType(nextType);
      } else if (
        (nextType === 'linear_scale' || nextType === 'rating') &&
        field.field_type !== nextType
      ) {
        patch.options = defaultOptionsForType(nextType);
      }
    } else {
      patch.options = [];
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
        client_id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `new_${Date.now()}_${prev.length}`,
        field_key: `field_${prev.length + 1}`,
        field_type: 'text',
        label_tr: '',
        label_en: '',
        required: false,
        order_index: prev.length,
        options: [],
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
      <p className="text-xs text-neutral-500 dark:text-neutral-400 px-1">{t.localeHint}</p>
      {fields.map((field, index) => {
        const typeMeta = FIELD_TYPE_META[field.field_type] || FIELD_TYPE_META.text;
        const rowKey = field.client_id || `${field.field_key}-${index}`;

        return (
          <div
            key={rowKey}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 shadow-sm overflow-visible"
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-neutral-100 dark:border-neutral-700/80">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="space-y-1">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[#990000]/10 text-[#990000]">
                    {t.badgeTr}
                  </span>
                  <input
                    value={field.label_tr}
                    onChange={(e) => handleLabelChange(index, e.target.value, field)}
                    onBlur={() => syncFieldKeyFromLabel(index, field)}
                    placeholder={t.question}
                    className="w-full text-lg font-medium bg-transparent border-0 border-b border-transparent focus:border-[#990000] focus:outline-none pb-1 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                  />
                </div>
                <div className="space-y-1">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    {t.badgeEn}
                  </span>
                  <input
                    value={field.label_en}
                    onChange={(e) => updateField(index, { label_en: e.target.value }, setFields)}
                    placeholder={t.questionEn}
                    className="w-full text-sm bg-transparent border-0 border-b border-neutral-200 dark:border-neutral-600 focus:border-[#990000] focus:outline-none pb-1 text-neutral-600 dark:text-neutral-400 placeholder:text-neutral-400"
                  />
                </div>
              </div>
              <FieldTypePicker
                value={field.field_type}
                isEn={isEn}
                label={t.type}
                onChange={(nextType) => handleTypeChange(index, field, nextType)}
              />
            </div>

            <div className="px-5 py-4 space-y-4">
              {field.field_type === 'select' && (
                <ChoiceOptionsEditor
                  field={field}
                  index={index}
                  t={t}
                  autoKeys={autoKeys}
                  setFields={setFields}
                  variant="radio"
                />
              )}
              {field.field_type === 'checkbox' && (
                <ChoiceOptionsEditor
                  field={field}
                  index={index}
                  t={t}
                  autoKeys={autoKeys}
                  setFields={setFields}
                  variant="checkbox"
                />
              )}
              {field.field_type === 'dropdown' && (
                <ChoiceOptionsEditor
                  field={field}
                  index={index}
                  t={t}
                  autoKeys={autoKeys}
                  setFields={setFields}
                  variant="dropdown"
                />
              )}
              {field.field_type === 'linear_scale' && (
                <ScaleEditor
                  field={field}
                  index={index}
                  setFields={setFields}
                  hint={t.scaleHint}
                  variant="linear_scale"
                  previewOnlyLabel={t.previewOnly}
                  lowLabel={t.scaleLow}
                  highLabel={t.scaleHigh}
                />
              )}
              {field.field_type === 'rating' && (
                <ScaleEditor
                  field={field}
                  index={index}
                  setFields={setFields}
                  hint={t.ratingHint}
                  variant="rating"
                  previewOnlyLabel={t.previewOnly}
                  lowLabel={t.scaleLow}
                  highLabel={t.scaleHigh}
                />
              )}
              {field.field_type === 'file' && (
                <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 px-4 py-6 text-center text-sm text-neutral-400 space-y-2">
                  <CloudUpload className="w-6 h-6 mx-auto opacity-60" />
                  <p>{t.previewFile}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {fileLimitLabel}: {formatFileSize(maxFileBytes)}
                  </p>
                </div>
              )}
              {!isOptionFieldType(field.field_type) && field.field_type !== 'file' && (
                <input
                  disabled
                  placeholder={
                    field.field_type === 'textarea'
                      ? t.previewLong
                      : field.field_type === 'time'
                        ? '00:00'
                        : isEn
                          ? typeMeta.en
                          : typeMeta.tr
                  }
                  className="w-full rounded-lg border border-dashed border-neutral-200 dark:border-neutral-600 px-3 py-2.5 text-sm text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30"
                />
              )}

              {field.field_type !== 'file' &&
                field.field_type !== 'linear_scale' &&
                field.field_type !== 'rating' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      value={field.placeholder_tr || ''}
                      onChange={(e) =>
                        updateField(index, { placeholder_tr: e.target.value }, setFields)
                      }
                      placeholder={t.placeholder}
                      className="rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2 text-sm dark:bg-neutral-900"
                    />
                    <input
                      value={field.placeholder_en || ''}
                      onChange={(e) =>
                        updateField(index, { placeholder_en: e.target.value }, setFields)
                      }
                      placeholder={t.placeholderEn}
                      className="rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2 text-sm dark:bg-neutral-900"
                    />
                  </div>
                )}

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

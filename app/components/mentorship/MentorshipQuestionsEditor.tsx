'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  fieldKeyFromLabel,
  MENTORSHIP_QUESTION_TYPES,
  newQuestionId,
} from '@/app/lib/mentorship/questions';
import type {
  MentorshipApplicationQuestion,
  MentorshipQuestionType,
} from '@/app/types/mentorship';

const typeLabels: Record<MentorshipQuestionType, { tr: string; en: string }> = {
  text: { tr: 'Kısa yanıt', en: 'Short answer' },
  textarea: { tr: 'Uzun yanıt', en: 'Paragraph' },
  select: { tr: 'Açılır menü', en: 'Dropdown' },
  url: { tr: 'Web adresi', en: 'URL' },
  number: { tr: 'Sayı', en: 'Number' },
  checkbox: { tr: 'Çoklu seçim', en: 'Checkboxes' },
};

type Props = {
  locale: string;
  questions: MentorshipApplicationQuestion[];
  onChange: (next: MentorshipApplicationQuestion[]) => void;
};

function withOrder(
  list: MentorshipApplicationQuestion[]
): MentorshipApplicationQuestion[] {
  return list.map((q, index) => ({ ...q, order_index: index }));
}

export default function MentorshipQuestionsEditor({
  locale,
  questions,
  onChange,
}: Props) {
  const tr = locale === 'tr';
  const fieldClass =
    'w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm';
  const labelClass = 'block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300';

  const updateAt = (
    index: number,
    patch: Partial<MentorshipApplicationQuestion>
  ) => {
    onChange(
      withOrder(
        questions.map((q, i) => {
          if (i !== index) return q;
          const next = { ...q, ...patch };
          if (patch.label_tr != null && !q.field_key.startsWith('motivation') && !q.field_key.startsWith('goals') && !q.field_key.startsWith('experience')) {
            const keys = new Set(
              questions.filter((_, j) => j !== index).map((x) => x.field_key)
            );
            if (!patch.field_key) {
              next.field_key = fieldKeyFromLabel(next.label_tr || next.label_en, keys);
            }
          }
          return next;
        })
      )
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(withOrder(next));
  };

  const remove = (index: number) => {
    onChange(withOrder(questions.filter((_, i) => i !== index)));
  };

  const add = () => {
    const keys = new Set(questions.map((q) => q.field_key));
    const label = tr ? 'Yeni soru' : 'New question';
    onChange(
      withOrder([
        ...questions,
        {
          id: newQuestionId(),
          field_key: fieldKeyFromLabel(label, keys),
          field_type: 'textarea',
          label_tr: tr ? 'Yeni soru' : '',
          label_en: tr ? '' : 'New question',
          placeholder_tr: '',
          placeholder_en: '',
          required: false,
          order_index: questions.length,
          options: [],
        },
      ])
    );
  };

  const updateOption = (
    qIndex: number,
    optIndex: number,
    patch: Partial<{ value: string; label_tr: string; label_en: string }>
  ) => {
    const q = questions[qIndex];
    const options = [...(q.options || [])];
    options[optIndex] = { ...options[optIndex], ...patch };
    if (patch.label_tr && !patch.value) {
      options[optIndex].value = patch.label_tr
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_|_$/g, '') || `option_${optIndex + 1}`;
    }
    updateAt(qIndex, { options });
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {tr ? 'Başvuru soruları' : 'Application questions'}
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {tr
            ? 'myunilab.net başvuru formunda görünecek soruları buradan özelleştirin. Ad, soyad ve e-posta her zaman istenir.'
            : 'Customize questions shown on the myunilab.net application form. First name, last name and email are always required.'}
        </p>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4 border border-dashed rounded-xl text-center">
          {tr
            ? 'Henüz özel soru yok. Soru ekleyin veya varsayılanları kullanın.'
            : 'No custom questions yet. Add questions or use the defaults.'}
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => {
            const needsOptions =
              q.field_type === 'select' || q.field_type === 'checkbox';
            return (
              <div
                key={q.id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-medium text-neutral-500">
                    {tr ? `Soru ${index + 1}` : `Question ${index + 1}`}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
                      title={tr ? 'Yukarı' : 'Up'}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === questions.length - 1}
                      onClick={() => move(index, 1)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
                      title={tr ? 'Aşağı' : 'Down'}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title={tr ? 'Sil' : 'Remove'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      {tr ? 'Soru metni (TR)' : 'Question (TR)'}
                    </label>
                    <input
                      className={fieldClass}
                      value={q.label_tr}
                      onChange={(e) => updateAt(index, { label_tr: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {tr ? 'Soru metni (EN)' : 'Question (EN)'}
                    </label>
                    <input
                      className={fieldClass}
                      value={q.label_en}
                      onChange={(e) => updateAt(index, { label_en: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>
                      {tr ? 'Soru türü' : 'Question type'}
                    </label>
                    <select
                      className={fieldClass}
                      value={q.field_type}
                      onChange={(e) => {
                        const field_type = e.target.value as MentorshipQuestionType;
                        updateAt(index, {
                          field_type,
                          options:
                            field_type === 'select' || field_type === 'checkbox'
                              ? q.options?.length
                                ? q.options
                                : [
                                    {
                                      value: 'secenek_1',
                                      label_tr: 'Seçenek 1',
                                      label_en: 'Option 1',
                                    },
                                  ]
                              : [],
                        });
                      }}
                    >
                      {MENTORSHIP_QUESTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {typeLabels[type][tr ? 'tr' : 'en']}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {tr ? 'Yardımcı metin (TR)' : 'Placeholder (TR)'}
                    </label>
                    <input
                      className={fieldClass}
                      value={q.placeholder_tr || ''}
                      onChange={(e) =>
                        updateAt(index, { placeholder_tr: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) =>
                          updateAt(index, { required: e.target.checked })
                        }
                      />
                      {tr ? 'Zorunlu' : 'Required'}
                    </label>
                  </div>
                </div>

                {needsOptions && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {tr ? 'Seçenekler' : 'Options'}
                    </div>
                    {(q.options || []).map((opt, optIndex) => (
                      <div key={`${q.id}_${optIndex}`} className="flex gap-2">
                        <input
                          className={fieldClass}
                          placeholder={tr ? 'Seçenek (TR)' : 'Option (TR)'}
                          value={opt.label_tr}
                          onChange={(e) =>
                            updateOption(index, optIndex, {
                              label_tr: e.target.value,
                            })
                          }
                        />
                        <input
                          className={fieldClass}
                          placeholder={tr ? 'Seçenek (EN)' : 'Option (EN)'}
                          value={opt.label_en}
                          onChange={(e) =>
                            updateOption(index, optIndex, {
                              label_en: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="px-2 text-red-600"
                          onClick={() =>
                            updateAt(index, {
                              options: (q.options || []).filter(
                                (_, i) => i !== optIndex
                              ),
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-sm text-[#990000] hover:underline"
                      onClick={() =>
                        updateAt(index, {
                          options: [
                            ...(q.options || []),
                            {
                              value: `secenek_${(q.options?.length || 0) + 1}`,
                              label_tr: `Seçenek ${(q.options?.length || 0) + 1}`,
                              label_en: `Option ${(q.options?.length || 0) + 1}`,
                            },
                          ],
                        })
                      }
                    >
                      {tr ? '+ Seçenek ekle' : '+ Add option'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm"
      >
        <Plus className="w-4 h-4" />
        {tr ? 'Soru ekle' : 'Add question'}
      </button>
    </section>
  );
}

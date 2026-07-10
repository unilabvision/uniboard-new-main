import type {
  PublicSiteApplicationForm,
  SiteApplicationForm,
  SiteApplicationFormField,
  SiteApplicationFormFieldOption,
} from '@/app/types/siteApplicationForms';

export function normalizeFieldOptions(options: unknown): SiteApplicationFormFieldOption[] {
  if (!options) return [];

  if (typeof options === 'string') {
    const trimmed = options.trim();
    if (!trimmed) return [];
    try {
      return normalizeFieldOptions(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }

  if (!Array.isArray(options)) return [];

  return options
    .map((opt) => {
      if (typeof opt === 'string') {
        const value = opt.trim();
        if (!value) return null;
        return { value, label_tr: value, label_en: value };
      }
      if (opt && typeof opt === 'object') {
        const row = opt as Record<string, unknown>;
        const value = String(row.value ?? '').trim();
        if (!value) return null;
        const labelTr = String(row.label_tr ?? row.label ?? value).trim() || value;
        const labelEn = String(row.label_en ?? row.label ?? labelTr).trim() || value;
        return { value, label_tr: labelTr, label_en: labelEn };
      }
      return null;
    })
    .filter((opt): opt is SiteApplicationFormFieldOption => opt !== null);
}

export function toPublicForm(
  form: SiteApplicationForm,
  fields: SiteApplicationFormField[],
  locale: string
): PublicSiteApplicationForm {
  const isEn = locale === 'en';
  const slug = isEn ? form.slug_en : form.slug_tr;

  return {
    id: form.id,
    slug,
    title: isEn ? form.title_en : form.title_tr,
    subtitle: isEn ? form.subtitle_en : form.subtitle_tr,
    success_message: isEn ? form.success_message_en : form.success_message_tr,
    allows_attachment: form.allows_attachment,
    fields: [...fields]
      .sort((a, b) => a.order_index - b.order_index)
      .map((field) => ({
        field_key: field.field_key,
        field_type: field.field_type,
        label: isEn ? field.label_en : field.label_tr,
        placeholder: isEn ? field.placeholder_en : field.placeholder_tr,
        required: field.required,
        order_index: field.order_index,
        options: normalizeFieldOptions(field.options).map((opt) => ({
          value: opt.value,
          label: isEn ? opt.label_en : opt.label_tr,
        })),
      })),
  };
}

export function getFormSlugForLocale(form: SiteApplicationForm, locale: string): string {
  return locale === 'en' ? form.slug_en : form.slug_tr;
}

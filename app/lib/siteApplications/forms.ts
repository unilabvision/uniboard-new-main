import type {
  PublicSiteApplicationForm,
  SiteApplicationForm,
  SiteApplicationFormField,
} from '@/app/types/siteApplicationForms';

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
        options: (field.options || []).map((opt) => ({
          value: opt.value,
          label: isEn ? opt.label_en : opt.label_tr,
        })),
      })),
  };
}

export function getFormSlugForLocale(form: SiteApplicationForm, locale: string): string {
  return locale === 'en' ? form.slug_en : form.slug_tr;
}

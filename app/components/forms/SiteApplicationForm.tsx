'use client';

import DynamicSiteApplicationForm from './DynamicSiteApplicationForm';

type LegacyApplicationType = 'event' | 'team';

interface SiteApplicationFormProps {
  locale: string;
  applicationType: LegacyApplicationType;
}

const LEGACY_SLUGS: Record<LegacyApplicationType, { tr: string; en: string }> = {
  event: { tr: 'etkinlik-basvuru', en: 'event-application' },
  team: { tr: 'ekip-basvuru', en: 'team-application' },
};

/**
 * @deprecated DynamicSiteApplicationForm + panelden yapılandırılan formları kullanın.
 * Eski event/team sayfaları için geriye dönük uyumluluk sarmalayıcısı.
 */
export default function SiteApplicationForm({
  locale,
  applicationType,
}: SiteApplicationFormProps) {
  const slug =
    locale === 'en'
      ? LEGACY_SLUGS[applicationType].en
      : LEGACY_SLUGS[applicationType].tr;

  return <DynamicSiteApplicationForm locale={locale} formSlug={slug} />;
}

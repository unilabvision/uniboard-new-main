'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import type { CertificateIssuanceKind } from '@/app/lib/certificates/issuance';
import { buildIssuanceCertificateFields } from '@/app/lib/certificates/issuanceFields';
import {
  generateDashboardPreviewCanvas,
} from '@/utils/dashboardCertificateGenerator';
import type { TemplateDesignSettings } from '@/utils/certificateCanvasRenderer';

export type CertificateIssuancePreviewTemplate = {
  id: number;
  name: string;
  description: string | null;
  background_image: string;
  organization_slug: string;
  is_default: boolean;
  design_settings: string | TemplateDesignSettings;
  created_at: string;
  updated_at: string;
};

type CertificateIssuancePreviewProps = {
  template: CertificateIssuancePreviewTemplate | null;
  kind: CertificateIssuanceKind;
  locale: 'tr' | 'en';
  recipientName: string;
  sourceName: string;
  organizationName: string;
  certificateTitle?: string | null;
  description: string;
  instructor: string;
  duration: string;
};

export default function CertificateIssuancePreview({
  template,
  kind,
  locale,
  recipientName,
  sourceName,
  organizationName,
  certificateTitle,
  description,
  instructor,
  duration,
}: CertificateIssuancePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const certificateFields = useMemo(
    () =>
      buildIssuanceCertificateFields({
        kind,
        locale,
        recipientName: recipientName || (locale === 'en' ? 'Sample Recipient' : 'Örnek Katılımcı'),
        sourceName: sourceName || (locale === 'en' ? 'Course or event' : 'Kurs veya etkinlik'),
        certificateTitle,
        description,
        instructor,
        duration,
        templateId: template?.id || 0,
        organizationSlug: template?.organization_slug || '',
      }),
    [
      certificateTitle,
      description,
      duration,
      instructor,
      kind,
      locale,
      recipientName,
      sourceName,
      template,
    ]
  );

  useEffect(() => {
    if (!template?.background_image || !canvasRef.current) return;

    let isCurrent = true;
    const renderPreview = async () => {
      setIsRendering(true);
      setPreviewError(null);

      try {
        const rendered = await generateDashboardPreviewCanvas(
          {
            id: 0,
            ...certificateFields,
            certificatenumber: 'PREVIEW-001',
            issuedate: new Date().toISOString(),
            organization: organizationName,
          },
          template,
          1200,
          850
        );

        if (!isCurrent || !canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        if (!context) return;
        canvasRef.current.width = rendered.width;
        canvasRef.current.height = rendered.height;
        context.drawImage(rendered, 0, 0);
      } catch (error) {
        if (!isCurrent) return;
        setPreviewError(error instanceof Error ? error.message : 'Preview failed');
      } finally {
        if (isCurrent) setIsRendering(false);
      }
    };

    const timeoutId = window.setTimeout(() => void renderPreview(), 160);
    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    certificateFields,
    organizationName,
    template,
  ]);

  const title = locale === 'en' ? 'Certificate preview' : 'Sertifika önizlemesi';

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950/40">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#990000]" />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
        </div>
        {isRendering && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />}
      </div>

      <div className="p-3 sm:p-4">
        {!template ? (
          <div className="flex aspect-[24/17] items-center justify-center rounded-lg border border-dashed border-neutral-300 px-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            {locale === 'en'
              ? 'Select a template to preview the certificate.'
              : 'Sertifikayı önizlemek için bir şablon seçin.'}
          </div>
        ) : previewError ? (
          <div className="flex aspect-[24/17] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
            {locale === 'en' ? 'The preview could not be generated.' : 'Önizleme oluşturulamadı.'}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            aria-label={title}
            className="block aspect-[24/17] h-auto w-full rounded-lg bg-white shadow-sm"
          />
        )}
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          {locale === 'en'
            ? 'The first selected recipient is used as the sample. Description, duration, instructor and template match the bulk send.'
            : 'Örnek olarak seçili ilk alıcı kullanılır. Açıklama, süre, eğitmen ve şablon toplu gönderimle aynıdır.'}
        </p>
      </div>
    </section>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { generateDashboardCertificatePreview } from '@/utils/dashboardCertificateGenerator';

type PreviewFormLike = {
  background_image?: string;
  design_settings?: unknown;
  name?: string;
  organization_slug?: string;
  id?: number;
  is_default?: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

/**
 * Tüm sertifika şablon editörlerinde ortak canlı canvas önizleme.
 * Slider / font değişikliklerinde debounce ile yeniden çizer.
 */
export function useLiveCertificatePreview(
  formData: PreviewFormLike,
  options?: {
    locale?: string;
    aspectRatio?: number;
    debounceMs?: number;
    /** Dahili render genişliği — küçük fontlu şablonlar için okunabilirlik */
    renderWidth?: number;
  }
) {
  const locale = options?.locale || 'tr';
  const aspectRatio = options?.aspectRatio || 4 / 3;
  const debounceMs = options?.debounceMs ?? 180;
  const renderWidth = options?.renderWidth ?? 1200;

  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busyRef = useRef(false);
  const queuedRef = useRef(false);
  const formDataRef = useRef(formData);
  const aspectRef = useRef(aspectRatio);

  formDataRef.current = formData;
  aspectRef.current = aspectRatio;

  const generatePreview = useCallback(async () => {
    const current = formDataRef.current;
    if (!current?.background_image) return;

    if (busyRef.current) {
      queuedRef.current = true;
      return;
    }

    busyRef.current = true;
    setIsGeneratingPreview(true);
    try {
      const height = Math.round(renderWidth / (aspectRef.current || 4 / 3));
      const canvas = await generateDashboardCertificatePreview(
        current,
        renderWidth,
        height,
        locale
      );
      setPreviewCanvas(canvas);

      if (canvasRef.current && canvas) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      }
    } catch (error) {
      console.error('Preview generation error:', error);
    } finally {
      busyRef.current = false;
      setIsGeneratingPreview(false);
      if (queuedRef.current) {
        queuedRef.current = false;
        setTimeout(() => {
          void generatePreview();
        }, 0);
      }
    }
  }, [locale, renderWidth]);

  useEffect(() => {
    if (!formData.background_image) return;
    const timeoutId = setTimeout(() => {
      void generatePreview();
    }, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [
    formData.background_image,
    formData.design_settings,
    formData.name,
    formData.organization_slug,
    aspectRatio,
    debounceMs,
    generatePreview,
  ]);

  return {
    canvasRef,
    previewCanvas,
    isGeneratingPreview,
    generatePreview,
  };
}

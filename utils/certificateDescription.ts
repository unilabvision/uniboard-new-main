export interface CertificateDescriptionInput {
  courseName: string;
  instructor?: string;
  organization?: string;
  duration?: string;
  customPrompt?: string;
  language?: 'tr' | 'en';
}

export function buildCertificateDescriptionPrompt(input: CertificateDescriptionInput): string {
  const {
    courseName,
    instructor,
    organization,
    duration,
    customPrompt,
    language = 'tr',
  } = input;

  const provider = instructor || organization || (language === 'tr' ? 'Kurum' : 'Organization');
  const durationLine = duration?.trim()
    ? language === 'tr'
      ? `- Program süresi: "${duration}"`
      : `- Duration: "${duration}"`
    : '';

  if (customPrompt?.trim()) {
    return language === 'tr'
      ? `Bir sertifika için eksiksiz ve tam bir açıklama metni yaz.

ETKİNLİK BİLGİLERİ:
- Etkinlik/Kurs adı: "${courseName}"
- Eğitmen/Organizatör: "${provider}"
${durationLine}

ÖZEL TALİMAT:
${customPrompt.trim()}

KURALLAR:
- Türkçe yaz
- 2-3 tam cümle kullan (yaklaşık 200-400 karakter)
- Cümleyi yarıda kesme; metin nokta ile bitsin
- Profesyonel ve resmi dil kullan
- Sadece açıklama metnini döndür; başlık, tırnak veya ek yorum ekleme`
      : `Write a complete certificate description.

EVENT DETAILS:
- Course/Event: "${courseName}"
- Instructor/Organization: "${provider}"
${durationLine}

CUSTOM INSTRUCTION:
${customPrompt.trim()}

RULES:
- Write in English
- Use 2-3 complete sentences (about 200-400 characters)
- Do not cut off mid-sentence; end with a period
- Return only the description text`;
  }

  return language === 'tr'
    ? `Bir sertifika üzerinde görünecek eksiksiz açıklama metni yaz.

ETKİNLİK BİLGİLERİ:
- Etkinlik/Kurs adı: "${courseName}"
- Eğitmen/Organizatör: "${provider}"
${durationLine}

KURALLAR:
- Türkçe, resmi ve profesyonel dil
- 2-3 tam cümle yaz (yaklaşık 200-350 karakter)
- Kurs adını açıklamaya doğal şekilde dahil et
- "başarıyla tamamlayarak", "hak kazanmıştır" veya "elde etmiştir" ifadelerinden birini kullan
- Cümleyi asla yarıda kesme; her cümle nokta ile bitsin
- Sadece açıklama metnini döndür

Örnek yapı:
"[Kurs adı] kapsamında gerekli eğitimleri başarıyla tamamlayarak ilgili alanda yetkinlik kazanmıştır. Bu sertifika, program süresince edinilen bilgi ve becerileri belgelemektedir."`
    : `Write a complete certificate description to appear on the certificate.

EVENT DETAILS:
- Course/Event: "${courseName}"
- Instructor/Organization: "${provider}"
${durationLine}

RULES:
- Professional formal English
- 2-3 complete sentences (about 200-350 characters)
- Naturally include the course name
- Never cut off mid-sentence; end with a period
- Return only the description text`;
}

export function cleanCertificateDescription(raw: string): string {
  let text = raw.trim();

  text = text.replace(/^```(?:json|text)?\s*/i, '').replace(/\s*```$/i, '').trim();
  text = text.replace(/^["'«“]([\s\S]*)["'»”]$/, '$1').trim();
  text = text.replace(/^(açıklama|sertifika açıklaması|description)\s*:\s*/i, '').trim();
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export function isLikelyTruncatedDescription(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 40) return false;
  return !/[.!?…]"?$/.test(trimmed);
}

export function buildCertificateDescriptionRetryPrompt(
  input: CertificateDescriptionInput,
  partialText: string
): string {
  const basePrompt = buildCertificateDescriptionPrompt(input);
  return `${basePrompt}

ÖNEMLİ: Önceki deneme yarım kaldı: "${partialText}"
Lütfen aynı sertifika için baştan, TAM ve eksiksiz açıklamayı yeniden yaz.`;
}

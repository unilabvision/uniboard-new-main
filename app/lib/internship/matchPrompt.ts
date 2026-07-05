import type { ApplicationMatchResult } from '@/app/types/internship';

export function buildCvMatchPrompt(input: {
  jobTitle: string;
  jobRequirements: string;
  requiredKeywords: string[];
  preferredKeywords: string[];
  applicantName: string;
  position: string;
  motivation: string;
  communication?: string;
  teamExperience?: string;
  cvText?: string;
  extractedSkills?: string[];
}): string {
  const skillsLine =
    input.extractedSkills?.length ?
      `Aday anahtar kelimeleri: ${input.extractedSkills.join(', ')}`
    : '';

  return `Sen bir İK uzmanı yapay zeka asistanısın. Aşağıdaki staj/iş başvurusunu ilan gereksinimlerine göre değerlendir.

İLAN BAŞLIĞI: ${input.jobTitle}

İLAN GEREKSİNİMLERİ:
${input.jobRequirements}

ZORUNLU ANAHTAR KELİMELER: ${input.requiredKeywords.join(', ') || 'Belirtilmemiş'}
TERCİH EDİLEN ANAHTAR KELİMELER: ${input.preferredKeywords.join(', ') || 'Belirtilmemiş'}

ADAY: ${input.applicantName}
BAŞVURDUĞU POZİSYON: ${input.position}

MOTİVASYON:
${input.motivation}

İLETİŞİM:
${input.communication || '—'}

TAKIM DENEYİMİ:
${input.teamExperience || '—'}

CV METNİ:
${input.cvText || 'CV metni henüz çıkarılmadı — motivasyon ve başvuru metnini kullan.'}

${skillsLine}

Yanıtını YALNIZCA geçerli JSON olarak ver, başka metin ekleme:
{
  "match_score": <0-100 arası sayı>,
  "matched_keywords": ["eşleşen kelimeler"],
  "missing_keywords": ["eksik zorunlu/tercih kelimeler"],
  "summary": "2-3 cümle özet",
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "risks": ["risk veya eksik 1"],
  "recommendation": "strong_fit|good_fit|partial_fit|weak_fit"
}`;
}

export function parseMatchResponse(raw: string): ApplicationMatchResult | null {
  try {
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as ApplicationMatchResult;
    if (typeof parsed.match_score !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

import type {
  ApplicationMatchResult,
  CandidateProfile,
  JobProfile,
  MatchAgentStep,
} from '@/app/types/internship';

export type GenerateTextFn = (prompt: string, maxTokens?: number) => Promise<string>;

export interface MatchAgentInput {
  locale: string;
  applicantName: string;
  position: string;
  motivation: string;
  communication?: string;
  teamExperience?: string;
  cvFileName?: string;
  jobTitle: string;
  jobRequirements: string;
  requiredKeywords: string[];
  preferredKeywords: string[];
  careerTags: string[];
}

function parseJsonBlock<T>(raw: string): T | null {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function tr(locale: string) {
  return locale === 'tr';
}

function keywordOverlap(required: string[], profile: CandidateProfile): string[] {
  const haystack = [
    ...profile.skills,
    ...profile.soft_skills,
    profile.experience_summary,
    ...profile.education,
  ]
    .join(' ')
    .toLowerCase();

  return required.filter((kw) => haystack.includes(kw.toLowerCase()));
}

/** Adım 1 — Aday profili çıkarımı */
async function stepExtractProfile(
  input: MatchAgentInput,
  generateText: GenerateTextFn
): Promise<{ step: MatchAgentStep; profile: CandidateProfile | null }> {
  const isTr = tr(input.locale);
  const prompt = isTr
    ? `Sen bir İK AI ajanısın. Görev: aday profilini yapılandırılmış JSON olarak çıkar.

ADAY: ${input.applicantName}
POZİSYON: ${input.position}
${input.cvFileName ? `CV DOSYASI: ${input.cvFileName} (metin yok — başvuru alanlarını kullan)` : ''}

MOTİVASYON:
${input.motivation || '—'}

İLETİŞİM:
${input.communication || '—'}

TAKIM DENEYİMİ:
${input.teamExperience || '—'}

Yanıt YALNIZCA JSON:
{
  "skills": ["teknik/yumuşak beceri"],
  "education": ["eğitim bilgisi"],
  "experience_summary": "1-2 cümle deneyim özeti",
  "soft_skills": ["iletişim", "takım çalışması"],
  "years_signal": "junior|mid|senior|unknown",
  "highlights": ["öne çıkan nokta"]
}`
    : `You are an HR AI agent. Extract a structured candidate profile as JSON only.

CANDIDATE: ${input.applicantName}
POSITION: ${input.position}

MOTIVATION: ${input.motivation || '—'}
COMMUNICATION: ${input.communication || '—'}
TEAM: ${input.teamExperience || '—'}

JSON only:
{
  "skills": [],
  "education": [],
  "experience_summary": "",
  "soft_skills": [],
  "years_signal": "junior|mid|senior|unknown",
  "highlights": []
}`;

  const raw = await generateText(prompt, 900);
  const profile = parseJsonBlock<CandidateProfile>(raw);

  return {
    step: {
      id: 'extract_profile',
      label: isTr ? 'Aday profili çıkarılıyor' : 'Extracting candidate profile',
      status: profile ? 'done' : 'error',
      detail: profile?.experience_summary?.slice(0, 120),
    },
    profile,
  };
}

/** Adım 2 — İlan / rol profili */
async function stepBuildJobProfile(
  input: MatchAgentInput,
  generateText: GenerateTextFn
): Promise<{ step: MatchAgentStep; jobProfile: JobProfile | null }> {
  const isTr = tr(input.locale);
  const prompt = isTr
    ? `Sen bir İK AI ajanısın. İlan gereksinimlerini analiz et.

BAŞLIK: ${input.jobTitle}
GEREKSİNİMLER:
${input.jobRequirements}

ZORUNLU ETİKETLER: ${input.requiredKeywords.join(', ') || '—'}
TERCİH ETİKETLER: ${input.preferredKeywords.join(', ') || '—'}
KARİYER ETİKETLERİ (DB): ${input.careerTags.join(', ') || '—'}

JSON yanıt:
{
  "role_summary": "rol özeti",
  "required_skills": ["zorunlu"],
  "nice_to_have": ["tercih"],
  "culture_signals": ["beklenen özellik"],
  "deal_breakers": ["kritik eksiklik sinyali"]
}`
    : `Analyze job requirements as HR AI agent. JSON only:
{
  "role_summary": "",
  "required_skills": [],
  "nice_to_have": [],
  "culture_signals": [],
  "deal_breakers": []
}

TITLE: ${input.jobTitle}
REQUIREMENTS: ${input.jobRequirements}
REQUIRED: ${input.requiredKeywords.join(', ')}
PREFERRED: ${input.preferredKeywords.join(', ')}`;

  const raw = await generateText(prompt, 800);
  const jobProfile = parseJsonBlock<JobProfile>(raw);

  return {
    step: {
      id: 'build_job_profile',
      label: isTr ? 'İlan profili oluşturuluyor' : 'Building job profile',
      status: jobProfile ? 'done' : 'error',
      detail: jobProfile?.role_summary?.slice(0, 120),
    },
    jobProfile,
  };
}

/** Adım 3 — Eşleştirme ve HR önerisi */
async function stepFinalMatch(
  input: MatchAgentInput,
  generateText: GenerateTextFn,
  profile: CandidateProfile,
  jobProfile: JobProfile,
  preMatched: string[]
): Promise<{ step: MatchAgentStep; match: ApplicationMatchResult | null }> {
  const isTr = tr(input.locale);
  const prompt = isTr
    ? `Sen otonom bir İK eşleştirme ajanısın. Aday ve ilanı karşılaştır; nihai kararı ver.

ADAY PROFİLİ:
${JSON.stringify(profile, null, 2)}

İLAN PROFİLİ:
${JSON.stringify(jobProfile, null, 2)}

ÖN HESAPLANAN EŞLEŞEN ETİKETLER: ${preMatched.join(', ') || 'yok'}

Kurallar:
- match_score 0-100 (gerçekçi)
- recommendation: strong_fit|good_fit|partial_fit|weak_fit
- Mülakat soruları role özel olsun
- next_actions: İK için 2-3 somut adım

JSON:
{
  "match_score": 0,
  "matched_keywords": [],
  "missing_keywords": [],
  "summary": "",
  "strengths": [],
  "risks": [],
  "recommendation": "good_fit",
  "confidence": 0.85,
  "interview_questions": ["soru1"],
  "next_actions": ["adım1"],
  "agent_reasoning": "kısa gerekçe"
}`
    : `Autonomous HR matching agent. Compare candidate vs job. JSON only with match_score, matched_keywords, missing_keywords, summary, strengths, risks, recommendation, confidence (0-1), interview_questions, next_actions, agent_reasoning.

CANDIDATE: ${JSON.stringify(profile)}
JOB: ${JSON.stringify(jobProfile)}
PRE-MATCHED: ${preMatched.join(', ')}`;

  const raw = await generateText(prompt, 1400);
  const match = parseJsonBlock<ApplicationMatchResult>(raw);

  return {
    step: {
      id: 'final_match',
      label: isTr ? 'Eşleştirme ve öneri' : 'Matching & recommendation',
      status: match ? 'done' : 'error',
      detail: match?.agent_reasoning?.slice(0, 120),
    },
    match,
  };
}

/** Çok adımlı agentic eşleştirme — yeni tablo yok, yalnızca API yanıtı */
export async function runMatchAgent(
  input: MatchAgentInput,
  generateText: GenerateTextFn
): Promise<{
  match: ApplicationMatchResult | null;
  agentSteps: MatchAgentStep[];
  candidateProfile?: CandidateProfile;
  jobProfile?: JobProfile;
}> {
  const agentSteps: MatchAgentStep[] = [];

  const { step: s1, profile } = await stepExtractProfile(input, generateText);
  agentSteps.push(s1);
  if (!profile) {
    return { match: null, agentSteps, candidateProfile: undefined, jobProfile: undefined };
  }

  const { step: s2, jobProfile } = await stepBuildJobProfile(input, generateText);
  agentSteps.push(s2);
  if (!jobProfile) {
    return { match: null, agentSteps, candidateProfile: profile, jobProfile: undefined };
  }

  const preMatched = keywordOverlap(
    [...input.requiredKeywords, ...input.preferredKeywords],
    profile
  );

  agentSteps.push({
    id: 'keyword_overlap',
    label: tr(input.locale) ? 'Etiket ön eşleştirmesi' : 'Keyword pre-match',
    status: 'done',
    detail: preMatched.length
      ? preMatched.join(', ')
      : tr(input.locale)
        ? 'Doğrudan eşleşme yok'
        : 'No direct overlap',
  });

  const { step: s3, match } = await stepFinalMatch(
    input,
    generateText,
    profile,
    jobProfile,
    preMatched
  );
  agentSteps.push(s3);

  if (!match) {
    return { match: null, agentSteps, candidateProfile: profile, jobProfile };
  }

  const enriched: ApplicationMatchResult = {
    ...match,
    agent_steps: agentSteps,
    candidate_profile: profile,
    job_profile: jobProfile,
    pre_matched_keywords: preMatched,
  };

  return {
    match: enriched,
    agentSteps,
    candidateProfile: profile,
    jobProfile,
  };
}

export { parseJsonBlock };

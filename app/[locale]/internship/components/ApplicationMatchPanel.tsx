'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Tag,
  Bot,
  CheckCircle2,
  Circle,
  MessageSquare,
  ListChecks,
  Brain,
  Briefcase,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { ApplicationMatchResult, CareerTag, MatchAgentStep } from '@/app/types/internship';
import { keywordsFromPosition } from '@/app/lib/internship/permissions';
import { internshipDb, getCareerTagLabel } from '@/app/lib/internship/config';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || '',
});

const AGENT_STEP_LABELS: Record<string, { tr: string; en: string }> = {
  extract_profile: { tr: 'Aday profili çıkarılıyor', en: 'Extracting candidate profile' },
  build_job_profile: { tr: 'İlan profili oluşturuluyor', en: 'Building job profile' },
  keyword_overlap: { tr: 'Etiket ön eşleştirmesi', en: 'Keyword pre-match' },
  final_match: { tr: 'Eşleştirme ve öneri', en: 'Matching & recommendation' },
};

interface ApplicationMatchPanelProps {
  applicationId: string;
  locale: string;
  position?: string | null;
  motivation?: string;
}

export default function ApplicationMatchPanel({
  applicationId,
  locale,
  position,
}: ApplicationMatchPanelProps) {
  const [requiredKeywords, setRequiredKeywords] = useState('');
  const [preferredKeywords, setPreferredKeywords] = useState('');
  const [careerTags, setCareerTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<ApplicationMatchResult | null>(null);
  const [liveSteps, setLiveSteps] = useState<MatchAgentStep[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showAgentTrace, setShowAgentTrace] = useState(false);

  const tr = locale === 'tr';

  const t = tr
    ? {
        title: 'AI Agent — Aday Eşleştirme',
        subtitle: '3 aşamalı otonom analiz · myuni_career_tags + başvuru',
        required: 'Zorunlu anahtar kelimeler',
        preferred: 'Tercih edilen kelimeler',
        analyze: 'Agent Analizini Başlat',
        analyzing: 'Agent çalışıyor…',
        score: 'Uyum Skoru',
        confidence: 'Güven',
        matched: 'Eşleşen',
        missing: 'Eksik',
        strengths: 'Güçlü Yönler',
        risks: 'Dikkat',
        positionHint: 'Pozisyon',
        tagsFromDb: 'Kariyer etiketleri (tıkla ekle)',
        agentTrace: 'Agent adımları',
        reasoning: 'Agent gerekçesi',
        interview: 'Önerilen mülakat soruları',
        nextActions: 'İK sonraki adımlar',
        candidateProfile: 'Çıkarılan aday profili',
        jobProfile: 'İlan profili',
        skills: 'Beceriler',
        highlights: 'Öne çıkanlar',
        showDetails: 'Detayları göster',
        hideDetails: 'Detayları gizle',
        stepsDone: 'adım tamamlandı',
        showSteps: 'Agent adımlarını göster',
        hideSteps: 'Agent adımlarını gizle',
      }
    : {
        title: 'AI Agent — Candidate Matching',
        subtitle: '3-step autonomous analysis · career tags + application',
        required: 'Required keywords',
        preferred: 'Preferred keywords',
        analyze: 'Start Agent Analysis',
        analyzing: 'Agent running…',
        score: 'Match Score',
        confidence: 'Confidence',
        matched: 'Matched',
        missing: 'Missing',
        strengths: 'Strengths',
        risks: 'Risks',
        positionHint: 'Position',
        tagsFromDb: 'Career tags (click to add)',
        agentTrace: 'Agent steps',
        reasoning: 'Agent reasoning',
        interview: 'Suggested interview questions',
        nextActions: 'HR next actions',
        candidateProfile: 'Extracted candidate profile',
        jobProfile: 'Job profile',
        skills: 'Skills',
        highlights: 'Highlights',
        showDetails: 'Show details',
        hideDetails: 'Hide details',
        stepsDone: 'steps completed',
        showSteps: 'Show agent steps',
        hideSteps: 'Hide agent steps',
      };

  const stepOrder = ['extract_profile', 'build_job_profile', 'keyword_overlap', 'final_match'];

  useEffect(() => {
    const fromPosition = keywordsFromPosition(position ?? '').join(', ');
    setRequiredKeywords(fromPosition);

    supabase
      .from(internshipDb.careerTags)
      .select('id, slug, name, created_at')
      .then(({ data }) => {
        if (data) {
          setCareerTags(
            (data as CareerTag[]).map((tag) => getCareerTagLabel(tag, locale))
          );
        }
      });
  }, [position, locale]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, stepOrder.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const addTag = (tag: string) => {
    setPreferredKeywords((prev) => {
      const list = prev ? prev.split(',').map((s) => s.trim()) : [];
      if (list.includes(tag)) return prev;
      return [...list, tag].join(', ');
    });
  };

  const parseList = (value: string) =>
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const runMatch = async () => {
    setLoading(true);
    setError(null);
    setMatch(null);
    setShowDetails(false);
    setShowAgentTrace(true);
    setLiveSteps(stepOrder.map((id) => ({
      id,
      label: tr ? AGENT_STEP_LABELS[id].tr : AGENT_STEP_LABELS[id].en,
      status: 'running' as const,
    })));
    setActiveStep(0);

    try {
      const response = await fetch('/api/internship/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          locale,
          job: {
            title: position?.trim() || (tr ? 'Staj Pozisyonu' : 'Internship Position'),
            requirements: position?.trim() || '',
            requiredKeywords: parseList(requiredKeywords),
            preferredKeywords: parseList(preferredKeywords),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Match failed');
      setMatch(data.match);
      setLiveSteps(data.match?.agent_steps || data.agentSteps || []);
      setShowAgentTrace(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setLiveSteps((prev) =>
        prev.map((s) => ({ ...s, status: s.status === 'running' ? 'error' : s.status }))
      );
    } finally {
      setLoading(false);
    }
  };

  const recLabels = tr
    ? {
        strong_fit: 'Çok Uygun',
        good_fit: 'Uygun',
        partial_fit: 'Kısmen Uygun',
        weak_fit: 'Zayıf Uyum',
      }
    : {
        strong_fit: 'Strong Fit',
        good_fit: 'Good Fit',
        partial_fit: 'Partial Fit',
        weak_fit: 'Weak Fit',
      };

  const displaySteps = match?.agent_steps?.length ? match.agent_steps : liveSteps;
  const stepsDoneCount = displaySteps.filter((s) => s.status === 'done').length;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 sm:p-5 w-full min-w-0 flex flex-col max-h-[min(720px,calc(100vh-8rem))]">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[#990000]/10">
          <Bot className="w-5 h-5 text-[#990000]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.subtitle}</p>
        </div>
      </div>

      <p className="text-sm mb-3 flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
        <Tag className="w-4 h-4" />
        {t.positionHint}: <strong>{position?.trim() || (tr ? 'Belirtilmemiş' : 'Not specified')}</strong>
      </p>

      {careerTags.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-neutral-500 mb-2">{t.tagsFromDb}</p>
          <div className="flex flex-wrap gap-1">
            {careerTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-[#990000]/10"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4">
        <input
          type="text"
          value={requiredKeywords}
          onChange={(e) => setRequiredKeywords(e.target.value)}
          placeholder={t.required}
          className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-neutral-900 dark:border-neutral-600"
        />
        <input
          type="text"
          value={preferredKeywords}
          onChange={(e) => setPreferredKeywords(e.target.value)}
          placeholder={t.preferred}
          className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-neutral-900 dark:border-neutral-600"
        />
        <button
          type="button"
          onClick={runMatch}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#990000] text-white rounded-lg text-sm disabled:opacity-50 w-full justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? t.analyzing : t.analyze}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
      {(loading || displaySteps.length > 0) && (
        <div className="mb-3">
          {!loading && match && !showAgentTrace ? (
            <button
              type="button"
              onClick={() => setShowAgentTrace(true)}
              className="text-xs text-neutral-500 hover:text-[#990000] flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              {stepsDoneCount} {t.stepsDone} · {t.showSteps}
            </button>
          ) : (
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  {t.agentTrace}
                </p>
                {!loading && match && (
                  <button
                    type="button"
                    onClick={() => setShowAgentTrace(false)}
                    className="text-xs text-neutral-400 hover:text-neutral-600"
                  >
                    {t.hideSteps}
                  </button>
                )}
              </div>
              <ul className="space-y-1.5">
                {displaySteps.map((step, idx) => {
                  const isActive = loading && idx === activeStep && step.status === 'running';
                  const isDone = step.status === 'done';
                  return (
                    <li key={step.id} className="flex items-center gap-2 text-xs">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#990000] shrink-0" />
                      ) : step.status === 'error' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                      )}
                      <span className={isDone ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500'}>
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {match && (
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#990000]">
                {Math.round(match.match_score)}%
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700">
                {recLabels[match.recommendation]}
              </span>
            </div>
            {match.confidence != null && (
              <span className="text-xs text-neutral-500">
                {t.confidence}: {Math.round(match.confidence * 100)}%
              </span>
            )}
          </div>

          <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
            {match.summary}
          </p>

          <div className="flex flex-wrap gap-1">
            {match.matched_keywords.slice(0, 6).map((kw) => (
              <span key={kw} className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {kw}
              </span>
            ))}
            {match.matched_keywords.length > 6 && (
              <span className="text-xs text-neutral-500">+{match.matched_keywords.length - 6}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-center gap-1 py-2 text-sm text-[#990000] border border-[#990000]/20 rounded-lg hover:bg-[#990000]/5"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {t.hideDetails}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {t.showDetails}
              </>
            )}
          </button>

          {showDetails && (
            <div className="space-y-3 max-h-[min(280px,35vh)] overflow-y-auto overscroll-contain pr-1 text-sm">
              {match.agent_reasoning && (
                <div className="p-2.5 rounded-lg bg-[#990000]/5 border border-[#990000]/10 text-xs">
                  <p className="font-medium text-[#990000] mb-1 flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    {t.reasoning}
                  </p>
                  {match.agent_reasoning}
                </div>
              )}

              {match.candidate_profile && (
                <div className="p-2.5 rounded-lg border text-xs">
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {t.candidateProfile}
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-1 line-clamp-2">
                    {match.candidate_profile.experience_summary}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {match.candidate_profile.skills.slice(0, 8).map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-900/30">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {match.job_profile && (
                <div className="p-2.5 rounded-lg border text-xs">
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {t.jobProfile}
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 line-clamp-3">
                    {match.job_profile.role_summary}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-medium mb-1">{t.missing}</p>
                  <div className="flex flex-wrap gap-1">
                    {match.missing_keywords.map((kw) => (
                      <span key={kw} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-1">{t.strengths}</p>
                  <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400">
                    {match.strengths.slice(0, 4).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {match.risks.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium mb-1">{t.risks}</p>
                  <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400">
                    {match.risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {match.interview_questions && match.interview_questions.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t.interview}
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-neutral-600 dark:text-neutral-400">
                    {match.interview_questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}

              {match.next_actions && match.next_actions.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <ListChecks className="w-3.5 h-3.5" />
                    {t.nextActions}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-neutral-600 dark:text-neutral-400">
                    {match.next_actions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

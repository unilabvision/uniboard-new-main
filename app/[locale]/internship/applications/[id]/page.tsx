'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  Calendar,
  FileText,
  Download,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
  History,
  User,
  Edit3,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCvDownloadUrl } from '../../utils/cvDownload';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || ''
});

// Types
interface InternshipApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  school: string;
  grade: string;
  position: string;
  motivation: string;
  communication: string;
  team_experience: string;
  status: 'pending' | 'under_review' | 'interview' | 'accepted' | 'rejected';
  admin_notes: string;
  cv_file_name: string;
  cv_storage_path: string;
  cv_mime_type: string;
  cv_file_size: number;
  source: string;
  created_at: string;
  updated_at: string;
  reviewed_by: string;
  reviewed_at: string;
}

interface Vote {
  id: string;
  application_id: string;
  voter_id: string;
  voter_email: string;
  voter_name: string;
  vote_type: 'approve' | 'reject' | 'neutral' | 'shortlist';
  score: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

interface StatusHistory {
  id: string;
  application_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_by_email: string;
  reason: string;
  created_at: string;
}

// Localized texts
const texts = {
  tr: {
    backToList: "Başvurulara Dön",
    applicationDetails: "Başvuru Detayları",
    personalInfo: "Kişisel Bilgiler",
    contactInfo: "İletişim Bilgileri",
    educationInfo: "Eğitim Bilgileri",
    applicationInfo: "Başvuru Bilgileri",
    motivation: "Motivasyon Mektubu",
    communication: "İletişim Becerileri",
    teamExperience: "Takım Deneyimi",
    cv: "CV / Özgeçmiş",
    downloadCV: "CV İndir",
    viewCV: "CV Görüntüle",
    noCV: "CV yüklenmemiş",
    status: "Durum",
    changeStatus: "Durumu Değiştir",
    adminNotes: "Admin Notları",
    addNote: "Not Ekle",
    saveNote: "Notu Kaydet",
    cancelNote: "İptal",
    voting: "Oylama",
    yourVote: "Oyunuz",
    voteApprove: "Onayla",
    voteReject: "Reddet",
    voteNeutral: "Kararsız",
    voteShortlist: "Kısa Liste",
    addComment: "Yorum ekle...",
    submitVote: "Oy Ver",
    updateVote: "Oyu Güncelle",
    allVotes: "Tüm Oylar",
    noVotes: "Henüz oy verilmemiş",
    statusHistory: "Durum Geçmişi",
    noHistory: "Geçmiş bulunmuyor",
    statusLabels: {
      pending: "Bekliyor",
      under_review: "İncelemede",
      interview: "Mülakat",
      accepted: "Kabul Edildi",
      rejected: "Reddedildi"
    },
    voteLabels: {
      approve: "Onay",
      reject: "Red",
      neutral: "Kararsız",
      shortlist: "Kısa Liste"
    },
    loading: "Yükleniyor...",
    error: "Bir hata oluştu",
    notFound: "Başvuru bulunamadı",
    score: "Puan",
    submittedAt: "Başvuru Tarihi",
    source: "Kaynak",
    reasonPlaceholder: "Durum değişikliği sebebi (opsiyonel)..."
  },
  en: {
    backToList: "Back to Applications",
    applicationDetails: "Application Details",
    personalInfo: "Personal Information",
    contactInfo: "Contact Information",
    educationInfo: "Education Information",
    applicationInfo: "Application Information",
    motivation: "Motivation Letter",
    communication: "Communication Skills",
    teamExperience: "Team Experience",
    cv: "CV / Resume",
    downloadCV: "Download CV",
    viewCV: "View CV",
    noCV: "No CV uploaded",
    status: "Status",
    changeStatus: "Change Status",
    adminNotes: "Admin Notes",
    addNote: "Add Note",
    saveNote: "Save Note",
    cancelNote: "Cancel",
    voting: "Voting",
    yourVote: "Your Vote",
    voteApprove: "Approve",
    voteReject: "Reject",
    voteNeutral: "Neutral",
    voteShortlist: "Shortlist",
    addComment: "Add a comment...",
    submitVote: "Submit Vote",
    updateVote: "Update Vote",
    allVotes: "All Votes",
    noVotes: "No votes yet",
    statusHistory: "Status History",
    noHistory: "No history found",
    statusLabels: {
      pending: "Pending",
      under_review: "Under Review",
      interview: "Interview",
      accepted: "Accepted",
      rejected: "Rejected"
    },
    voteLabels: {
      approve: "Approve",
      reject: "Reject",
      neutral: "Neutral",
      shortlist: "Shortlist"
    },
    loading: "Loading...",
    error: "An error occurred",
    notFound: "Application not found",
    score: "Score",
    submittedAt: "Submitted At",
    source: "Source",
    reasonPlaceholder: "Reason for status change (optional)..."
  }
};

// Status color helper
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    case 'under_review':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'interview':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600';
  }
};

// Vote color helper
const getVoteColor = (voteType: string) => {
  switch (voteType) {
    case 'approve':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'reject':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'neutral':
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300';
    case 'shortlist':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300';
  }
};

// Format date helper
const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Main Component
export default function ApplicationDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const resolvedParams = use(params);
  const { locale, id } = resolvedParams;
  const t = texts[locale as keyof typeof texts] || texts.tr;
  
  const [application, setApplication] = useState<InternshipApplication | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Voting states
  const [selectedVote, setSelectedVote] = useState<string>('');
  const [voteScore, setVoteScore] = useState<number>(5);
  const [voteComment, setVoteComment] = useState('');
  const [myVote, setMyVote] = useState<Vote | null>(null);
  const [submittingVote, setSubmittingVote] = useState(false);
  
  // Status change states
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  
  // Notes states
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [downloadingCv, setDownloadingCv] = useState(false);
  
  const { user: clerkUser, isLoaded } = useUser();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !clerkUser) return;
      
      try {
        setLoading(true);
        
        // Fetch application
        const { data: appData, error: appError } = await supabase
          .from('internship_applications')
          .select('*')
          .eq('id', id)
          .single();
        
        if (appError) throw appError;
        if (!appData) throw new Error('Application not found');
        
        setApplication(appData);
        setNotes(appData.admin_notes || '');
        setNewStatus(appData.status);
        
        // Fetch votes
        const { data: votesData, error: votesError } = await supabase
          .from('internship_votes')
          .select('*')
          .eq('application_id', id)
          .order('created_at', { ascending: false });
        
        if (votesError) throw votesError;
        setVotes(votesData || []);
        
        // Find my vote
        const userVote = votesData?.find(v => v.voter_id === clerkUser.id);
        if (userVote) {
          setMyVote(userVote);
          setSelectedVote(userVote.vote_type);
          setVoteScore(userVote.score || 5);
          setVoteComment(userVote.comment || '');
        }
        
        // Fetch status history
        const { data: historyData, error: historyError } = await supabase
          .from('internship_status_history')
          .select('*')
          .eq('application_id', id)
          .order('created_at', { ascending: false });
        
        if (historyError) throw historyError;
        setStatusHistory(historyData || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isLoaded, clerkUser, id]);

  // Handle vote submission
  const handleSubmitVote = async () => {
    if (!clerkUser || !selectedVote) return;
    
    try {
      setSubmittingVote(true);
      
      const voteData = {
        application_id: id,
        voter_id: clerkUser.id,
        voter_email: clerkUser.emailAddresses[0]?.emailAddress || '',
        voter_name: clerkUser.fullName || clerkUser.firstName || 'Unknown',
        vote_type: selectedVote,
        score: voteScore,
        comment: voteComment,
        updated_at: new Date().toISOString()
      };
      
      if (myVote) {
        // Update existing vote
        const { error } = await supabase
          .from('internship_votes')
          .update(voteData)
          .eq('id', myVote.id);
        
        if (error) throw error;
      } else {
        // Insert new vote
        const { error } = await supabase
          .from('internship_votes')
          .insert(voteData);
        
        if (error) throw error;
      }
      
      // Refresh votes
      const { data: votesData } = await supabase
        .from('internship_votes')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      
      setVotes(votesData || []);
      const userVote = votesData?.find(v => v.voter_id === clerkUser.id);
      setMyVote(userVote || null);
      
    } catch (err) {
      console.error('Error submitting vote:', err);
      alert('Oy verilirken bir hata oluştu');
    } finally {
      setSubmittingVote(false);
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!clerkUser || !newStatus || newStatus === application?.status) return;
    
    try {
      setChangingStatus(true);
      
      // Update application status
      const { error: updateError } = await supabase
        .from('internship_applications')
        .update({
          status: newStatus,
          reviewed_by: clerkUser.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Add status history
      const { error: historyError } = await supabase
        .from('internship_status_history')
        .insert({
          application_id: id,
          old_status: application?.status,
          new_status: newStatus,
          changed_by: clerkUser.id,
          changed_by_email: clerkUser.emailAddresses[0]?.emailAddress || '',
          reason: statusReason
        });
      
      if (historyError) throw historyError;
      
      // Refresh data
      setApplication(prev => prev ? { ...prev, status: newStatus as InternshipApplication['status'] } : null);
      setStatusReason('');
      
      // Refresh history
      const { data: historyData } = await supabase
        .from('internship_status_history')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      
      setStatusHistory(historyData || []);
      
    } catch (err) {
      console.error('Error changing status:', err);
      alert('Durum değiştirilirken bir hata oluştu');
    } finally {
      setChangingStatus(false);
    }
  };

  // Handle notes save
  const handleSaveNotes = async () => {
    if (!clerkUser) return;
    
    try {
      setSavingNotes(true);
      
      const { error } = await supabase
        .from('internship_applications')
        .update({
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setApplication(prev => prev ? { ...prev, admin_notes: notes } : null);
      setEditingNotes(false);
      
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Notlar kaydedilirken bir hata oluştu');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDownloadCv = async () => {
    if (!application?.cv_storage_path) {
      alert(locale === 'tr' ? 'CV dosyası bulunamadı.' : 'CV file is not available.');
      return;
    }

    try {
      setDownloadingCv(true);
      const url = await getCvDownloadUrl(supabase, application.cv_storage_path);

      if (!url) {
        throw new Error('CV download URL is missing');
      }

      window.open(url, '_blank', 'noopener');
    } catch (err) {
      console.error('Error downloading CV:', err);
      alert(locale === 'tr'
        ? 'CV indirilirken bir hata oluştu. Lütfen tekrar deneyin.'
        : 'Unable to download the CV. Please try again.');
    } finally {
      setDownloadingCv(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-6"></div>
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 h-48"></div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 h-64"></div>
              </div>
              <div className="space-y-6">
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 h-48"></div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 h-64"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !application) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link 
            href={`/${locale}/internship/applications`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToList}
          </Link>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-6 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <span>{error || t.notFound}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link 
          href={`/${locale}/internship/applications`}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToList}
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#990000] to-[#660000] flex items-center justify-center text-white font-bold text-xl">
              {application.first_name?.[0]}{application.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {application.first_name} {application.last_name}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400">
                {application.position || 'Pozisyon belirtilmemiş'}
              </p>
            </div>
          </div>
          <span className={`self-start sm:self-auto px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(application.status)}`}>
            {t.statusLabels[application.status as keyof typeof t.statusLabels]}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal & Contact Info */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t.personalInfo}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <Mail className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Email</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{application.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <Phone className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Telefon</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{application.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Okul</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{application.school}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Sınıf</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{application.grade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.submittedAt}</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatDate(application.created_at, locale)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <User className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.source}</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{application.source || 'website'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation */}
            {application.motivation && (
              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  {t.motivation}
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {application.motivation}
                </p>
              </div>
            )}

            {/* Communication Skills */}
            {application.communication && (
              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  {t.communication}
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {application.communication}
                </p>
              </div>
            )}

            {/* Team Experience */}
            {application.team_experience && (
              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  {t.teamExperience}
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {application.team_experience}
                </p>
              </div>
            )}

            {/* All Votes */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t.allVotes}
              </h2>
              {votes.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                  {t.noVotes}
                </p>
              ) : (
                <div className="space-y-3">
                  {votes.map((vote) => (
                    <div key={vote.id} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium">
                        {vote.voter_name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                            {vote.voter_name}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getVoteColor(vote.vote_type)}`}>
                            {t.voteLabels[vote.vote_type as keyof typeof t.voteLabels]}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {t.score}: {vote.score}/10
                        </p>
                        {vote.comment && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                            {vote.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* CV */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t.cv}
              </h2>
              {application.cv_file_name ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                    <FileText className="w-8 h-8 text-[#990000]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {application.cv_file_name}
                      </p>
                      {application.cv_file_size && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatFileSize(application.cv_file_size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadCv}
                    disabled={downloadingCv}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#990000] hover:bg-[#770000] disabled:bg-neutral-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {downloadingCv ? (
                      <span className="text-sm">
                        {locale === 'tr' ? 'İndiriliyor...' : 'Downloading...'}
                      </span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {t.downloadCV}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                  {t.noCV}
                </p>
              )}
            </div>

            {/* Status Change */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t.changeStatus}
              </h2>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                >
                  {(['pending', 'under_review', 'interview', 'accepted', 'rejected'] as const).map((status) => (
                    <option key={status} value={status}>
                      {t.statusLabels[status]}
                    </option>
                  ))}
                </select>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={t.reasonPlaceholder}
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-[#990000] focus:border-transparent resize-none"
                />
                <button
                  onClick={handleStatusChange}
                  disabled={changingStatus || newStatus === application.status}
                  className="w-full px-4 py-2 bg-[#990000] hover:bg-[#770000] disabled:bg-neutral-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {changingStatus ? '...' : t.changeStatus}
                </button>
              </div>
            </div>

            {/* Voting */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                {t.yourVote}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'approve', icon: ThumbsUp, color: 'hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30' },
                    { value: 'reject', icon: ThumbsDown, color: 'hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30' },
                    { value: 'neutral', icon: Minus, color: 'hover:bg-neutral-200 dark:hover:bg-neutral-700' },
                    { value: 'shortlist', icon: Star, color: 'hover:bg-yellow-100 hover:text-yellow-700 dark:hover:bg-yellow-900/30' }
                  ].map(({ value, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedVote(value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        selectedVote === value 
                          ? getVoteColor(value) + ' border-current'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 ' + color
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t.voteLabels[value as keyof typeof t.voteLabels]}
                    </button>
                  ))}
                </div>
                
                <div>
                  <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 block">
                    {t.score}: {voteScore}/10
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={voteScore}
                    onChange={(e) => setVoteScore(Number(e.target.value))}
                    className="w-full accent-[#990000]"
                  />
                </div>
                
                <textarea
                  value={voteComment}
                  onChange={(e) => setVoteComment(e.target.value)}
                  placeholder={t.addComment}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-[#990000] focus:border-transparent resize-none"
                />
                
                <button
                  onClick={handleSubmitVote}
                  disabled={submittingVote || !selectedVote}
                  className="w-full px-4 py-2 bg-[#990000] hover:bg-[#770000] disabled:bg-neutral-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {submittingVote ? '...' : (myVote ? t.updateVote : t.submitVote)}
                </button>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {t.adminNotes}
                </h2>
                {!editingNotes && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-[#990000] focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#990000] hover:bg-[#770000] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {t.saveNote}
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotes(false);
                        setNotes(application.admin_notes || '');
                      }}
                      className="px-3 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-600 dark:text-neutral-400 text-sm whitespace-pre-wrap">
                  {application.admin_notes || (locale === 'tr' ? 'Not eklenmemiş' : 'No notes added')}
                </p>
              )}
            </div>

            {/* Status History */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                {t.statusHistory}
              </h2>
              {statusHistory.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-center py-4 text-sm">
                  {t.noHistory}
                </p>
              ) : (
                <div className="space-y-3">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="relative pl-6 pb-3 border-l-2 border-neutral-200 dark:border-neutral-700 last:border-l-0 last:pb-0">
                      <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#990000]"></div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDate(history.created_at, locale)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {history.old_status && (
                          <>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(history.old_status)}`}>
                              {t.statusLabels[history.old_status as keyof typeof t.statusLabels]}
                            </span>
                            <span className="text-neutral-400">→</span>
                          </>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(history.new_status)}`}>
                          {t.statusLabels[history.new_status as keyof typeof t.statusLabels]}
                        </span>
                      </div>
                      {history.reason && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                          {history.reason}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {history.changed_by_email}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

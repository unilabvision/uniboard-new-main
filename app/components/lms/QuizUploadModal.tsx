'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, Plus, X, Save, Trash2, ArrowUp, ArrowDown, 
  AlertCircle, CheckCircle, Settings, FileText, Sparkles, Loader2
} from 'lucide-react';
import { CourseQuiz, QuizQuestion, QuizConfig } from '../../types/course';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

interface QuizUploadModalProps {
  lessonId: string;
  onQuizUploaded: (quiz: CourseQuiz) => void;
  onClose: () => void;
  orderIndex?: number;
  existingQuiz?: CourseQuiz;
  courseTitle?: string;
  lessonTitle?: string;
}

interface UploadState {
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string;
}

interface QuizFormData {
  title: string;
  description?: string;
  quick_type: 'quiz';
  questions: QuizQuestion[];
  time_limit_minutes?: number; // in minutes (user input)
  passing_score?: number; // percentage
  shuffle_options?: boolean;
  shuffle_questions?: boolean;
}


export default function QuizUploadModal({ 
  lessonId, 
  onQuizUploaded, 
  onClose, 
  orderIndex = 0,
  existingQuiz,
  courseTitle,
  lessonTitle,
}: QuizUploadModalProps) {
  
  const [formData, setFormData] = useState<QuizFormData>({
    title: existingQuiz?.title || '',
    description: existingQuiz?.description || '',
    quick_type: 'quiz',
    questions: existingQuiz?.config?.questions || [],
    time_limit_minutes: existingQuiz?.config?.time_limit ? Math.round(existingQuiz.config.time_limit / 60) : 30, // Convert seconds to minutes
    passing_score: existingQuiz?.config?.passing_score || 70,
    shuffle_options: existingQuiz?.config?.shuffle_options || true,
    shuffle_questions: existingQuiz?.config?.shuffle_questions || true
  });
  
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: '',
  });
  
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'settings'>('basic');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState(lessonTitle || existingQuiz?.title || '');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiReplace, setAiReplace] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const generateQuestionsWithAi = async () => {
    const topic = aiTopic.trim() || formData.title.trim();
    if (!topic) {
      setAiError('Konu veya quiz başlığı girin.');
      return;
    }

    setAiGenerating(true);
    setAiError('');
    try {
      const res = await fetch('/api/lms/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          lessonTitle: lessonTitle || undefined,
          courseTitle: courseTitle || undefined,
          questionCount: aiQuestionCount,
          difficulty: aiDifficulty,
          language: 'tr',
          extraContext: formData.description || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Quiz üretilemedi');
      }

      const generated: QuizQuestion[] = (data.quiz?.questions || []).map(
        (q: QuizQuestion) => ({
          question: q.question,
          options: q.options?.length ? q.options : ['Seçenek 1', 'Seçenek 2', 'Seçenek 3', 'Seçenek 4'],
          correct: typeof q.correct === 'number' ? q.correct : 0,
          points: q.points || 5,
          explanation: q.explanation || '',
        })
      );

      if (generated.length === 0) {
        throw new Error('AI soru döndürmedi');
      }

      setFormData((prev) => ({
        ...prev,
        title: prev.title.trim() || data.quiz?.title || prev.title,
        description: prev.description?.trim()
          ? prev.description
          : data.quiz?.description || prev.description,
        questions: aiReplace ? generated : [...prev.questions, ...generated],
      }));
      setShowAiPanel(false);
      setUploadState({
        status: 'idle',
        message: `${generated.length} soru AI ile eklendi — kaydetmeden önce gözden geçirin.`,
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Quiz üretilemedi');
    } finally {
      setAiGenerating(false);
    }
  };

  // Add new question
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question: '',
      points: 5,
      correct: 0, // first option is correct by default
      options: [
        'Seçenek 1',
        'Seçenek 2',
        'Seçenek 3',
        'Seçenek 4'
      ],
      explanation: ''
    };

    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion]
    });
    setEditingQuestion(`question-${formData.questions.length}`);
  };

  // Update question
  const updateQuestion = (questionIndex: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], ...updates };
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  // Delete question
  const deleteQuestion = (questionIndex: number) => {
    const newQuestions = formData.questions.filter((_, index) => index !== questionIndex);
    setFormData({
      ...formData,
      questions: newQuestions
    });
    if (editingQuestion === `question-${questionIndex}`) {
      setEditingQuestion(null);
    }
  };

  // Move question up/down
  const moveQuestion = (questionIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? questionIndex - 1 : questionIndex + 1;
    if (newIndex < 0 || newIndex >= formData.questions.length) return;
    
    const newQuestions = [...formData.questions];
    [newQuestions[questionIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[questionIndex]];
    
    setFormData({
      ...formData,
      questions: newQuestions
    });
  };

  // Add option to multiple choice question
  const addOption = (questionIndex: number) => {
    const question = formData.questions[questionIndex];
    if (!question) return;
    
    const newOptions = [...question.options, `Yeni Seçenek ${question.options.length + 1}`];
    updateQuestion(questionIndex, { options: newOptions });
  };

  // Update option
  const updateOption = (questionIndex: number, optionIndex: number, newText: string) => {
    const question = formData.questions[questionIndex];
    if (!question) return;
    
    const newOptions = [...question.options];
    newOptions[optionIndex] = newText;
    updateQuestion(questionIndex, { options: newOptions });
  };

  // Delete option
  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = formData.questions[questionIndex];
    if (!question || question.options.length <= 2) return;
    
    const newOptions = question.options.filter((_, index) => index !== optionIndex);
    const newCorrect = question.correct >= optionIndex ? Math.max(0, question.correct - 1) : question.correct;
    
    updateQuestion(questionIndex, { 
      options: newOptions,
      correct: newCorrect
    });
  };

  // Set correct answer
  const setCorrectAnswer = (questionIndex: number, correctIndex: number) => {
    updateQuestion(questionIndex, { correct: correctIndex });
  };

  // Handle form submission
  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      setUploadState({
        status: 'error',
        message: 'Quiz başlığı zorunludur.',
      });
      return;
    }

    if (formData.questions.length === 0) {
      setUploadState({
        status: 'error',
        message: 'En az bir soru eklemelisiniz.',
      });
      return;
    }

    // Validate questions
    for (const question of formData.questions) {
      if (!question.question.trim()) {
        setUploadState({
          status: 'error',
          message: 'Tüm soruların metni doldurulmalıdır.',
        });
        return;
      }

      if (formData.quick_type === 'quiz') {
        if (!question.options || question.options.length < 2) {
          setUploadState({
            status: 'error',
            message: 'Çoktan seçmeli sorularda en az 2 seçenek olmalıdır.',
          });
          return;
        }

        if (question.correct < 0 || question.correct >= question.options.length) {
          setUploadState({
            status: 'error',
            message: 'Her soruda doğru cevap seçilmelidir.',
          });
          return;
        }

        for (const option of question.options) {
          if (!option.trim()) {
            setUploadState({
              status: 'error',
              message: 'Tüm seçeneklerin metni doldurulmalıdır.',
            });
            return;
          }
        }
      }
    }

    try {
      setUploadState({
        status: 'saving',
        message: existingQuiz ? 'Quiz güncelleniyor...' : 'Quiz kaydediliyor...',
      });

      const config: QuizConfig = {
        questions: formData.questions,
        time_limit: formData.time_limit_minutes ? formData.time_limit_minutes * 60 : undefined, // Convert minutes to seconds
        passing_score: formData.passing_score,
        shuffle_options: formData.shuffle_options,
        shuffle_questions: formData.shuffle_questions
      };

      if (existingQuiz) {
        // Update existing quiz
        const { data, error } = await supabase
          .from('myuni_quicks')
          .update({
            title: formData.title.trim(),
            description: formData.description?.trim() || null,
            quick_type: formData.quick_type,
            config: config,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingQuiz.id)
          .select()
          .single();

        if (error) throw error;

        setUploadState({
          status: 'success',
          message: 'Quiz başarıyla güncellendi!',
        });

        onQuizUploaded(data);
      } else {
        // Create new quiz
        const { data, error } = await supabase
          .from('myuni_quicks')
          .insert([{
            lesson_id: lessonId,
            title: formData.title.trim(),
            description: formData.description?.trim() || null,
            quick_type: formData.quick_type,
            config: config,
            order_index: orderIndex
          }])
          .select()
          .single();

        if (error) throw error;

        setUploadState({
          status: 'success',
          message: 'Quiz başarıyla kaydedildi!',
        });

        onQuizUploaded(data);
      }

      // Close modal after 1 second
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error saving quiz:', error);
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.',
      });
    }
  };

  // Render question editor
  const renderQuestionEditor = (question: QuizQuestion, questionIndex: number) => {
    const isEditing = editingQuestion === `question-${questionIndex}`;
    
    return (
      <div key={questionIndex} className={`border rounded-lg p-4 ${isEditing ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-neutral-200 dark:border-neutral-700'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Soru {questionIndex + 1}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200">
              Quiz
            </span>
            <span className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded">
              {question.points} puan
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => moveQuestion(questionIndex, 'up')}
              disabled={questionIndex === 0}
              className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => moveQuestion(questionIndex, 'down')}
              disabled={questionIndex === formData.questions.length - 1}
              className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => setEditingQuestion(isEditing ? null : `question-${questionIndex}`)}
              className="p-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              <FileText className="w-3 h-3" />
            </button>
            <button
              onClick={() => deleteQuestion(questionIndex)}
              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Soru Metni
              </label>
              <textarea
                value={question.question}
                onChange={(e) => updateQuestion(questionIndex, { question: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={2}
                placeholder="Sorunuzu buraya yazın..."
              />
            </div>

            {/* Question Options */}
            {question.options && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Seçenekler
                </label>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        checked={question.correct === optionIndex}
                        onChange={() => setCorrectAnswer(questionIndex, optionIndex)}
                        className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                        placeholder="Seçenek metni..."
                      />
                      {question.options.length > 2 && (
                        <button
                          onClick={() => deleteOption(questionIndex, optionIndex)}
                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(questionIndex)}
                    className="inline-flex items-center px-2 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Seçenek Ekle
                  </button>
                </div>
              </div>
            )}

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Puan
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={question.points}
                onChange={(e) => updateQuestion(questionIndex, { points: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Açıklama (opsiyonel)
              </label>
              <textarea
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(questionIndex, { explanation: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={2}
                placeholder="Sorunun açıklaması veya ipucu..."
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-neutral-900 dark:text-neutral-100 mb-2">
              {question.question || 'Soru metni belirtilmemiş'}
            </p>
            {(formData.quick_type === 'quiz') && question.options && (
              <div className="space-y-1">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2 text-sm">
                    <div className={`w-3 h-3 rounded border-2 ${question.correct === optionIndex ? 'bg-green-500 border-green-500' : 'border-neutral-300 dark:border-neutral-600'}`} />
                    <span className={question.correct === optionIndex ? 'text-green-700 dark:text-green-300 font-medium' : 'text-neutral-600 dark:text-neutral-400'}>
                      {option || 'Seçenek metni belirtilmemiş'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {question.explanation && (
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded">
                <strong>Açıklama:</strong> {question.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 transition-opacity duration-200 ease-out z-[10000]"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[10001]">
        <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-200 ease-out scale-100 opacity-100 border border-neutral-200 dark:border-neutral-700 pointer-events-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  {existingQuiz ? 'Quiz Düzenle' : 'Quiz Ekle'}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  İnteraktif quiz oluşturun ve öğrenci değerlendirmesi yapın
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
              disabled={uploadState.status === 'saving'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 dark:border-neutral-700">
            <nav className="flex px-6">
              {[
                { key: 'basic', label: 'Temel Bilgiler', icon: FileText },
                { key: 'questions', label: 'Sorular', icon: HelpCircle },
                { key: 'settings', label: 'Ayarlar', icon: Settings }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'basic' | 'questions' | 'settings')}
                  className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                  {key === 'questions' && formData.questions.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                      {formData.questions.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
            
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Quiz Başlığı *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-neutral-400 dark:placeholder-neutral-500"
                    placeholder="Quiz başlığını girin..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Quiz Açıklaması
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-neutral-400 dark:placeholder-neutral-500"
                    rows={3}
                    placeholder="Quiz hakkında açıklama (opsiyonel)..."
                  />
                </div>

              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Quiz Soruları
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAiPanel((v) => !v);
                        setAiError('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors text-sm font-medium"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Yapay Zeka
                    </button>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Soru Ekle
                    </button>
                  </div>
                </div>

                {showAiPanel && (
                  <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          AI ile soru üret
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Konuyu yazın; Gemini çoktan seçmeli sorular üretir. Kaydetmeden önce düzenleyebilirsiniz.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Konu / içerik *
                      </label>
                      <textarea
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        rows={2}
                        disabled={aiGenerating}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Örn: Embriyoloji — blastokist oluşumu ve implantasyon aşamaları"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Soru sayısı
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={aiQuestionCount}
                          disabled={aiGenerating}
                          onChange={(e) =>
                            setAiQuestionCount(
                              Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 5))
                            )
                          }
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Zorluk
                        </label>
                        <select
                          value={aiDifficulty}
                          disabled={aiGenerating}
                          onChange={(e) =>
                            setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')
                          }
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-sm"
                        >
                          <option value="easy">Kolay</option>
                          <option value="medium">Orta</option>
                          <option value="hard">Zor</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 pb-2">
                          <input
                            type="checkbox"
                            checked={aiReplace}
                            disabled={aiGenerating}
                            onChange={(e) => setAiReplace(e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-neutral-300 rounded focus:ring-purple-500"
                          />
                          Mevcut soruları değiştir
                        </label>
                      </div>
                    </div>

                    {aiError && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {aiError}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={aiGenerating}
                        onClick={() => setShowAiPanel(false)}
                        className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md"
                      >
                        Kapat
                      </button>
                      <button
                        type="button"
                        disabled={aiGenerating}
                        onClick={generateQuestionsWithAi}
                        className="inline-flex items-center px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-md text-sm font-medium"
                      >
                        {aiGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Üretiliyor...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Soruları üret
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {uploadState.message && uploadState.status === 'idle' && (
                  <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-md">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    {uploadState.message}
                  </div>
                )}

                {formData.questions.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz soru eklenmemiş</p>
                    <p className="text-sm mt-2">Manuel ekleyin veya Yapay Zeka ile üretin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.questions.map((question, index) => renderQuestionEditor(question, index))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    Quiz Ayarları
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Süre Limiti (dakika)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={formData.time_limit_minutes || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          time_limit_minutes: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="30 dakika"
                      />
                      {formData.time_limit_minutes && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          = {formData.time_limit_minutes * 60} saniye
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Geçme Puanı (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.passing_score || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          passing_score: parseInt(e.target.value) || 70
                        })}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="shuffle_questions"
                        checked={formData.shuffle_questions || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          shuffle_questions: e.target.checked
                        })}
                        className="w-4 h-4 text-purple-600 border-neutral-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="shuffle_questions" className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                        Soruları karıştır
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="shuffle_options"
                        checked={formData.shuffle_options || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          shuffle_options: e.target.checked
                        })}
                        className="w-4 h-4 text-purple-600 border-neutral-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="shuffle_options" className="ml-3 text-sm text-neutral-700 dark:text-neutral-300">
                        Seçenekleri karıştır
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {uploadState.message && (
            <div className={`mx-6 mb-4 flex items-center space-x-3 p-3 rounded-md border ${
              uploadState.status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50'
                : uploadState.status === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
            }`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${
                uploadState.status === 'error'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : uploadState.status === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {uploadState.status === 'error' && <AlertCircle className="w-4 h-4" />}
                {uploadState.status === 'success' && <CheckCircle className="w-4 h-4" />}
              </div>
              <p className="text-sm">{uploadState.message}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors text-sm font-medium"
              disabled={uploadState.status === 'saving'}
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.title.trim() || formData.questions.length === 0 || uploadState.status === 'saving'}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
            >
              {uploadState.status === 'saving' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{existingQuiz ? 'Güncelle' : 'Kaydet'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
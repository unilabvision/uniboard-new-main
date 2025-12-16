'use client';

import React, { useState } from 'react';
import { FileText, Upload, X, Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { CourseNote, NoteFormData } from '../../types/course';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

interface NoteUploadModalProps {
  lessonId: string;
  onNoteUploaded: (note: CourseNote) => void;
  onClose: () => void;
  orderIndex?: number;
  existingNote?: CourseNote;
}

interface UploadState {
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string;
}

export default function NoteUploadModal({ 
  lessonId, 
  onNoteUploaded, 
  onClose, 
  orderIndex = 0,
  existingNote 
}: NoteUploadModalProps) {
  const [formData, setFormData] = useState<NoteFormData>({
    title: existingNote?.title || '',
    content: existingNote?.content || '',
    content_type: (existingNote?.content_type as 'markdown' | 'html' | 'text') || 'markdown',
  });
  
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: '',
  });
  
  const [showPreview, setShowPreview] = useState(false);

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/plain', 'text/markdown', 'text/html', 'application/json'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|md|html|json)$/i)) {
      setUploadState({
        status: 'error',
        message: 'Desteklenmeyen dosya formatı. TXT, MD, HTML veya JSON dosyası yükleyin.',
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadState({
        status: 'error',
        message: 'Dosya boyutu 5MB\'dan büyük olamaz.',
      });
      return;
    }
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      // Determine content type based on file extension
      let contentType: 'markdown' | 'html' | 'text' = 'text';
      if (file.name.toLowerCase().endsWith('.md')) {
        contentType = 'markdown';
      } else if (file.name.toLowerCase().endsWith('.html')) {
        contentType = 'html';
      }
      
      setFormData({
        ...formData,
        title: formData.title || file.name.replace(/\.[^/.]+$/, ''),
        content: content,
        content_type: contentType,
        file
      });
      
      setUploadState({
        status: 'idle',
        message: '',
      });
    };
    
    reader.onerror = () => {
      setUploadState({
        status: 'error',
        message: 'Dosya okuma hatası.',
      });
    };
    
    reader.readAsText(file);
  };

  // Handle form submission
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setUploadState({
        status: 'error',
        message: 'Başlık ve içerik alanları zorunludur.',
      });
      return;
    }

    try {
      setUploadState({
        status: 'saving',
        message: existingNote ? 'Not güncelleniyor...' : 'Not kaydediliyor...',
      });

      if (existingNote) {
        // Update existing note
        const { data, error } = await supabase
          .from('myuni_notes')
          .update({
            title: formData.title.trim(),
            content: formData.content,
            content_type: formData.content_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingNote.id)
          .select()
          .single();

        if (error) throw error;

        setUploadState({
          status: 'success',
          message: 'Not başarıyla güncellendi!',
        });

        onNoteUploaded(data);
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('myuni_notes')
          .insert([{
            lesson_id: lessonId,
            title: formData.title.trim(),
            content: formData.content,
            content_type: formData.content_type,
            order_index: orderIndex,
            is_ai_generated: false
          }])
          .select()
          .single();

        if (error) throw error;

        setUploadState({
          status: 'success',
          message: 'Not başarıyla kaydedildi!',
        });

        onNoteUploaded(data);
      }

      // Close modal after 1 second
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error saving note:', error);
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.',
      });
    }
  };

  // Render markdown preview (simplified)
  const renderPreview = () => {
    if (formData.content_type === 'html') {
      return (
        <div 
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: formData.content }}
        />
      );
    } else if (formData.content_type === 'markdown') {
      // Simple markdown rendering (you might want to use a proper markdown library)
      const htmlContent = formData.content
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br>');
      
      return (
        <div 
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: `<p>${htmlContent}</p>` }}
        />
      );
    } else {
      return (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
          {formData.content}
        </pre>
      );
    }
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
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  {existingNote ? 'Notu Düzenle' : 'Not Ekle'}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Markdown, HTML veya düz metin formatında not ekleyebilirsiniz
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

          {/* Content */}
          <div className="flex flex-col h-[calc(90vh-8rem)] overflow-hidden">
            {/* Form Section */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Panel - Form */}
              <div className={`${showPreview ? 'w-1/2' : 'w-full'} p-6 border-r border-neutral-200 dark:border-neutral-700 flex flex-col space-y-4 overflow-y-auto`}>
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Not Başlığı *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-neutral-400 dark:placeholder-neutral-500"
                    placeholder="Not başlığını girin..."
                    disabled={uploadState.status === 'saving'}
                  />
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    İçerik Formatı
                  </label>
                  <select
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value as 'markdown' | 'html' | 'text' })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={uploadState.status === 'saving'}
                  >
                    <option value="markdown">Markdown</option>
                    <option value="html">HTML</option>
                    <option value="text">Düz Metin</option>
                  </select>
                </div>

                {/* File Import */}
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-md p-4">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      Dosyadan içe aktar (opsiyonel)
                    </p>
                    <input
                      type="file"
                      accept=".txt,.md,.html,.json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadState.status === 'saving'}
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded text-sm font-medium transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Dosya Seç
                    </label>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                      TXT, MD, HTML • Maksimum: 5MB
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      İçerik *
                    </label>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="inline-flex items-center px-2 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {showPreview ? 'Düzenleme' : 'Önizleme'}
                    </button>
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="flex-1 w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-neutral-400 dark:placeholder-neutral-500 resize-none font-mono text-sm"
                    placeholder={
                      formData.content_type === 'markdown' 
                        ? '# Başlık\n\n**Kalın metin** ve *italik metin*\n\n- Liste öğesi 1\n- Liste öğesi 2'
                        : formData.content_type === 'html'
                        ? '<h1>Başlık</h1>\n<p><strong>Kalın metin</strong> ve <em>italik metin</em></p>'
                        : 'Not içeriğini buraya yazın...'
                    }
                    disabled={uploadState.status === 'saving'}
                    rows={12}
                  />
                </div>
              </div>

              {/* Right Panel - Preview */}
              {showPreview && (
                <div className="w-1/2 p-6 overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Önizleme
                    </h3>
                    <div className="bg-white dark:bg-neutral-800 rounded-md p-4 border border-neutral-200 dark:border-neutral-700 min-h-[300px]">
                      {formData.content ? renderPreview() : (
                        <p className="text-neutral-400 dark:text-neutral-500 italic">
                          İçerik görüntülenecek...
                        </p>
                      )}
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
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors text-sm font-medium"
                disabled={uploadState.status === 'saving'}
              >
                <Eye className="w-4 h-4 mr-2 inline" />
                {showPreview ? 'Düzenle' : 'Önizle'}
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim() || !formData.content.trim() || uploadState.status === 'saving'}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
              >
                {uploadState.status === 'saving' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{existingNote ? 'Güncelle' : 'Kaydet'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, Sparkles, CheckCircle, AlertTriangle, RefreshCw, Eye, X, Stars, Wand2 } from 'lucide-react';
import ExcelParser, { ParsedExcelData } from '@/utils/excelParser';

interface AIBulkCertificateProps {
  onRecipientsUpdate: (recipients: string[]) => void;
  onRecipientsWithEmailsUpdate?: (recipients: Array<{ name: string; email?: string }>) => void;
  onFieldSuggestions: (suggestions: Record<string, string>) => void;
  courseName: string;
  error?: string;
  disabled?: boolean;
}

interface AIAnalysis {
  recipients: string[];
  suggestedMapping: {
    nameColumn: number;
    emailColumn?: number;
    additionalColumns?: { [key: string]: number };
  };
  analysis: string;
  validation?: {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    suggestions: string[];
  };
  optimization?: {
    optimizedRecipients: string[];
    suggestions: string[];
    warnings: string[];
  };
}

export default function AIBulkCertificate({ 
  onRecipientsUpdate, 
  onRecipientsWithEmailsUpdate,
  onFieldSuggestions, 
  courseName,
  error: propError,
  disabled 
}: AIBulkCertificateProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [inputMethod, setInputMethod] = useState<'manual' | 'excel' | 'excel-manual'>('manual');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string> | null>(null);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnMapping, setColumnMapping] = useState<{ name?: number; firstName?: number; lastName?: number; email?: number }>({});
  const [selectedOption, setSelectedOption] = useState<'separate' | 'full' | null>(null);

  // AI API çağrısı
  const callAI = async (action: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        throw new Error('AI API çağrısı başarısız');
      }

      return await response.json();
    } catch (error) {
      console.error('AI API hatası:', error);
      throw error;
    }
  };

  // Excel dosyası seçimi
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setManualInput(''); // Manual input'u temizle
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Excel'i parse et
      const parseResult = await ExcelParser.parseFile(file, {
        maxRows: 2000, // Daha fazla satır kabul et
        skipEmptyRows: true,
        trimValues: true
      });

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Excel parse hatası');
      }

      setParsedData(parseResult);
      
      console.log(`Excel parse edildi: ${parseResult.rowCount} satır, ${parseResult.columnCount} kolon`);

      // Önce manuel validasyon yap
      const validation = ExcelParser.validateData(parseResult.data || []);
      
      // AI ile analiz et
      const aiResult = await callAI('analyzeExcel', {
        excelData: parseResult.data
      });

      let finalRecipients: string[] = [];
      let finalAnalysis = '';

      if (aiResult.success && aiResult.analysis.data?.recipients) {
        finalRecipients = aiResult.analysis.data.recipients;
        finalAnalysis = aiResult.analysis.data.analysis || 'AI analizi tamamlandı';
        console.log(`AI analizi: ${finalRecipients.length} alıcı buldu`);
      }
      
      // AI yetersizse manuel fallback
      if (finalRecipients.length < (parseResult.rowCount || 0) * 0.3) {
        console.log('AI analizi yetersiz, manuel fallback kullanılıyor...');
        const nameColumn = ExcelParser.detectNameColumn(parseResult.data || []);
        const manualRecipients = ExcelParser.extractColumnValues(parseResult.data || [], nameColumn);
        
        if (manualRecipients.length > finalRecipients.length) {
          finalRecipients = manualRecipients;
          finalAnalysis = `Manuel analiz: Kolon ${nameColumn + 1}'den ${manualRecipients.length} alıcı tespit edildi`;
          console.log(`Manuel analiz: ${manualRecipients.length} alıcı bulundu`);
        }
      }

      const analysis: AIAnalysis = {
        recipients: finalRecipients,
        suggestedMapping: aiResult.analysis.data?.suggestedMapping || { nameColumn: 0 },
        analysis: finalAnalysis,
        validation: {
          isValid: validation.isValid,
          warnings: validation.warnings,
          suggestions: validation.suggestions,
          issues: validation.issues
        }
      };
      
      setAiAnalysis(analysis);
      onRecipientsUpdate(finalRecipients);

    } catch (error) {
      console.error('Dosya analiz hatası:', error);
      setError(`Dosya analizi sırasında hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Normal Excel dosyası seçimi (AI olmadan)
  const handleManualExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setManualInput('');
    setColumnMapping({});
    setSelectedOption(null);
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Excel'i parse et
      const parseResult = await ExcelParser.parseFile(file, {
        maxRows: 2000,
        skipEmptyRows: true,
        trimValues: true
      });

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Excel parse hatası');
      }

      setParsedData(parseResult);
      console.log(`Excel parse edildi: ${parseResult.rowCount} satır, ${parseResult.columnCount} kolon`);
      
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      setError(`Dosya yüklenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sütun seçimine göre alıcıları çıkar
  const extractRecipientsFromMapping = () => {
    if (!parsedData) {
      return;
    }

    const recipients: string[] = [];
    const recipientsWithEmails: Array<{ name: string; email?: string }> = [];

    // Eğer ad ve soyad ayrı sütunlarda ise birleştir
    if (columnMapping.firstName !== undefined && columnMapping.lastName !== undefined) {
      const startRow = 1;
      for (let i = startRow; i < parsedData.data!.length; i++) {
        const row = parsedData.data![i];
        if (row) {
          const firstName = row[columnMapping.firstName!];
          const lastName = row[columnMapping.lastName!];
          
          if (firstName || lastName) {
            const fullName = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();
            if (fullName) {
              const capitalizedName = ExcelParser.capitalizeName(fullName);
              recipients.push(capitalizedName);
              
              // Email bilgisini de ekle
              const email = columnMapping.email !== undefined ? row[columnMapping.email] : undefined;
              recipientsWithEmails.push({
                name: capitalizedName,
                email: email ? String(email).trim() : undefined
              });
            }
          }
        }
      }
    } 
    // Eğer tam isim sütunu seçilmişse onu kullan
    else if (columnMapping.name !== undefined) {
      const startRow = 1;
      for (let i = startRow; i < parsedData.data!.length; i++) {
        const row = parsedData.data![i];
        if (row) {
          const name = row[columnMapping.name!];
          if (name) {
            const capitalizedName = ExcelParser.capitalizeName(String(name));
            recipients.push(capitalizedName);
            
            // Email bilgisini de ekle
            const email = columnMapping.email !== undefined ? row[columnMapping.email] : undefined;
            recipientsWithEmails.push({
              name: capitalizedName,
              email: email ? String(email).trim() : undefined
            });
          }
        }
      }
    } else {
      return;
    }

    onRecipientsUpdate(recipients);
    if (onRecipientsWithEmailsUpdate) {
      console.log('Recipients with emails:', recipientsWithEmails);
      console.log('Email column index:', columnMapping.email);
      onRecipientsWithEmailsUpdate(recipientsWithEmails);
    }
  };

  // Sütun mapping değiştiğinde alıcıları güncelle (email sütunu dahil)
  useEffect(() => {
    if (inputMethod === 'excel-manual' && parsedData) {
      if (columnMapping.name !== undefined || (columnMapping.firstName !== undefined && columnMapping.lastName !== undefined)) {
        extractRecipientsFromMapping();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnMapping.name, columnMapping.firstName, columnMapping.lastName, columnMapping.email, parsedData, inputMethod]);

  // Manuel input değişimi
  const handleManualInputChange = (value: string) => {
    setManualInput(value);
    setSelectedFile(null);
    setAiAnalysis(null);
    setParsedData(null);
    setColumnMapping({});
    
    // Virgül ile ayrılmış isimleri parse et
    const recipients = value
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    onRecipientsUpdate(recipients);
  };

  // Kurs bilgilerine göre AI önerisi al
  const getSuggestions = async () => {
    if (!courseName.trim()) {
      alert('Önce kurs adını giriniz');
      return;
    }

    try {
      setIsGettingSuggestions(true);
      
      const result = await callAI('suggestFields', {
        courseName,
        additionalInfo: aiAnalysis?.analysis
      });

      if (result.success) {
        setAiSuggestions(result.suggestions);
        onFieldSuggestions(result.suggestions);
      }
    } catch (error) {
      console.error('Öneri alma hatası:', error);
      alert('AI önerisi alınırken hata oluştu');
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  // Alıcıları optimize et
  const optimizeRecipients = async () => {
    if (!aiAnalysis || aiAnalysis.recipients.length === 0) return;

    try {
      setIsAnalyzing(true);
      
      const result = await callAI('optimizeBulk', {
        recipients: aiAnalysis.recipients,
        courseInfo: { courseName }
      });

      if (result.success && result.optimization.success) {
        const optimizedAnalysis = {
          ...aiAnalysis,
          optimization: result.optimization
        };
        setAiAnalysis(optimizedAnalysis);
        onRecipientsUpdate(result.optimization.optimizedRecipients || aiAnalysis.recipients);
      }
    } catch (error) {
      console.error('Optimizasyon hatası:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Method Selector */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          Giriş Yöntemi
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setInputMethod('manual')}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 transition-all text-left shadow-sm hover:shadow-md ${
              inputMethod === 'manual' 
                ? 'border-[#990000] dark:border-red-400 bg-gradient-to-r from-red-50 to-red-50 dark:from-red-900/20 dark:to-red-900/20' 
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center mb-2">
              <span className={`font-medium text-sm ${inputMethod === 'manual' ? 'text-[#990000] dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>
                Manuel Giriş
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              İsimleri virgülle ayırın
            </p>
          </button>
          
          <button
            type="button"
            onClick={() => setInputMethod('excel')}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 transition-all text-left shadow-sm hover:shadow-md ${
              inputMethod === 'excel' 
                ? 'border-[#990000] dark:border-red-400 bg-gradient-to-r from-red-50 to-red-50 dark:from-red-900/20 dark:to-red-900/20' 
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center mb-2">
              <FileSpreadsheet className={`w-4 h-4 mr-2 ${inputMethod === 'excel' ? 'text-[#990000] dark:text-red-400' : 'text-slate-500'}`} />
              <span className={`font-medium text-sm ${inputMethod === 'excel' ? 'text-[#990000] dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>
                MyUNI AI Destekli Excel
              </span>
              <Sparkles className="w-3 h-3 ml-1 text-[#990000] dark:text-red-400" />
              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                Beta
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              MyUNI AI ile otomatik analiz <span className="text-amber-600 dark:text-amber-400 font-medium"></span>
            </p>
          </button>
          
          <button
            type="button"
            onClick={() => setInputMethod('excel-manual')}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 transition-all text-left shadow-sm hover:shadow-md ${
              inputMethod === 'excel-manual' 
                ? 'border-[#990000] dark:border-red-400 bg-gradient-to-r from-red-50 to-red-50 dark:from-red-900/20 dark:to-red-900/20' 
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center mb-2">
              <FileSpreadsheet className={`w-4 h-4 mr-2 ${inputMethod === 'excel-manual' ? 'text-[#990000] dark:text-red-400' : 'text-slate-500'}`} />
              <span className={`font-medium text-sm ${inputMethod === 'excel-manual' ? 'text-[#990000] dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>
                Excel Yükle
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sütunları kendiniz seçin
            </p>
          </button>
        </div>
      </div>

      {/* Manual Input */}
      {inputMethod === 'manual' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Alıcı İsimleri
          </label>
          <textarea
            value={manualInput}
            onChange={(e) => handleManualInputChange(e.target.value)}
            disabled={disabled}
            placeholder="İsimleri virgül ile ayırın (örn: Ahmet Yılmaz, Ayşe Demir, Mehmet Öz)"
            rows={6}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
              (error || propError)
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
            } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''}`}
          />
          {(error || propError) && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error || propError}</p>}
        </div>
      )}

      {/* Excel Upload */}
      {inputMethod === 'excel' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Excel/CSV Dosyası
              <span className="ml-2 inline-flex items-center text-xs bg-gradient-to-r from-[#990000] to-red-700 dark:from-red-400 dark:to-red-500 text-white px-2 py-1 rounded-full shadow-sm">
                <Sparkles className="w-3 h-3 mr-1" />
                MyUNI AI
              </span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={disabled || isAnalyzing}
              accept=".xlsx,.xls,.csv"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                (error || propError)
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#990000] file:text-white hover:file:bg-[#880000]`}
            />
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Excel/CSV dosyasının ilk sütununda alıcı isimleri bulunmalıdır. MyUNI AI otomatik olarak analiz edecektir.
            </p>
            {(error || propError) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error || propError}</p>
            )}
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex items-center justify-center p-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <RefreshCw className="w-5 h-5 text-[#990000] dark:text-red-400 mr-2 animate-spin" />
              <span className="text-gray-700 dark:text-gray-300">MyUNI AI dosyayı analiz ediyor...</span>
            </div>
          )}

          {/* Selected File Info */}
          {selectedFile && !isAnalyzing && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Dosya Seçildi: {selectedFile.name}
                    </p>
                    {parsedData && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {parsedData.rowCount} satır, {parsedData.columnCount} sütun
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {aiAnalysis && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-md transition-colors"
                      title="Analiz Sonuçlarını Göster"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setParsedData(null);
                      setAiAnalysis(null);
                      onRecipientsUpdate([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#990000] to-red-700 dark:from-red-400 dark:to-red-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">MyUNI AI Analiz Sonuçları</h4>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {aiAnalysis.analysis}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-900/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm block">Tespit Edilen Alıcılar</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{aiAnalysis.recipients.length}</span>
                  </div>
                  <div className="bg-white dark:bg-gray-900/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                    <span className="text-gray-600 dark:text-gray-400 font-medium text-sm block">İsim Sütunu</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{aiAnalysis.suggestedMapping.nameColumn + 1}</span>
                  </div>
                </div>

                {/* Validation Results */}
                {aiAnalysis.validation && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700/50">
                    {aiAnalysis.validation.warnings.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm mb-2">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="font-medium">Uyarılar</span>
                        </div>
                        <div className="space-y-1">
                          {aiAnalysis.validation.warnings.map((warning, index) => (
                            <div key={index} className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-md">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {aiAnalysis.validation.suggestions.length > 0 && (
                      <div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
                          <Sparkles className="w-4 h-4 mr-1" />
                          <span className="font-medium">Öneriler</span>
                        </div>
                        <div className="space-y-1">
                          {aiAnalysis.validation.suggestions.map((suggestion, index) => (
                            <div key={index} className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 px-3 py-2 rounded-md">
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4">
                  <button
                    type="button"
                    onClick={optimizeRecipients}
                    disabled={isAnalyzing}
                    className="inline-flex items-center px-3 py-1.5 text-xs bg-gradient-to-r from-[#990000] to-red-700 hover:from-[#880000] hover:to-red-600 dark:from-red-400 dark:to-red-500 dark:hover:from-red-300 dark:hover:to-red-400 text-white rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm"
                  >
                    <Wand2 className="w-3 h-3 mr-1" />
                    Optimize Et
                  </button>
                  
                  {courseName && (
                    <button
                      type="button"
                      onClick={getSuggestions}
                      disabled={isGettingSuggestions}
                      className="inline-flex items-center px-3 py-1.5 text-xs bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm"
                    >
                      {isGettingSuggestions ? (
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Stars className="w-3 h-3 mr-1" />
                      )}
                      Alan Önerileri
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                  <Stars className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI Alan Önerileri</h4>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(aiSuggestions).map(([key, value]) => (
                  <div key={key} className="bg-white dark:bg-gray-900/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-sm capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                        {String(value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Excel Upload */}
      {inputMethod === 'excel-manual' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Excel/CSV Dosyası
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleManualExcelFileSelect}
              disabled={disabled || isAnalyzing}
              accept=".xlsx,.xls,.csv"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                (error || propError)
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#990000] file:text-white hover:file:bg-[#880000]`}
            />
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Excel/CSV dosyasını yükleyin ve hangi sütunun ne olduğunu seçin.
            </p>
            {(error || propError) && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error || propError}</p>
            )}
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex items-center justify-center p-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <RefreshCw className="w-5 h-5 text-[#990000] dark:text-red-400 mr-2 animate-spin" />
              <span className="text-gray-700 dark:text-gray-300">Excel/CSV dosyası yükleniyor...</span>
            </div>
          )}

          {/* Selected File Info */}
          {selectedFile && !isAnalyzing && parsedData && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Dosya Seçildi: {selectedFile.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {parsedData.rowCount} satır, {parsedData.columnCount} sütun
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setParsedData(null);
                      setColumnMapping({});
                      onRecipientsUpdate([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Column Mapping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Separate First and Last Name */}
                <div 
                  className={`p-5 rounded-xl shadow-sm transition-all cursor-pointer ${
                    selectedOption === 'separate'
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500' 
                      : selectedOption === 'full'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 opacity-40'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                  onClick={() => {
                    setSelectedOption('separate');
                    setColumnMapping(prev => {
                      const newMapping = { ...prev };
                      delete newMapping.name;
                      return newMapping;
                    });
                  }}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Seçenek 1: Ad ve Soyad Ayrı Sütunlarda
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Eğer Excel dosyanızda ad ve soyad ayrı sütunlarda ise bu seçeneği kullanın
                  </p>
                  
                  {selectedOption === 'separate' && (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    {/* First Name Column Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ad Sütunu <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={columnMapping.firstName ?? ''}
                        onChange={(e) => {
                          const colIndex = e.target.value ? parseInt(e.target.value) : undefined;
                          setColumnMapping(prev => {
                            const newMapping = { ...prev, firstName: colIndex };
                            // Eğer ad seçildiyse ve tam isim sütunu seçiliyse, tam isim sütununu temizle
                            if (colIndex !== undefined && prev.name !== undefined) {
                              delete newMapping.name;
                            }
                            return newMapping;
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                      >
                        <option value="">Sütun seçin...</option>
                        {parsedData.headers?.map((header, index) => (
                          <option key={index} value={index}>
                            Sütun {index + 1}: {header || `(Boş)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Last Name Column Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Soyad Sütunu <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={columnMapping.lastName ?? ''}
                        onChange={(e) => {
                          const colIndex = e.target.value ? parseInt(e.target.value) : undefined;
                          setColumnMapping(prev => {
                            const newMapping = { ...prev, lastName: colIndex };
                            // Eğer soyad seçildiyse ve tam isim sütunu seçiliyse, tam isim sütununu temizle
                            if (colIndex !== undefined && prev.name !== undefined) {
                              delete newMapping.name;
                            }
                            return newMapping;
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                      >
                        <option value="">Sütun seçin...</option>
                        {parsedData.headers?.map((header, index) => (
                          <option key={index} value={index}>
                            Sütun {index + 1}: {header || `(Boş)`}
                          </option>
                        ))}
                      </select>
                    </div>
                    </div>
                    )}
                </div>

                {/* Option 2: Full Name in One Column */}
                <div 
                  className={`p-5 rounded-xl shadow-sm transition-all cursor-pointer ${
                    selectedOption === 'full'
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-500' 
                      : selectedOption === 'separate'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 opacity-40'
                      : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600'
                  }`}
                  onClick={() => {
                    setSelectedOption('full');
                    setColumnMapping(prev => {
                      const newMapping = { ...prev };
                      delete newMapping.firstName;
                      delete newMapping.lastName;
                      return newMapping;
                    });
                  }}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Seçenek 2: Tam İsim Tek Sütunda
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Eğer Excel dosyanızda ad ve soyad aynı sütunda ise bu seçeneği kullanın
                  </p>
                  
                  {selectedOption === 'full' && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alıcı İsimleri Sütunu <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={columnMapping.name ?? ''}
                        onChange={(e) => {
                          const colIndex = e.target.value ? parseInt(e.target.value) : undefined;
                          setColumnMapping(prev => ({ ...prev, name: colIndex }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                      >
                        <option value="">Sütun seçin...</option>
                        {parsedData.headers?.map((header, index) => (
                          <option key={index} value={index}>
                            Sütun {index + 1}: {header || `(Boş)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Column Selection (Optional) */}
              <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-posta Sütunu (İsteğe bağlı)
                  </label>
                  <select
                    value={columnMapping.email ?? ''}
                    onChange={(e) => {
                      const colIndex = e.target.value ? parseInt(e.target.value) : undefined;
                      setColumnMapping(prev => ({ ...prev, email: colIndex }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  >
                    <option value="">Buradan seçebilirisiniz (veya boş bırakın)</option>
                    {parsedData.headers?.map((header, index) => (
                      <option key={index} value={index}>
                        Sütun {index + 1}: {header || `(Boş)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview */}
              {(columnMapping.name !== undefined || (columnMapping.firstName !== undefined && columnMapping.lastName !== undefined)) && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Önizleme (İlk 5 satır):
                  </p>
                  <div className="space-y-2">
                    {parsedData.data?.slice(1, 6).map((row, index) => {
                      let name = '(Boş)';
                      
                      // Eğer ad ve soyad ayrı ise birleştir
                      if (columnMapping.firstName !== undefined && columnMapping.lastName !== undefined) {
                        const firstName = row[columnMapping.firstName!];
                        const lastName = row[columnMapping.lastName!];
                        const fullName = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();
                        name = fullName ? ExcelParser.capitalizeName(fullName) : '(Boş)';
                      } 
                      // Eğer tam isim sütunu seçilmişse
                      else if (columnMapping.name !== undefined) {
                        const rawName = row[columnMapping.name!];
                        name = rawName ? ExcelParser.capitalizeName(String(rawName)) : '(Boş)';
                      }
                      
                      const email = columnMapping.email !== undefined ? row[columnMapping.email] : null;
                      return (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium">{index + 1}. {name}</div>
                          {email !== null && email !== undefined && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 ml-4">
                              📧 {String(email || '(Boş)')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && aiAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  AI Analiz Detayları
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Recipients List */}
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Tespit Edilen Alıcılar ({aiAnalysis.recipients.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {aiAnalysis.recipients.map((recipient, index) => (
                        <div key={index} className="text-neutral-700 dark:text-neutral-300">
                          {index + 1}. {recipient}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Raw Data Preview */}
                {parsedData && (
                  <div>
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      Excel Veri Önizlemesi (İlk 10 satır)
                    </h4>
                    <div className="overflow-x-auto bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-neutral-100 dark:bg-neutral-800">
                          <tr>
                            {parsedData.headers?.map((header, index) => (
                              <th key={index} className="px-3 py-2 text-left text-neutral-700 dark:text-neutral-300">
                                {header} {index === aiAnalysis.suggestedMapping.nameColumn && '👤'}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.data?.slice(1, 11).map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-neutral-200 dark:border-neutral-700">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-[#990000] hover:bg-[#880000] text-white rounded-md transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

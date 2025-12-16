import React, { useState } from 'react';
import { Download, Sparkles, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import ExcelParser from '@/utils/excelParser';

interface ExcelDemoProps {
  onDemoLoad: (recipients: string[]) => void;
}

export default function ExcelDemo({ onDemoLoad }: ExcelDemoProps) {
  const [isCreating, setIsCreating] = useState(false);

  const createDemoExcel = async () => {
    try {
      setIsCreating(true);
      
      // Demo verileri oluştur
      const demoData = ExcelParser.createDemoData();
      
      // CSV formatına çevir (basit demo için)
      const csvContent = demoData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // İndir
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'demo-katilimcilar.csv';
      link.click();
      
      // Demo recipients'ı yükle
      const recipients = ExcelParser.extractColumnValues(demoData, 0, true);
      onDemoLoad(recipients);
      
    } catch (error) {
      console.error('Demo oluşturma hatası:', error);
      alert('Demo dosyası oluşturulamadı');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              AI Excel Analizi
            </h4>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
              <Zap className="w-3 h-3 mr-1" />
              Akıllı
            </span>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            Gemini AI, Excel dosyanızı otomatik olarak analiz eder ve sertifika oluşturma sürecini hızlandırır.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-300">İsim sütununu otomatik tespit</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Veri kalitesi kontrolü</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Duplikasyon tespiti</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Akıllı alan önerileri</span>
            </div>
          </div>
          
          <button
            onClick={createDemoExcel}
            disabled={isCreating}
            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isCreating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Demo Excel İndir
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

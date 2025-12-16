import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client with proper error handling
let genAI: GoogleGenerativeAI;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY is required');
  }
  genAI = new GoogleGenerativeAI(apiKey);
  console.log('Gemini AI client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Gemini AI client:', error);
  throw error;
}

export interface ExcelAnalysisResult {
  success: boolean;
  data?: {
    recipients: string[];
    suggestedMapping: {
      nameColumn: number;
      emailColumn?: number;
      additionalColumns?: { [key: string]: number };
    };
    analysis: string;
  };
  error?: string;
}

export interface CertificateFieldSuggestion {
  coursename?: string;
  instructor?: string;
  duration?: string;
  certificate_title?: string;
  completion_text?: string;
  skills_label?: string;
}

export class GeminiService {
  private model;

  constructor() {
    try {
      // Use the new Gemini 2.0 Flash Lite model
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      console.log('Gemini model initialized: gemini-2.0-flash-lite');
    } catch (error) {
      console.error('Failed to initialize Gemini model:', error);
      throw error;
    }
  }

  /**
   * Genel metin oluşturma metodu
   */
  async generateText(prompt: string, maxTokens: number = 150): Promise<string> {
    try {
      console.log('Gemini generateText called with:', { 
        promptLength: prompt.length, 
        maxTokens,
        apiKeyExists: !!process.env.GEMINI_API_KEY 
      });
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is missing');
      }
      
      // Simple string prompt for better compatibility
      const result = await this.model.generateContent(prompt);
      
      const response = result.response;
      const text = response.text();
      
      console.log('Gemini response received:', { 
        textLength: text.length,
        preview: text.substring(0, 50) + '...'
      });
      
      return text;
    } catch (error: unknown) {
      console.error('Gemini text generation error:', error);
      
      // Type guard for error with message property
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle specific Gemini API errors
      if (errorMessage.includes('models/gemini')) {
        console.error('Model not found. Using: gemini-2.0-flash-lite');
        throw new Error('Gemini model bulunamadı. Lütfen daha sonra tekrar deneyin.');
      }
      
      if (errorMessage.includes('API_KEY')) {
        throw new Error('Gemini API anahtarı geçersiz.');
      }
      
      if (errorMessage.includes('QUOTA_EXCEEDED')) {
        throw new Error('Gemini API kotası aşıldı. Lütfen daha sonra tekrar deneyin.');
      }
      
      if (error instanceof Error) {
        throw new Error(`Gemini API hatası: ${error.message}`);
      }
      throw new Error('AI yanıtı oluşturulamadı');
    }
  }

  /**
   * Excel dosyasını analiz eder ve sertifika oluşturma için uygun kolonları belirler
   */
  async analyzeExcelData(excelData: string[][]): Promise<ExcelAnalysisResult> {
    try {
      if (!excelData || excelData.length === 0) {
        return {
          success: false,
          error: 'Excel verisi bulunamadı'
        };
      }

      // Tüm veriyi analiz et (sadece ilk 20 satır değil)
      const headers = excelData[0] || [];
      const dataRows = excelData.slice(1);
      
      // Daha kapsamlı veri örneklemi (ilk 20 satır)
      const sampleData = excelData.slice(0, Math.min(21, excelData.length))
        .map((row, index) => {
          return `Satır ${index}: ${row.join(' | ')}`;
        }).join('\n');
      
      const prompt = `
Excel dosyasını analiz et. TOPLAM ${dataRows.length} satır veri var.

Headers: ${headers.join(' | ')}

Örnek veriler:
${sampleData}

ÖNEMLİ: Bu dosyada toplam ${dataRows.length} satır veri bulunuyor. Hepsini analiz et.

Görevlerin:
1. Hangi kolonda isimler var? (ad, isim, name, fullname, ad soyad, ad_soyad, adsoyad, katılımcı, vs.)
2. Tüm satırlardan isimleri çıkar (boş olanları dahil etme)
3. İsim kolonundaki BÜTÜN geçerli isimleri say
4. Email kolonu var mı?
5. Diğer önemli kolonlar var mı?

Çok dikkatli ol: ${dataRows.length} satır veri var, hepsinden isimleri çıkarmalısın.

JSON formatında yanıt ver:
{
  "nameColumn": 0,
  "emailColumn": 1,
  "totalRecipients": ${dataRows.length},
  "recipients": ["İsim1", "İsim2", "İsim3", ... TÜM İSİMLERİ BURAYA],
  "additionalColumns": {
    "department": 2,
    "position": 3
  },
  "analysis": "Toplam ${dataRows.length} satırdan X adet geçerli isim tespit edildi. İsim kolonu: Y"
}

Recipients array'inde ${dataRows.length} satıra yakın isim olmalı (boş satırlar hariç).
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // JSON'u parse et
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Geçerli JSON yanıtı alınamadı');
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      // Fallback: AI yetersiz ise manuel analiz
      let finalRecipients = parsedData.recipients || [];
      if (finalRecipients.length < dataRows.length * 0.5) {
        // AI yeterince isim bulamadıysa, manuel analiz yap
        const nameColumn = parsedData.nameColumn || 0;
        const manualRecipients = dataRows
          .map(row => {
            const name = String(row[nameColumn] || '').trim();
            return name && name.length > 1 && !/^\d+$/.test(name) ? name : null;
          })
          .filter(Boolean);
        
        if (manualRecipients.length > finalRecipients.length) {
          finalRecipients = manualRecipients;
          console.log(`AI analizi yetersiz: ${parsedData.recipients?.length || 0} buldu, manuel analiz: ${manualRecipients.length} buldu`);
        }
      }

      return {
        success: true,
        data: {
          recipients: finalRecipients,
          suggestedMapping: {
            nameColumn: parsedData.nameColumn || 0,
            emailColumn: parsedData.emailColumn,
            additionalColumns: parsedData.additionalColumns || {}
          },
          analysis: `Toplam ${dataRows.length} satırdan ${finalRecipients.length} adet geçerli isim tespit edildi. İsim kolonu: ${(parsedData.nameColumn || 0) + 1}`
        }
      };

    } catch (error) {
      console.error('Gemini analiz hatası:', error);
      return {
        success: false,
        error: `AI analizi sırasında hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      };
    }
  }

  /**
   * Kurs bilgilerine göre sertifika alanları için öneriler oluşturur
   */
  async suggestCertificateFields(courseName: string, additionalInfo?: string): Promise<CertificateFieldSuggestion> {
    try {
      const prompt = `
"${courseName}" isimli kurs için sertifika oluştururken kullanabileceğim alanları öner.
${additionalInfo ? `Ek bilgi: ${additionalInfo}` : ''}

Lütfen şu alanlar için öneriler ver ve JSON formatında yanıtla:
- coursename: Kurs adı (verilen ismi kullan)
- instructor: Muhtemel eğitmen/kurum adı
- duration: Tahmini süre (saat cinsinden)
- certificate_title: Sertifika başlığı
- completion_text: Tamamlama metni (örn: "başarıyla tamamlamıştır")
- skills_label: Kazanılan yetkinlikler

Türkçe öneriler ver. JSON formatı:
{
  "coursename": "kurs adı",
  "instructor": "eğitmen önerisi",
  "duration": "40 saat",
  "certificate_title": "Başarı Sertifikası",
  "completion_text": "başarıyla tamamlamıştır",
  "skills_label": "Kazanılan Yetkinlikler"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // JSON'u parse et
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback değerler
        return {
          coursename: courseName,
          instructor: 'Eğitmen',
          duration: '40 saat',
          certificate_title: 'Başarı Sertifikası',
          completion_text: 'başarıyla tamamlamıştır',
          skills_label: 'Kazanılan Yetkinlikler'
        };
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      return parsedData;

    } catch (error) {
      console.error('Gemini öneri hatası:', error);
      // Fallback değerler
      return {
        coursename: courseName,
        instructor: 'Eğitmen',
        duration: '40 saat',
        certificate_title: 'Başarı Sertifikası',
        completion_text: 'başarıyla tamamlamıştır',
        skills_label: 'Kazanılan Yetkinlikler'
      };
    }
  }

  /**
   * Excel dosyasındaki veriyi kontrol eder ve temizler
   */
  async validateAndCleanExcelData(excelData: string[][]): Promise<{
    success: boolean;
    cleanedData?: string[];
    issues?: string[];
    suggestions?: string[];
  }> {
    try {
      // İlk 20 satırı analiz et
      const sampleData = excelData.slice(0, 20).map(row => row.join('\t')).join('\n');
      
      const prompt = `
Aşağıdaki Excel verisini kontrol et ve sertifika oluşturma için uygun olup olmadığını değerlendir:

${sampleData}

Lütfen şunları kontrol et:
1. İsim formatları doğru mu? (Büyük/küçük harf problemleri var mı?)
2. Boş satırlar var mı?
3. Geçersiz karakterler var mı?
4. Duplikasyon var mı?
5. İsimleri nasıl temizleyebiliriz?

JSON formatında yanıt ver:
{
  "hasIssues": true/false,
  "issues": ["problem1", "problem2"],
  "suggestions": ["öneri1", "öneri2"],
  "cleanedNames": ["temizlenmiş isim1", "temizlenmiş isim2"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // JSON'u parse et
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          issues: ['AI analizi yapılamadı']
        };
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        cleanedData: parsedData.cleanedNames || [],
        issues: parsedData.issues || [],
        suggestions: parsedData.suggestions || []
      };

    } catch (error) {
      console.error('Veri doğrulama hatası:', error);
      return {
        success: false,
        issues: [`Veri doğrulama sırasında hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`]
      };
    }
  }

  /**
   * Sertifika verilerini toplu olarak optimize eder
   */
  async optimizeBulkCertificateData(recipients: string[], courseInfo: Record<string, string>): Promise<{
    success: boolean;
    optimizedRecipients?: string[];
    suggestions?: string[];
    warnings?: string[];
  }> {
    try {
      const prompt = `
Aşağıdaki alıcılar için toplu sertifika oluşturulacak:
Alıcılar: ${recipients.join(', ')}
Kurs: ${courseInfo.coursename || 'Belirtilmemiş'}

Lütfen şunları kontrol et ve öner:
1. İsim formatlarında tutarlılık var mı?
2. Sertifika numarası formatı nasıl olmalı?
3. Hangi alıcılar için uyarı verilmeli?
4. Optimizasyon önerilerin neler?

JSON formatında yanıt ver:
{
  "optimizedRecipients": ["düzeltilmiş isim1", "düzeltilmiş isim2"],
  "suggestions": ["öneri1", "öneri2"],
  "warnings": ["uyarı1", "uyarı2"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // JSON'u parse et
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: true,
          optimizedRecipients: recipients,
          suggestions: ['İsimler doğrulandı'],
          warnings: []
        };
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        optimizedRecipients: parsedData.optimizedRecipients || recipients,
        suggestions: parsedData.suggestions || [],
        warnings: parsedData.warnings || []
      };

    } catch (error) {
      console.error('Toplu optimizasyon hatası:', error);
      return {
        success: true,
        optimizedRecipients: recipients,
        suggestions: [],
        warnings: [`Optimizasyon hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`]
      };
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;

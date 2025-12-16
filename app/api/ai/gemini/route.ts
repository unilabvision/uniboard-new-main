import { NextRequest, NextResponse } from 'next/server';
import GeminiService from '@/app/_services/geminiService';
import ExcelParser from '@/utils/excelParser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle direct prompt requests (for description generation)
    if (body.prompt) {
      return await handleDirectPrompt(body);
    }

    const { action, data } = body;

    switch (action) {
      case 'analyzeExcel':
        return await handleAnalyzeExcel(data);
      
      case 'suggestFields':
        return await handleSuggestFields(data);
      
      case 'validateData':
        return await handleValidateData(data);
      
      case 'optimizeBulk':
        return await handleOptimizeBulk(data);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Geçersiz işlem'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('AI API hatası:', error);
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası oluştu'
    }, { status: 500 });
  }
}

async function handleDirectPrompt(data: { prompt: string; maxTokens?: number }) {
  try {
    const { prompt, maxTokens = 150 } = data;
    
    console.log('Gemini API Request:', { prompt: prompt.substring(0, 100) + '...', maxTokens });
    
    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt gerekli'
      }, { status: 400 });
    }

    const response = await GeminiService.generateText(prompt, maxTokens);
    
    console.log('Gemini API Response:', response.substring(0, 100) + '...');
    
    return NextResponse.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Direkt prompt hatası:', error);
    return NextResponse.json({
      success: false,
      error: `AI yanıtı oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    }, { status: 500 });
  }
}

async function handleAnalyzeExcel(data: { excelData: string[][] }) {
  try {
    const { excelData } = data;
    
    if (!excelData || !Array.isArray(excelData)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz Excel verisi'
      }, { status: 400 });
    }

    // Excel verilerini analiz et
    const analysisResult = await GeminiService.analyzeExcelData(excelData);
    
    // Veri validasyonu yap
    const validation = ExcelParser.validateData(excelData);
    
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      validation
    });
  } catch (error) {
    console.error('Excel analiz hatası:', error);
    return NextResponse.json({
      success: false,
      error: 'Excel analizi sırasında hata oluştu'
    }, { status: 500 });
  }
}

async function handleSuggestFields(data: { courseName: string; additionalInfo?: string }) {
  try {
    const { courseName, additionalInfo } = data;
    
    if (!courseName) {
      return NextResponse.json({
        success: false,
        error: 'Kurs adı gerekli'
      }, { status: 400 });
    }

    const suggestions = await GeminiService.suggestCertificateFields(courseName, additionalInfo);
    
    return NextResponse.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Alan önerisi hatası:', error);
    return NextResponse.json({
      success: false,
      error: 'Alan önerisi sırasında hata oluştu'
    }, { status: 500 });
  }
}

async function handleValidateData(data: { excelData: string[][] }) {
  try {
    const { excelData } = data;
    
    const validationResult = await GeminiService.validateAndCleanExcelData(excelData);
    
    return NextResponse.json({
      success: true,
      validation: validationResult
    });
  } catch (error) {
    console.error('Veri doğrulama hatası:', error);
    return NextResponse.json({
      success: false,
      error: 'Veri doğrulama sırasında hata oluştu'
    }, { status: 500 });
  }
}

async function handleOptimizeBulk(data: { recipients: string[]; courseInfo: Record<string, string> }) {
  try {
    const { recipients, courseInfo } = data;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Alıcı listesi gerekli'
      }, { status: 400 });
    }

    const optimizationResult = await GeminiService.optimizeBulkCertificateData(recipients, courseInfo);
    
    return NextResponse.json({
      success: true,
      optimization: optimizationResult
    });
  } catch (error) {
    console.error('Toplu optimizasyon hatası:', error);
    return NextResponse.json({
      success: false,
      error: 'Toplu optimizasyon sırasında hata oluştu'
    }, { status: 500 });
  }
}

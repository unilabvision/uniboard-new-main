import * as XLSX from 'xlsx';

export interface ParsedExcelData {
  success: boolean;
  data?: any[][];
  headers?: string[];
  error?: string;
  rowCount?: number;
  columnCount?: number;
}

export interface ExcelParseOptions {
  maxRows?: number;
  skipEmptyRows?: boolean;
  trimValues?: boolean;
}

export class ExcelParser {
  /**
   * Excel dosyasını parse eder ve 2D array olarak döndürür
   */
  static async parseFile(file: File, options: ExcelParseOptions = {}): Promise<ParsedExcelData> {
    try {
      const {
        maxRows = 1000,
        skipEmptyRows = true,
        trimValues = true
      } = options;

      // CSV dosyası ise özel işleme
      if (file.name.toLowerCase().endsWith('.csv')) {
        return await this.parseCSVFile(file, options);
      }

      // Dosyayı ArrayBuffer olarak oku
      const arrayBuffer = await file.arrayBuffer();
      
      // XLSX ile workbook oluştur
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      // İlk worksheet'i al
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return {
          success: false,
          error: 'Excel dosyasında sheet bulunamadı'
        };
      }

      const worksheet = workbook.Sheets[firstSheetName];
      
      // Worksheet'i JSON'a çevir
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false
      }) as any[][];

      if (!jsonData || jsonData.length === 0) {
        return {
          success: false,
          error: 'Excel dosyası boş veya okunamıyor'
        };
      }

      // Verileri temizle
      let cleanedData = jsonData;

      // Boş satırları atla
      if (skipEmptyRows) {
        cleanedData = cleanedData.filter(row => 
          row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );
      }

      // Değerleri temizle
      if (trimValues) {
        cleanedData = cleanedData.map(row =>
          row.map(cell => typeof cell === 'string' ? cell.trim() : cell)
        );
      }

      // Maksimum satır kontrolü
      if (cleanedData.length > maxRows) {
        cleanedData = cleanedData.slice(0, maxRows);
      }

      // Header'ları belirle (ilk satır)
      const headers = cleanedData.length > 0 ? cleanedData[0].map(String) : [];

      return {
        success: true,
        data: cleanedData,
        headers,
        rowCount: cleanedData.length,
        columnCount: cleanedData.length > 0 ? cleanedData[0].length : 0
      };

    } catch (error) {
      console.error('Excel parse hatası:', error);
      return {
        success: false,
        error: `Excel dosyası parse edilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      };
    }
  }

  /**
   * CSV dosyasını UTF-8 encoding ile parse eder
   */
  static async parseCSVFile(file: File, options: ExcelParseOptions = {}): Promise<ParsedExcelData> {
    try {
      const {
        maxRows = 1000,
        skipEmptyRows = true,
        trimValues = true
      } = options;

      // CSV dosyasını text olarak oku (UTF-8 encoding)
      const text = await file.text();
      
      // BOM (Byte Order Mark) karakterini kaldır
      const cleanText = text.replace(/^\uFEFF/, '');
      
      // CSV satırlarını parse et
      const lines: string[] = [];
      let currentLine = '';
      let inQuotes = false;
      
      for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Çift tırnak (escaped quote)
            currentLine += '"';
            i++; // Bir sonraki karakteri atla
          } else {
            // Tırnak başlangıcı/bitişi
            inQuotes = !inQuotes;
          }
        } else if (char === '\n' && !inQuotes) {
          // Satır sonu (tırnak içinde değilse)
          lines.push(currentLine);
          currentLine = '';
        } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
          // Windows satır sonu (\r\n)
          lines.push(currentLine);
          currentLine = '';
          i++; // \n karakterini atla
        } else if (char !== '\r') {
          // \r karakterini atla (sadece \n ile birlikte kullanılıyorsa)
          currentLine += char;
        }
      }
      
      // Son satırı ekle
      if (currentLine || lines.length === 0) {
        lines.push(currentLine);
      }
      
      // CSV satırlarını parse et (virgül veya noktalı virgül ile ayrılmış)
      const data: any[][] = [];
      const delimiter = lines[0]?.includes(';') ? ';' : ',';
      
      for (const line of lines) {
        if (!line.trim() && skipEmptyRows) continue;
        
        const cells: string[] = [];
        let currentCell = '';
        let inCellQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"') {
            if (inCellQuotes && nextChar === '"') {
              currentCell += '"';
              i++;
            } else {
              inCellQuotes = !inCellQuotes;
            }
          } else if (char === delimiter && !inCellQuotes) {
            cells.push(trimValues ? currentCell.trim() : currentCell);
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        
        // Son hücreyi ekle
        cells.push(trimValues ? currentCell.trim() : currentCell);
        data.push(cells);
      }
      
      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'CSV dosyası boş veya okunamıyor'
        };
      }
      
      // Boş satırları atla
      let cleanedData = data;
      if (skipEmptyRows) {
        cleanedData = cleanedData.filter(row => 
          row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );
      }
      
      // Maksimum satır kontrolü
      if (cleanedData.length > maxRows) {
        cleanedData = cleanedData.slice(0, maxRows);
      }
      
      // Header'ları belirle (ilk satır)
      const headers = cleanedData.length > 0 ? cleanedData[0].map(String) : [];
      
      return {
        success: true,
        data: cleanedData,
        headers,
        rowCount: cleanedData.length,
        columnCount: cleanedData.length > 0 ? cleanedData[0].length : 0
      };
      
    } catch (error) {
      console.error('CSV parse hatası:', error);
      return {
        success: false,
        error: `CSV dosyası parse edilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      };
    }
  }

  /**
   * İsmi capitalize eder (her kelimenin baş harfini büyütür)
   * Türkçe karakterleri dikkate alır
   */
  static capitalizeName(name: string): string {
    if (!name) return name;
    
    // Türkçe locale ile küçük harfe çevir
    const lowerName = name.toLocaleLowerCase('tr-TR');
    
    return lowerName
      .split(' ')
      .map(word => {
        if (!word) return word;
        
        // İlk karakteri Türkçe locale ile büyük harfe çevir
        const firstChar = word[0];
        const restOfWord = word.slice(1);
        const capitalizedFirst = firstChar.toLocaleUpperCase('tr-TR');
        
        return capitalizedFirst + restOfWord;
      })
      .join(' ');
  }

  /**
   * Belirli bir kolondan değerleri çıkarır ve temizler
   */
  static extractColumnValues(data: any[][], columnIndex: number, skipHeader = true): string[] {
    try {
      const startRow = skipHeader ? 1 : 0;
      const values: string[] = [];

      for (let i = startRow; i < data.length; i++) {
        const row = data[i];
        if (row && row[columnIndex] !== undefined && row[columnIndex] !== null) {
          let value = String(row[columnIndex]).trim();
          
          // Boş değerleri atla
          if (!value) continue;
          
          // Temel temizleme işlemleri
          value = value
            .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
            .replace(/[""'']/g, '') // Tırnak işaretlerini kaldır
            .replace(/^\.|\.$/g, '') // Başta ve sonda nokta varsa kaldır
            .trim();
          
          // Geçerli isim kontrolü (daha esnek)
          if (value.length >= 2 && value.length <= 100) {
            // En az bir harf içermeli
            if (/[a-zA-ZğüşöçıĞÜŞÖÇİ]/.test(value)) {
              // Sadece sayı değilse ekle
              if (!/^\d+$/.test(value)) {
                // İsmi capitalize et
                value = this.capitalizeName(value);
                values.push(value);
              }
            }
          }
        }
      }

      return values;
    } catch (error) {
      console.error('Kolon çıkarma hatası:', error);
      return [];
    }
  }

  /**
   * İsim kolonunu otomatik olarak tespit eder
   */
  static detectNameColumn(data: any[][]): number {
    if (!data || data.length < 2) return 0;

    const headers = data[0];
    
    // İsim ile ilgili anahtar kelimeler (daha kapsamlı)
    const nameKeywords = [
      'ad', 'isim', 'name', 'fullname', 'ad soyad', 'adsoyad', 'tam ad', 'tam isim',
      'first name', 'last name', 'full name', 'participant', 'ad soyad1', 'ad_soyad',
      'katılımcı', 'öğrenci', 'student', 'kişi', 'person', 'alıcı', 'receiver',
      'member', 'üye', 'employee', 'çalışan', 'personel', 'staff'
    ];

    // Header'larda isim kolonunu ara
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i]).toLowerCase().trim();
      if (nameKeywords.some(keyword => header.includes(keyword))) {
        return i;
      }
    }

    // Header'da bulamazsa tüm kolonlardaki veri tipini analiz et
    const columnScores: number[] = new Array(headers.length).fill(0);
    
    // İlk 10 satırı kontrol et
    for (let rowIndex = 1; rowIndex < Math.min(data.length, 11); rowIndex++) {
      const row = data[rowIndex];
      if (!row) continue;

      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const value = String(row[colIndex] || '').trim();
        
        if (value) {
          // İsim skorlama kriterleri
          let score = 0;
          
          // Türkçe karakterler içeriyor mu
          if (/[a-zA-ZğüşöçıĞÜŞÖÇİ]/.test(value)) score += 2;
          
          // Boşluk içeriyor mu (ad soyad)
          if (value.includes(' ')) score += 3;
          
          // Sadece harfler ve boşluk mu
          if (/^[a-zA-ZğüşöçıĞÜŞÖÇİ\s.-]+$/.test(value)) score += 2;
          
          // En az 2 kelime var mı
          if (value.split(' ').length >= 2) score += 3;
          
          // Uzunluk uygun mu (2-50 karakter)
          if (value.length >= 2 && value.length <= 50) score += 1;
          
          // Sayı içermiyorsa bonus
          if (!/\d/.test(value)) score += 1;
          
          // Email değilse bonus
          if (!/@/.test(value)) score += 1;

          columnScores[colIndex] += score;
        }
      }
    }

    // En yüksek skora sahip kolonu döndür
    const maxScore = Math.max(...columnScores);
    const bestColumnIndex = columnScores.indexOf(maxScore);
    
    return maxScore > 0 ? bestColumnIndex : 0;
  }

  /**
   * Email kolonunu otomatik olarak tespit eder
   */
  static detectEmailColumn(data: any[][]): number | null {
    if (!data || data.length < 2) return null;

    const headers = data[0];
    
    // Email ile ilgili anahtar kelimeler
    const emailKeywords = ['email', 'e-mail', 'mail', 'e-posta', 'eposta'];

    // Header'larda email kolonunu ara
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i]).toLowerCase().trim();
      if (emailKeywords.some(keyword => header.includes(keyword))) {
        return i;
      }
    }

    // Header'da bulamazsa ilk satırdaki verilere bak
    const firstDataRow = data[1];
    if (firstDataRow) {
      for (let i = 0; i < firstDataRow.length; i++) {
        const value = String(firstDataRow[i]).trim();
        // Email formatını kontrol et
        if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return i;
        }
      }
    }

    return null;
  }

  static normalizeEmail(value: unknown): string | undefined {
    const email = String(value ?? '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return undefined;
    }
    return email;
  }

  /**
   * İsim ve e-posta sütunlarından alıcı listesi oluşturur
   */
  static buildRecipientsWithEmails(
    data: any[][],
    options: {
      nameColumn?: number;
      firstNameColumn?: number;
      lastNameColumn?: number;
      emailColumn?: number | null;
    }
  ): Array<{ name: string; email?: string }> {
    if (!data || data.length < 2) return [];

    const { nameColumn, firstNameColumn, lastNameColumn, emailColumn } = options;
    const recipients: Array<{ name: string; email?: string }> = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      let name = '';
      if (firstNameColumn !== undefined && lastNameColumn !== undefined) {
        const fullName = `${String(row[firstNameColumn] || '').trim()} ${String(row[lastNameColumn] || '').trim()}`.trim();
        name = fullName ? this.capitalizeName(fullName) : '';
      } else if (nameColumn !== undefined) {
        const rawName = row[nameColumn];
        name = rawName ? this.capitalizeName(String(rawName)) : '';
      }

      if (!name) continue;

      const email =
        emailColumn !== undefined && emailColumn !== null
          ? this.normalizeEmail(row[emailColumn])
          : undefined;

      recipients.push({ name, email });
    }

    return recipients;
  }

  /**
   * Excel verilerini validasyondan geçirir
   */
  static validateData(data: any[][]): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!data || data.length === 0) {
      issues.push('Veri bulunamadı');
      return { isValid: false, issues, warnings, suggestions };
    }

    if (data.length < 2) {
      issues.push('En az 2 satır veri gerekli (header + veri)');
      return { isValid: false, issues, warnings, suggestions };
    }

    const nameColumnIndex = this.detectNameColumn(data);
    const names = this.extractColumnValues(data, nameColumnIndex);

    if (names.length === 0) {
      // Diğer kolonları da dene
      let foundNames = false;
      for (let colIndex = 0; colIndex < (data[0]?.length || 0); colIndex++) {
        const testNames = this.extractColumnValues(data, colIndex);
        if (testNames.length > 0) {
          foundNames = true;
          warnings.push(`Kolon ${colIndex + 1}'de ${testNames.length} isim bulundu`);
        }
      }
      
      if (!foundNames) {
        issues.push('Hiçbir kolondan geçerli isim verisi bulunamadı');
        return { isValid: false, issues, warnings, suggestions };
      }
    }

    // İsim validasyonları (daha detaylı)
    let invalidNames = 0;
    let shortNames = 0;
    let numericNames = 0;
    let emptyNames = 0;
    
    names.forEach(name => {
      // Boş isimler
      if (!name || name.trim() === '') {
        emptyNames++;
        return;
      }
      
      // Çok kısa isimler
      if (name.length < 2) {
        shortNames++;
      }
      
      // Sadece sayı olanlar
      if (/^\d+$/.test(name)) {
        numericNames++;
      }
      
      // Geçersiz karakterler (daha esnek kontrol)
      if (!/^[a-zA-ZğüşöçıĞÜŞÖÇİ\s.\-']+$/.test(name)) {
        invalidNames++;
      }
    });

    if (emptyNames > 0) {
      warnings.push(`${emptyNames} boş isim satırı atlandı`);
    }

    if (invalidNames > 0) {
      warnings.push(`${invalidNames} isimde geçersiz karakterler tespit edildi`);
    }

    if (shortNames > 0) {
      warnings.push(`${shortNames} isim çok kısa görünüyor`);
    }

    if (numericNames > 0) {
      warnings.push(`${numericNames} sadece sayı içeren satır atlandı`);
    }

    // Duplikasyon kontrolü (case-insensitive)
    const normalizedNames = names.map(name => name.toLowerCase().trim());
    const uniqueNames = new Set(normalizedNames);
    if (uniqueNames.size < normalizedNames.length) {
      warnings.push(`${normalizedNames.length - uniqueNames.size} duplicate isim tespit edildi`);
    }

    // Öneriler
    if (names.length > 100) {
      suggestions.push('Çok sayıda alıcı var, işlem biraz zaman alabilir');
    } else if (names.length > 50) {
      suggestions.push('Orta seviyede alıcı sayısı, işlem kısa sürecek');
    }

    if (data[0].length > 3) {
      suggestions.push('Ek bilgiler için diğer kolonlar da kullanılabilir');
    }

    // İsim kolonu önerisi
    const detectedColumn = this.detectNameColumn(data);
    if (detectedColumn !== 0) {
      suggestions.push(`İsim kolonu olarak ${detectedColumn + 1}. kolon öneriliyor`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      suggestions
    };
  }

  /**
   * Demo Excel verisi oluşturur (test için)
   */
  static createDemoData(): any[][] {
    return [
      ['Ad Soyad', 'E-posta', 'Departman', 'Pozisyon'],
      ['Ahmet Yılmaz', 'ahmet@example.com', 'IT', 'Yazılım Geliştirici'],
      ['Ayşe Kaya', 'ayse@example.com', 'İK', 'İK Uzmanı'],
      ['Mehmet Demir', 'mehmet@example.com', 'Pazarlama', 'Pazarlama Uzmanı'],
      ['Fatma Öztürk', 'fatma@example.com', 'Muhasebe', 'Mali Müşavir'],
      ['Ali Çelik', 'ali@example.com', 'IT', 'Sistem Yöneticisi']
    ];
  }
}

export default ExcelParser;

import * as XLSX from 'xlsx';
import csvParser from 'csv-parser';
import pdfParse from 'pdf-parse';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

export interface InvoiceItem {
  drugName: string;
  strength: string;
  formulation: string;
  doseInstructions: string;
  payer: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ParsedInvoice {
  items: InvoiceItem[];
  totalAmount: number;
  itemCount: number;
}

export class FileParser {
  /**
   * Parse invoice file based on its type
   */
  async parseFile(fileBuffer: Buffer, fileName: string): Promise<ParsedInvoice> {
    const fileType = this.detectFileType(fileName);
    
    switch (fileType) {
      case 'excel':
        return this.parseExcel(fileBuffer);
      case 'csv':
        return this.parseCSV(fileBuffer);
      case 'pdf':
        return this.parsePDF(fileBuffer);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Detect file type based on extension
   */
  private detectFileType(fileName: string): 'excel' | 'csv' | 'pdf' {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return 'excel';
      case 'csv':
        return 'csv';
      case 'pdf':
        return 'pdf';
      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }
  }

  /**
   * Parse Excel files (.xlsx, .xls)
   */
  private async parseExcel(fileBuffer: Buffer): Promise<ParsedInvoice> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);
      
      const items = this.parseExcelRows(headers, dataRows);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      return {
        items,
        totalAmount,
        itemCount: items.length
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse CSV files
   */
  private async parseCSV(fileBuffer: Buffer): Promise<ParsedInvoice> {
    return new Promise((resolve, reject) => {
      const items: InvoiceItem[] = [];
      const stream = Readable.from(fileBuffer);
      
      stream
        .pipe(csvParser())
        .on('data', (row: any) => {
          try {
            const item = this.parseCSVRow(row);
            if (item) {
              items.push(item);
            }
          } catch (error) {
            console.warn('Skipping invalid CSV row:', error);
          }
        })
        .on('end', () => {
          if (items.length === 0) {
            reject(new Error('No valid data found in CSV file'));
            return;
          }
          
          const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
          resolve({
            items,
            totalAmount,
            itemCount: items.length
          });
        })
        .on('error', (error: any) => {
          reject(new Error(`Failed to parse CSV file: ${error.message}`));
        });
    });
  }

  /**
   * Parse PDF files
   */
  private async parsePDF(fileBuffer: Buffer): Promise<ParsedInvoice> {
    try {
      const data = await pdfParse(fileBuffer);
      const text = data.text;
      
      // Extract table-like data from PDF text
      const items = this.extractTableDataFromPDF(text);
      
      if (items.length === 0) {
        throw new Error('No table data found in PDF');
      }
      
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      return {
        items,
        totalAmount,
        itemCount: items.length
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Excel rows into InvoiceItem objects
   */
  private parseExcelRows(headers: string[], dataRows: any[]): InvoiceItem[] {
    const items: InvoiceItem[] = [];
    
    for (const row of dataRows) {
      try {
        const item = this.parseExcelRow(headers, row);
        if (item) {
          items.push(item);
        }
      } catch (error) {
        console.warn('Skipping invalid Excel row:', error);
      }
    }
    
    return items;
  }

  /**
   * Parse single Excel row
   */
  private parseExcelRow(headers: string[], row: any[]): InvoiceItem | null {
    // Map common column names to our structure
    const columnMap = this.createColumnMap(headers);
    
    if (!this.hasRequiredColumns(columnMap)) {
      return null;
    }
    
    return {
      drugName: this.extractValue(row, columnMap.drugName, headers),
      strength: this.extractValue(row, columnMap.strength, headers),
      formulation: this.extractValue(row, columnMap.formulation, headers),
      doseInstructions: this.extractValue(row, columnMap.doseInstructions, headers),
      payer: this.extractValue(row, columnMap.payer, headers),
      quantity: this.extractNumber(row, columnMap.quantity, headers),
      unitPrice: this.extractNumber(row, columnMap.unitPrice, headers),
      total: this.extractNumber(row, columnMap.total, headers)
    };
  }

  /**
   * Parse CSV row into InvoiceItem object
   */
  private parseCSVRow(row: any): InvoiceItem | null {
    const columnMap = this.createColumnMap(Object.keys(row));
    
    if (!this.hasRequiredColumns(columnMap)) {
      return null;
    }
    
    return {
      drugName: this.extractValueFromObject(row, columnMap.drugName),
      strength: this.extractValueFromObject(row, columnMap.strength),
      formulation: this.extractValueFromObject(row, columnMap.formulation),
      doseInstructions: this.extractValueFromObject(row, columnMap.doseInstructions),
      payer: this.extractValueFromObject(row, columnMap.payer),
      quantity: this.extractNumberFromObject(row, columnMap.quantity),
      unitPrice: this.extractNumberFromObject(row, columnMap.unitPrice),
      total: this.extractNumberFromObject(row, columnMap.total)
    };
  }

  /**
   * Create column mapping for different file formats
   */
  private createColumnMap(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('drug') || lowerHeader.includes('medication')) {
        map.drugName = index;
      } else if (lowerHeader.includes('strength')) {
        map.strength = index;
      } else if (lowerHeader.includes('formulation') || lowerHeader.includes('form')) {
        map.formulation = index;
      } else if (lowerHeader.includes('dose') || lowerHeader.includes('instruction')) {
        map.doseInstructions = index;
      } else if (lowerHeader.includes('payer') || lowerHeader.includes('insurance')) {
        map.payer = index;
      } else if (lowerHeader.includes('qty') || lowerHeader.includes('quantity')) {
        map.quantity = index;
      } else if (lowerHeader.includes('unit') && lowerHeader.includes('price')) {
        map.unitPrice = index;
      } else if (lowerHeader.includes('total')) {
        map.total = index;
      }
    });
    
    return map;
  }

  /**
   * Check if required columns are present
   */
  private hasRequiredColumns(columnMap: Record<string, number>): boolean {
    const required = ['drugName', 'strength', 'formulation', 'payer', 'quantity', 'unitPrice', 'total'];
    return required.every(col => columnMap[col] !== undefined);
  }

  /**
   * Extract value from array-based data (Excel)
   */
  private extractValue(row: any[], columnIndex: number, headers: string[]): string {
    const value = row[columnIndex];
    if (value === undefined || value === null) {
      throw new Error(`Missing value for column: ${headers[columnIndex]}`);
    }
    return String(value).trim();
  }

  /**
   * Extract number from array-based data (Excel)
   */
  private extractNumber(row: any[], columnIndex: number, headers: string[]): number {
    const value = this.extractValue(row, columnIndex, headers);
    const num = parseFloat(value.replace(/[$,]/g, ''));
    if (isNaN(num)) {
      throw new Error(`Invalid number for column: ${headers[columnIndex]}`);
    }
    return num;
  }

  /**
   * Extract value from object-based data (CSV)
   */
  private extractValueFromObject(row: any, columnIndex: number): string {
    const headers = Object.keys(row);
    const header = headers[columnIndex];
    if (!header) {
      throw new Error(`Column index ${columnIndex} not found`);
    }
    const value = row[header];
    if (value === undefined || value === null) {
      throw new Error(`Missing value for column: ${header}`);
    }
    return String(value).trim();
  }

  /**
   * Extract number from object-based data (CSV)
   */
  private extractNumberFromObject(row: any, columnIndex: number): number {
    const value = this.extractValueFromObject(row, columnIndex);
    const num = parseFloat(value.replace(/[$,]/g, ''));
    if (isNaN(num)) {
      throw new Error(`Invalid number value: ${value}`);
    }
    return num;
  }

  /**
   * Extract table data from PDF text
   */
  private extractTableDataFromPDF(text: string): InvoiceItem[] {
    // This is a simplified PDF parser - in production you might want to use
    // more sophisticated PDF parsing libraries that can better handle tables
    
    const lines = text.split('\n').filter(line => line.trim());
    const items: InvoiceItem[] = [];
    
    // Look for patterns that suggest table data
    // This is a basic implementation and may need refinement based on actual PDF formats
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines and empty lines
      if (line.toLowerCase().includes('drug') || line.toLowerCase().includes('medication') || !line.trim()) {
        continue;
      }
      
      // Try to parse line as table row
      try {
        const item = this.parsePDFLine(line);
        if (item) {
          items.push(item);
        }
      } catch (error) {
        // Skip lines that can't be parsed
        continue;
      }
    }
    
    return items;
  }

  /**
   * Parse single PDF line (simplified)
   */
  private parsePDFLine(line: string): InvoiceItem | null {
    // This is a very basic PDF line parser
    // In production, you'd want more sophisticated parsing logic
    
    const parts = line.split(/\s+/).filter(part => part.trim());
    
    if (parts.length < 6) {
      return null;
    }
    
    // This is a simplified approach - real implementation would need
    // more sophisticated parsing based on actual PDF structure
    try {
      return {
        drugName: parts[0] || 'Unknown',
        strength: parts[1] || 'Unknown',
        formulation: parts[2] || 'Unknown',
        doseInstructions: parts[3] || 'Unknown',
        payer: parts[4] || 'Unknown',
        quantity: parseFloat(parts[5]) || 0,
        unitPrice: parseFloat(parts[6]) || 0,
        total: parseFloat(parts[7]) || 0
      };
    } catch (error) {
      return null;
    }
  }
}

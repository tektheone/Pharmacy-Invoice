import { FileParser } from '../src/services/fileParser';

describe('FileParser', () => {
  let fileParser: FileParser;

  beforeEach(() => {
    fileParser = new FileParser();
  });

  describe('detectFileType', () => {
    it('should detect Excel files correctly', () => {
      const parser = fileParser as any; // Access private method for testing
      
      expect(parser.detectFileType('invoice.xlsx')).toBe('excel');
      expect(parser.detectFileType('invoice.xls')).toBe('excel');
    });

    it('should detect CSV files correctly', () => {
      const parser = fileParser as any;
      
      expect(parser.detectFileType('invoice.csv')).toBe('csv');
    });

    it('should detect PDF files correctly', () => {
      const parser = fileParser as any;
      
      expect(parser.detectFileType('invoice.pdf')).toBe('pdf');
    });

    it('should throw error for unsupported file types', () => {
      const parser = fileParser as any;
      
      expect(() => parser.detectFileType('invoice.txt')).toThrow('Unsupported file extension: txt');
    });
  });

  describe('column mapping', () => {
    it('should create correct column mapping for Excel headers', () => {
      const headers = ['Drug Name', 'Strength', 'Formulation', 'Dose & Instructions', 'Payer', 'Qty', 'Unit Price', 'Total'];
      const parser = fileParser as any;
      
      const columnMap = parser.createColumnMap(headers);
      
      expect(columnMap.drugName).toBe(0);
      expect(columnMap.strength).toBe(1);
      expect(columnMap.formulation).toBe(2);
      expect(columnMap.doseInstructions).toBe(3);
      expect(columnMap.payer).toBe(4);
      expect(columnMap.quantity).toBe(5);
      expect(columnMap.unitPrice).toBe(6);
      expect(columnMap.total).toBe(7);
    });

    it('should handle variations in column names', () => {
      const headers = ['Medication', 'Strength', 'Form', 'Instructions', 'Insurance', 'Quantity', 'Price per Unit', 'Total Cost'];
      const parser = fileParser as any;
      
      const columnMap = parser.createColumnMap(headers);
      
      expect(columnMap.drugName).toBe(0);
      expect(columnMap.strength).toBe(1);
      expect(columnMap.formulation).toBe(2);
      expect(columnMap.doseInstructions).toBe(3);
      expect(columnMap.payer).toBe(4);
      expect(columnMap.quantity).toBe(5);
      expect(columnMap.unitPrice).toBe(6);
      expect(columnMap.total).toBe(7);
    });
  });

  describe('data extraction', () => {
    it('should extract values correctly from Excel rows', () => {
      const headers = ['Drug Name', 'Strength', 'Formulation', 'Dose & Instructions', 'Payer', 'Qty', 'Unit Price', 'Total'];
      const row = ['Amoxicillin', '500 mg', 'Capsule', '1 capsule 3x daily', 'medicaid', 30, 0.50, 15.00];
      const parser = fileParser as any;
      
      const columnMap = parser.createColumnMap(headers);
      const item = parser.parseExcelRow(headers, row);
      
      expect(item).toEqual({
        drugName: 'Amoxicillin',
        strength: '500 mg',
        formulation: 'Capsule',
        doseInstructions: '1 capsule 3x daily',
        payer: 'medicaid',
        quantity: 30,
        unitPrice: 0.50,
        total: 15.00
      });
    });

    it('should handle missing required columns', () => {
      const headers = ['Drug Name', 'Strength']; // Missing required columns
      const row = ['Amoxicillin', '500 mg'];
      const parser = fileParser as any;
      
      const columnMap = parser.createColumnMap(headers);
      const item = parser.parseExcelRow(headers, row);
      
      expect(item).toBeNull(); // Should return null for incomplete data
    });

    it('should check if required columns are present', () => {
      const parser = fileParser as any;
      
      const completeColumnMap = {
        drugName: 0,
        strength: 1,
        formulation: 2,
        payer: 3,
        quantity: 4,
        unitPrice: 5,
        total: 6
      };
      
      const incompleteColumnMap = {
        drugName: 0,
        strength: 1
      };
      
      expect(parser.hasRequiredColumns(completeColumnMap)).toBe(true);
      expect(parser.hasRequiredColumns(incompleteColumnMap)).toBe(false);
    });
  });

  describe('value extraction', () => {
    it('should extract string values correctly', () => {
      const parser = fileParser as any;
      const headers = ['Drug Name', 'Strength'];
      const row = ['Amoxicillin', '500 mg'];
      
      const value = parser.extractValue(row, 0, headers);
      expect(value).toBe('Amoxicillin');
    });

    it('should extract numeric values correctly', () => {
      const parser = fileParser as any;
      const headers = ['Qty', 'Unit Price'];
      const row = [30, 0.50];
      
      const quantity = parser.extractNumber(row, 0, headers);
      const price = parser.extractNumber(row, 1, headers);
      
      expect(quantity).toBe(30);
      expect(price).toBe(0.50);
    });

    it('should handle currency formatting in numbers', () => {
      const parser = fileParser as any;
      const headers = ['Total'];
      const row = ['$15.00'];
      
      const total = parser.extractNumber(row, 0, headers);
      expect(total).toBe(15.00);
    });
  });
});

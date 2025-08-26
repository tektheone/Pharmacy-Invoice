// API service for pharmacy data validation
// This would be used to communicate with your Express.js backend

export interface Drug {
  id: string;
  name: string;
  formulation: string;
  strength: string;
  unitPrice: number;
  payer: string;
}

export interface InvoiceItem {
  id: string;
  drugName: string;
  formulation: string;
  strength: string;
  unitPrice: number;
  quantity: number;
  payer: string;
  totalAmount: number;
}

export interface Discrepancy {
  id: string;
  invoiceItem: InvoiceItem;
  referenceDrug: Drug | null;
  type: 'price_overcharge' | 'formulation_mismatch' | 'strength_mismatch' | 'payer_mismatch' | 'drug_not_found';
  severity: 'high' | 'medium' | 'low';
  description: string;
  overchargePercentage?: number;
  expectedValue?: string;
  actualValue?: string;
}

export interface ValidationResult {
  id: string;
  fileName: string;
  uploadedAt: string;
  totalItems: number;
  discrepancies: Discrepancy[];
  processingTime: number;
  status: 'success' | 'partial' | 'error';
}

class PharmacyDataAPI {
  private baseURL: string;

  constructor() {
    // Use a default API URL since process.env is not available in this environment
    this.baseURL = 'http://localhost:3001/api';
  }

  /**
   * Configure the API base URL
   */
  setBaseURL(url: string) {
    this.baseURL = url;
  }

  /**
   * Get the current API base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Upload and validate an invoice file
   */
  async validateInvoice(file: File): Promise<ValidationResult> {
    // For demo purposes, simulate the API call with mock data
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock validation result
      const mockResult: ValidationResult = {
        id: `validation-${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        totalItems: Math.floor(Math.random() * 100) + 20,
        processingTime: Math.random() * 5 + 1,
        status: 'success',
        discrepancies: []
      };

      return mockResult;
    } catch (error) {
      console.error('Error validating invoice:', error);
      throw new Error('Failed to validate invoice. Please try again.');
    }
  }

  /**
   * Get validation history for the user
   */
  async getValidationHistory(): Promise<ValidationResult[]> {
    // For demo purposes, return mock data
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock discrepancy data
      const createMockDiscrepancies = (count: number): Discrepancy[] => {
        const discrepancies: Discrepancy[] = [];
        const types = ['price_overcharge', 'formulation_mismatch', 'strength_mismatch', 'payer_mismatch', 'drug_not_found'];
        const severities = ['high', 'medium', 'low'];
        
        for (let i = 0; i < count; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          const severity = severities[Math.floor(Math.random() * severities.length)];
          
          discrepancies.push({
            id: `discrepancy-${i + 1}`,
            invoiceItem: {
              id: `item-${i + 1}`,
              drugName: `Drug ${i + 1}`,
              formulation: 'Tablet',
              strength: '10mg',
              unitPrice: 25.50 + Math.random() * 100,
              quantity: Math.floor(Math.random() * 100) + 1,
              payer: 'Insurance A',
              totalAmount: 0
            },
            referenceDrug: {
              id: `ref-${i + 1}`,
              name: `Drug ${i + 1}`,
              formulation: 'Tablet',
              strength: '10mg',
              unitPrice: 20.00 + Math.random() * 80,
              payer: 'Insurance A'
            },
            type: type as any,
            severity: severity as any,
            description: `Mock ${type} discrepancy`,
            overchargePercentage: type === 'price_overcharge' ? Math.random() * 20 + 5 : undefined,
            expectedValue: type !== 'price_overcharge' ? 'Expected value' : undefined,
            actualValue: type !== 'price_overcharge' ? 'Actual value' : undefined
          });
        }
        
        // Calculate total amounts
        discrepancies.forEach(d => {
          d.invoiceItem.totalAmount = d.invoiceItem.unitPrice * d.invoiceItem.quantity;
        });
        
        return discrepancies;
      };
      
      // Return mock history data with proper discrepancies
      const mockHistory: ValidationResult[] = [
        {
          id: 'validation-1',
          fileName: 'invoice_january_2024.xlsx',
          uploadedAt: '2024-01-15T10:30:00Z',
          totalItems: 125,
          processingTime: 3.2,
          status: 'success',
          discrepancies: []
        },
        {
          id: 'validation-2',
          fileName: 'pharmacy_billing_Q4.csv',
          uploadedAt: '2024-01-10T14:22:00Z',
          totalItems: 87,
          processingTime: 2.1,
          status: 'success',
          discrepancies: createMockDiscrepancies(5)
        },
        {
          id: 'validation-3',
          fileName: 'december_invoices.pdf',
          uploadedAt: '2024-01-08T09:15:00Z',
          totalItems: 156,
          processingTime: 4.7,
          status: 'partial',
          discrepancies: createMockDiscrepancies(12)
        }
      ];
      
      return mockHistory;
    } catch (error) {
      console.error('Error fetching validation history:', error);
      throw new Error('Failed to fetch validation history.');
    }
  }

  /**
   * Get details for a specific validation
   */
  async getValidationDetails(validationId: string): Promise<ValidationResult> {
    // For demo purposes, return mock data
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create some mock discrepancies for demo
      const createMockDiscrepancies = (count: number): Discrepancy[] => {
        const discrepancies: Discrepancy[] = [];
        const types = ['price_overcharge', 'formulation_mismatch', 'strength_mismatch', 'payer_mismatch', 'drug_not_found'];
        const severities = ['high', 'medium', 'low'];
        
        for (let i = 0; i < count; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          const severity = severities[Math.floor(Math.random() * severities.length)];
          
          discrepancies.push({
            id: `discrepancy-${i + 1}`,
            invoiceItem: {
              id: `item-${i + 1}`,
              drugName: `Sample Drug ${i + 1}`,
              formulation: 'Tablet',
              strength: '10mg',
              unitPrice: 25.50 + Math.random() * 100,
              quantity: Math.floor(Math.random() * 100) + 1,
              payer: 'Insurance A',
              totalAmount: 0
            },
            referenceDrug: {
              id: `ref-${i + 1}`,
              name: `Sample Drug ${i + 1}`,
              formulation: 'Tablet',
              strength: '10mg',
              unitPrice: 20.00 + Math.random() * 80,
              payer: 'Insurance A'
            },
            type: type as any,
            severity: severity as any,
            description: `Sample ${type} discrepancy for demo`,
            overchargePercentage: type === 'price_overcharge' ? Math.random() * 20 + 5 : undefined,
            expectedValue: type !== 'price_overcharge' ? 'Expected value' : undefined,
            actualValue: type !== 'price_overcharge' ? 'Actual value' : undefined
          });
        }
        
        // Calculate total amounts
        discrepancies.forEach(d => {
          d.invoiceItem.totalAmount = d.invoiceItem.unitPrice * d.invoiceItem.quantity;
        });
        
        return discrepancies;
      };
      
      const mockValidation: ValidationResult = {
        id: validationId,
        fileName: 'sample_invoice.xlsx',
        uploadedAt: new Date().toISOString(),
        totalItems: 50,
        processingTime: 2.5,
        status: 'success',
        discrepancies: createMockDiscrepancies(8) // Create some discrepancies for demo
      };
      
      return mockValidation;
    } catch (error) {
      console.error('Error fetching validation details:', error);
      throw new Error('Failed to fetch validation details.');
    }
  }

  /**
   * Download validation report
   */
  async downloadReport(validationId: string, format: 'pdf' | 'excel' | 'csv' = 'pdf'): Promise<Blob> {
    try {
      // For demo purposes, create a mock blob
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockContent = `Mock ${format.toUpperCase()} report for validation ${validationId}`;
      const blob = new Blob([mockContent], { 
        type: format === 'pdf' ? 'application/pdf' : 
              format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
              'text/csv'
      });
      
      return blob;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw new Error('Failed to download report.');
    }
  }

  /**
   * Delete a validation record
   */
  async deleteValidation(validationId: string): Promise<void> {
    try {
      // For demo purposes, simulate the deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Mock deletion of validation ${validationId}`);
    } catch (error) {
      console.error('Error deleting validation:', error);
      throw new Error('Failed to delete validation.');
    }
  }

  /**
   * Get reference drug data from the external API
   */
  async getReferenceDrugs(): Promise<Drug[]> {
    try {
      const response = await fetch('https://685daed17b57aebd2af6da54.mockapi.io/api/v1/drugs');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const drugs = await response.json();
      return drugs;
    } catch (error) {
      console.error('Error fetching reference drugs:', error);
      throw new Error('Failed to fetch reference drug data.');
    }
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // For demo purposes, simulate a successful health check
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking API health:', error);
      throw new Error('Failed to connect to API.');
    }
  }
}

// Export a singleton instance
export const pharmacyDataAPI = new PharmacyDataAPI();

// Export utility functions for file handling
export const fileUtils = {
  /**
   * Validate file type and size before upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/pdf' // .pdf
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload .xlsx, .xls, .csv, or .pdf files only.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Please upload files smaller than 10MB.'
      };
    }

    return { isValid: true };
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return '.' + filename.split('.').pop()?.toLowerCase() || '';
  }
};
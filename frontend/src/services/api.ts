// API service for pharmacy data validation
// Connects to the Express.js backend

export interface Drug {
  id: string;
  name: string;
  formulation: string;
  strength: string;
  unitPrice: number;
  payer: string;
}

export interface InvoiceItem {
  drugName: string;
  patientName: string;
  strength: string;
  formulation: string;
  doseInstructions: string;
  payer: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Discrepancy {
  id?: string; // Optional since backend doesn't provide this
  type: 'price_overcharge' | 'formulation_mismatch' | 'strength_mismatch' | 'payer_mismatch' | 'drug_not_found';
  severity: 'high' | 'medium' | 'low';
  description?: string; // Optional since backend provides 'message'
  message?: string; // Backend provides this
  // Backend provides these directly
  drugName: string;
  patientName?: string; // Patient name from the invoice
  invoiceValue: string | number;
  referenceValue: string | number;
  // Optional fields that might be present in some cases
  invoiceItem?: InvoiceItem;
  referenceDrug?: Drug | null;
  overchargePercentage?: number;
  overchargeAmount?: number;
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

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: ValidationResult;
  error?: string;
}

export interface SupportedFormatsResponse {
  formats: string[];
  maxFileSize: number;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

class PharmacyDataAPI {
  private baseURL: string;

  constructor() {
    // Use environment variable or default to localhost:5000
    this.baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
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
   * Download a validation report as a Blob
   */
  async downloadReport(validationId: string, format: string): Promise<Blob> {
    try {
      const response = await fetch(
        `${this.baseURL}/validation/${encodeURIComponent(validationId)}/report?format=${encodeURIComponent(format)}`,
      );

      if (response.ok) {
        return await response.blob();
      }

      // Fallback: return error text as a blob so the UI can still proceed gracefully
      const errText = await response.text().catch(() => 'Failed to download report');
      return new Blob([errText], { type: 'text/plain' });
    } catch (error) {
      // Final fallback: return a plain text blob describing the failure
      const message = error instanceof Error ? error.message : 'Failed to download report';
      return new Blob([message], { type: 'text/plain' });
    }
  }

  /**
   * Upload and validate an invoice file
   */
  async validateInvoice(file: File): Promise<ValidationResult> {
    try {
      const formData = new FormData();
      formData.append('invoice', file); // Changed from 'file' to 'invoice' to match backend
      const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const raw = await response.json();
      const mapped = this.transformBackendUploadResponse(raw);
      return mapped;
    } catch (error) {
      console.error('Error validating invoice:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to validate invoice. Please try again.');
    }
  }

  /**
   * Get supported file formats
   */
  async getSupportedFormats(): Promise<SupportedFormatsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/upload/supported-formats`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Transform backend response to match our interface
      if (result.success && result.supportedFormats) {
        return {
          formats: result.supportedFormats.map((format: any) => format.extension),
          maxFileSize: parseInt(result.requirements.maxFileSize) * 1024 * 1024 // Convert MB to bytes
        };
      }
      
      throw new Error('Invalid response format from backend');
    } catch (error) {
      console.error('Error fetching supported formats:', error);
      throw new Error('Failed to fetch supported formats');
    }
  }

  /**
   * Validate invoice data without file upload
   */
  async validateInvoiceData(invoiceItems: InvoiceItem[]): Promise<ValidationResult> {
    try {
      const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const response = await fetch(`${this.baseURL}/upload/validate-only`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceItems }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const raw = await response.json();
      const mapped = this.transformBackendUploadResponse(raw);
      return mapped;
    } catch (error) {
      console.error('Error validating invoice data:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to validate invoice data. Please try again.');
    }
  }

  /**
   * Health check for the backend
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Backend is not responding');
    }
  }

  /**
   * Get validation history for the user
   */
  async getValidationHistory(): Promise<ValidationResult[]> {
    try {
      const response = await fetch(`${this.baseURL}/validation/history`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const rawHistory = result.data || [];
      
      // Transform each history item to ensure proper frontend structure
      return rawHistory.map((historyItem: any) => {
        // Create a mock envelope structure to reuse the transformation logic
        const mockEnvelope: BackendValidationResultEnvelope = {
          success: true,
          message: 'History item',
          data: {
            id: historyItem.id,
            fileName: historyItem.fileName,
            uploadedAt: historyItem.uploadedAt,
            totalItems: historyItem.totalItems,
            discrepancies: historyItem.discrepancies || [],
            processingTime: historyItem.processingTime,
            status: historyItem.status
          }
        };
        
        return this.transformBackendUploadResponse(mockEnvelope);
      });
    } catch (error) {
      console.error('Error fetching validation history:', error);
      throw new Error('Failed to fetch validation history');
    }
  }

  /**
   * Delete a validation record
   */
  async deleteValidation(validationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/validation/history/${validationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Success - no need to return anything
    } catch (error) {
      console.error('Error deleting validation:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete validation');
    }
  }

  // Map backend envelope to frontend ValidationResult
  private transformBackendUploadResponse(raw: BackendValidationResultEnvelope): ValidationResult {
    if (!raw || !raw.success || !raw.data) {
      throw new Error((raw as any)?.message || 'Invalid backend response');
    }

    const mappedDiscrepancies: Discrepancy[] = (raw.data.discrepancies || []).map((d) => ({
      id: mkId('disc'),
      type: mapType(d.type, d.message),
      severity: mapSeverity(d.severity),
      description: d.message,
      message: d.message,
      drugName: d.drugName,
      patientName: d.patientName, // Add patientName to the mapped discrepancy
      invoiceValue: d.invoiceValue,
      referenceValue: d.referenceValue,
      expectedValue: String(d.referenceValue ?? ''),
      actualValue: String(d.invoiceValue ?? ''),
      overchargePercentage: typeof d.percentageDifference === 'number' ? Math.min(d.percentageDifference * 100, 1000) : undefined,
      overchargeAmount: typeof d.overchargeAmount === 'number' ? d.overchargeAmount : undefined,
      invoiceItem: {
        id: mkId('item'),
        drugName: d.drugName,
        formulation: '', // Backend doesn't provide this in discrepancy
        strength: '',    // Backend doesn't provide this in discrepancy
        unitPrice: 0,   // Backend doesn't provide this in discrepancy
        quantity: 1,    // Backend doesn't provide this in discrepancy
        payer: '',      // Backend doesn't provide this in discrepancy
        total: 0,       // Backend doesn't provide this in discrepancy
        patientName: '', // Backend doesn't provide this in discrepancy
        doseInstructions: '' // Backend doesn't provide this in discrepancy
      }
    }));

    const backendTime = typeof raw.data.processingTime === 'number' ? raw.data.processingTime : 0;
    const processingTime = backendTime && backendTime > 0 ? backendTime : 0;

    return {
      id: raw.data.id,
      fileName: raw.data.fileName,
      uploadedAt: raw.data.uploadedAt,
      totalItems: raw.data.totalItems,
      discrepancies: mappedDiscrepancies,
      processingTime,
      status: raw.data.status,
    };
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

// Internal helpers to transform backend → frontend models
interface BackendDiscrepancy {
  type: 'unit_price' | 'formulation' | 'strength' | 'payer';
  drugName: string;
  invoiceValue: string | number;
  referenceValue: string | number;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  percentageDifference?: number;
  overchargeAmount?: number;
  patientName?: string; // Add patientName to the backend discrepancy
}

interface BackendValidationResultEnvelope {
  success: boolean;
  message: string;
  data?: {
    id: string;
    fileName: string;
    uploadedAt: string;
    totalItems: number;
    discrepancies: BackendDiscrepancy[];
    processingTime?: number;
    status: 'success' | 'partial' | 'error';
  };
  validation?: {
    summary?: {
      totalDiscrepancies: number;
      totalOvercharge?: number;
    }
  };
}

function mapSeverity(s: BackendDiscrepancy['severity']): Discrepancy['severity'] {
  switch (s) {
    case 'critical': return 'high';
    case 'error': return 'medium';
    case 'warning':
    default: return 'low';
  }
}

function mapType(t: BackendDiscrepancy['type'], msg: string): Discrepancy['type'] {
  if (msg?.toLowerCase().includes('not found in reference')) {
    return 'drug_not_found';
  }
  switch (t) {
    case 'unit_price': return 'price_overcharge';
    case 'formulation': return 'formulation_mismatch';
    case 'strength': return 'strength_mismatch';
    case 'payer': return 'payer_mismatch';
    default: return t as any;
  }
}

function mkId(prefix = 'disc'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// (helper functions used by the class defined above)
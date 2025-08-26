export interface ValidationResult {
  id: string;
  fileName: string;
  uploadedAt: string;
  totalItems: number;
  discrepancies: any[];
  processingTime: number;
  status: 'success' | 'partial' | 'error';
}

export interface ValidationHistoryItem extends ValidationResult {
  // Additional fields can be added here if needed
}

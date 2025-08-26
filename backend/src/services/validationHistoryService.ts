import { ValidationResult, ValidationHistoryItem } from '../types/validation';

export class ValidationHistoryService {
  private static instance: ValidationHistoryService;
  private validationHistory: ValidationHistoryItem[] = [];

  private constructor() {
    // Add some sample data for demonstration
    this.addSampleData();
  }

  public static getInstance(): ValidationHistoryService {
    if (!ValidationHistoryService.instance) {
      ValidationHistoryService.instance = new ValidationHistoryService();
    }
    return ValidationHistoryService.instance;
  }

  /**
   * Add a new validation result to history
   */
  public addToHistory(validationResult: ValidationHistoryItem): void {
    // Add timestamp if not present
    if (!validationResult.uploadedAt) {
      validationResult.uploadedAt = new Date().toISOString();
    }

    // Add to history
    this.validationHistory.push(validationResult);

    // Keep only last 100 validations (in production, use database with proper cleanup)
    if (this.validationHistory.length > 100) {
      this.validationHistory = this.validationHistory.slice(-100);
    }

    console.log(`Added validation result to history: ${validationResult.id} (${validationResult.fileName})`);
  }

  /**
   * Get all validation history
   */
  public getHistory(): ValidationHistoryItem[] {
    return [...this.validationHistory]; // Return a copy to prevent external modification
  }

  /**
   * Get a specific validation result by ID
   */
  public getById(id: string): ValidationHistoryItem | undefined {
    return this.validationHistory.find(v => v.id === id);
  }

  /**
   * Delete a validation result by ID
   */
  public deleteById(id: string): boolean {
    const index = this.validationHistory.findIndex(v => v.id === id);
    if (index === -1) {
      return false;
    }

    this.validationHistory.splice(index, 1);
    console.log(`Deleted validation result from history: ${id}`);
    return true;
  }

  /**
   * Clear all history (useful for testing)
   */
  public clearHistory(): void {
    this.validationHistory = [];
    console.log('Validation history cleared');
  }

  /**
   * Get history count
   */
  public getHistoryCount(): number {
    return this.validationHistory.length;
  }

  /**
   * Add sample data for demonstration
   */
  private addSampleData(): void {
    const sampleData: ValidationHistoryItem[] = [
      {
        id: 'sample-1',
        fileName: 'sample-invoice-1.xlsx',
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        totalItems: 15,
        discrepancies: [],
        processingTime: 2.3,
        status: 'success'
      },
      {
        id: 'sample-2',
        fileName: 'sample-invoice-2.csv',
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        totalItems: 23,
        discrepancies: [
          { id: 'disc-1', type: 'price_overcharge', severity: 'medium', description: 'Unit price discrepancy found' }
        ],
        processingTime: 1.8,
        status: 'partial'
      },
      {
        id: 'sample-3',
        fileName: 'sample-invoice-3.pdf',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        totalItems: 8,
        discrepancies: [
          { id: 'disc-2', type: 'formulation_mismatch', severity: 'high', description: 'Formulation mismatch detected' },
          { id: 'disc-3', type: 'strength_mismatch', severity: 'medium', description: 'Strength discrepancy found' }
        ],
        processingTime: 3.1,
        status: 'partial'
      }
    ];

    this.validationHistory.push(...sampleData);
    console.log('Sample validation history data added');
  }
}

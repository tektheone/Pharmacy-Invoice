import { InvoiceItem } from './fileParser';

export interface Drug {
  id: string;
  name: string;
  strength: string;
  formulation: string;
  payer: string;
  unitPrice: number;
}

export interface Discrepancy {
  type: 'unit_price' | 'formulation' | 'strength' | 'payer';
  drugName: string;
  patientName?: string; // Add patient name from the invoice item
  invoiceValue: string | number;
  referenceValue: string | number;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  percentageDifference?: number;
  overchargeAmount?: number;
}

export interface ValidationResult {
  discrepancies: Discrepancy[];
  summary: {
    totalDiscrepancies: number;
    priceDiscrepancies: number;
    formulationIssues: number;
    strengthErrors: number;
    payerMismatches: number;
    totalOvercharge: number;
  };
}

export class DiscrepancyChecker {
  private referenceDrugs: Drug[] = [];
  private readonly PRICE_THRESHOLD = 0.10; // 10% threshold for price discrepancies

  /**
   * Set reference drugs data
   */
  setReferenceDrugs(drugs: Drug[]): void {
    this.referenceDrugs = drugs;
  }

  /**
   * Validate invoice items against reference data
   */
  validateInvoice(invoiceItems: InvoiceItem[]): ValidationResult {
    const discrepancies: Discrepancy[] = [];

    for (const item of invoiceItems) {
      const referenceDrug = this.findReferenceDrug(item.drugName);
      
      if (!referenceDrug) {
        // Drug not found in reference - this could be a discrepancy
        discrepancies.push({
          type: 'formulation',
          drugName: item.drugName,
          patientName: item.patientName, // Include patient name
          invoiceValue: item.formulation,
          referenceValue: 'Not found in reference',
          message: `Drug "${item.drugName}" not found in reference database`,
          severity: 'warning'
        });
        continue;
      }

      // Check for discrepancies
      discrepancies.push(...this.checkDiscrepancies(item, referenceDrug));
    }

    return this.createValidationResult(discrepancies);
  }

  /**
   * Find reference drug by name (case-insensitive)
   */
  private findReferenceDrug(drugName: string): Drug | undefined {
    return this.referenceDrugs.find(drug => 
      drug.name.toLowerCase() === drugName.toLowerCase()
    );
  }

  /**
   * Check for all types of discrepancies
   */
  private checkDiscrepancies(invoiceItem: InvoiceItem, referenceDrug: Drug): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];

    // Check unit price discrepancy
    const priceDiscrepancy = this.checkUnitPriceDiscrepancy(invoiceItem, referenceDrug);
    if (priceDiscrepancy) {
      discrepancies.push(priceDiscrepancy);
    }

    // Check formulation mismatch
    const formulationDiscrepancy = this.checkFormulationDiscrepancy(invoiceItem, referenceDrug);
    if (formulationDiscrepancy) {
      discrepancies.push(formulationDiscrepancy);
    }

    // Check strength mismatch
    const strengthDiscrepancy = this.checkStrengthDiscrepancy(invoiceItem, referenceDrug);
    if (strengthDiscrepancy) {
      discrepancies.push(strengthDiscrepancy);
    }

    // Check payer mismatch
    const payerDiscrepancy = this.checkPayerDiscrepancy(invoiceItem, referenceDrug);
    if (payerDiscrepancy) {
      discrepancies.push(payerDiscrepancy);
    }

    return discrepancies;
  }

  /**
   * Check unit price discrepancy (>10% overcharge)
   */
  private checkUnitPriceDiscrepancy(invoiceItem: InvoiceItem, referenceDrug: Drug): Discrepancy | null {
    const invoicePrice = invoiceItem.unitPrice;
    const referencePrice = referenceDrug.unitPrice;
    
    if (invoicePrice <= referencePrice) {
      return null; // No overcharge
    }

    const percentageDifference = (invoicePrice - referencePrice) / referencePrice;
    
    if (percentageDifference > this.PRICE_THRESHOLD) {
      const overchargeAmount = invoicePrice - referencePrice;
      
      // Cap percentage at 1000% for display purposes, but keep actual for calculations
      const displayPercentage = Math.min(percentageDifference * 100, 1000);
      const message = displayPercentage >= 1000 
        ? `1000%+ overcharge (${overchargeAmount.toFixed(2)} excess)`
        : `${displayPercentage.toFixed(1)}% overcharge`;
      
      return {
        type: 'unit_price',
        drugName: invoiceItem.drugName,
        patientName: invoiceItem.patientName, // Include patient name
        invoiceValue: invoicePrice,
        referenceValue: referencePrice,
        message: message,
        severity: 'error',
        percentageDifference: percentageDifference,
        overchargeAmount: overchargeAmount
      };
    }

    return null;
  }

  /**
   * Check formulation mismatch
   */
  private checkFormulationDiscrepancy(invoiceItem: InvoiceItem, referenceDrug: Drug): Discrepancy | null {
    const invoiceFormulation = invoiceItem.formulation.toLowerCase().trim();
    const referenceFormulation = referenceDrug.formulation.toLowerCase().trim();
    
    if (invoiceFormulation === referenceFormulation) {
      return null; // No mismatch
    }

    return {
      type: 'formulation',
      drugName: invoiceItem.drugName,
      patientName: invoiceItem.patientName, // Include patient name
      invoiceValue: invoiceItem.formulation,
      referenceValue: referenceDrug.formulation,
      message: `Formulation mismatch: "${invoiceItem.formulation}" vs "${referenceDrug.formulation}"`,
      severity: 'warning'
    };
  }

  /**
   * Check strength mismatch (critical for patient safety)
   */
  private checkStrengthDiscrepancy(invoiceItem: InvoiceItem, referenceDrug: Drug): Discrepancy | null {
    const invoiceStrength = invoiceItem.strength.toLowerCase().trim();
    const referenceStrength = referenceDrug.strength.toLowerCase().trim();
    
    if (invoiceStrength === referenceStrength) {
      return null; // No mismatch
    }

    return {
      type: 'strength',
      drugName: invoiceItem.drugName,
      patientName: invoiceItem.patientName, // Include patient name
      invoiceValue: invoiceItem.strength,
      referenceValue: referenceDrug.strength,
      message: `Strength mismatch: "${invoiceItem.strength}" vs "${referenceDrug.strength}" - Safety concern`,
      severity: 'critical'
    };
  }

  /**
   * Check payer mismatch
   */
  private checkPayerDiscrepancy(invoiceItem: InvoiceItem, referenceDrug: Drug): Discrepancy | null {
    const invoicePayer = invoiceItem.payer.toLowerCase().trim();
    const referencePayer = referenceDrug.payer.toLowerCase().trim();
    
    if (invoicePayer === referencePayer) {
      return null; // No mismatch
    }

    return {
      type: 'payer',
      drugName: invoiceItem.drugName,
      patientName: invoiceItem.patientName, // Include patient name
      invoiceValue: invoiceItem.payer,
      referenceValue: referenceDrug.payer,
      message: `Payer mismatch: "${invoiceItem.payer}" vs "${referenceDrug.payer}" - Claims review needed`,
      severity: 'warning'
    };
  }

  /**
   * Create validation result with summary
   */
  private createValidationResult(discrepancies: Discrepancy[]): ValidationResult {
    const priceDiscrepancies = discrepancies.filter(d => d.type === 'unit_price');
    const formulationIssues = discrepancies.filter(d => d.type === 'formulation');
    const strengthErrors = discrepancies.filter(d => d.type === 'strength');
    const payerMismatches = discrepancies.filter(d => d.type === 'payer');
    
    const totalOvercharge = priceDiscrepancies.reduce((sum, d) => {
      return sum + (d.overchargeAmount || 0);
    }, 0);

    return {
      discrepancies,
      summary: {
        totalDiscrepancies: discrepancies.length,
        priceDiscrepancies: priceDiscrepancies.length,
        formulationIssues: formulationIssues.length,
        strengthErrors: strengthErrors.length,
        payerMismatches: payerMismatches.length,
        totalOvercharge
      }
    };
  }

  /**
   * Get discrepancy statistics for reporting
   */
  getDiscrepancyStats(discrepancies: Discrepancy[]): Record<string, any> {
    const stats = {
      total: discrepancies.length,
      byType: {
        unit_price: 0,
        formulation: 0,
        strength: 0,
        payer: 0
      },
      bySeverity: {
        warning: 0,
        error: 0,
        critical: 0
      },
      totalOvercharge: 0,
      averageOvercharge: 0
    };

    let totalOvercharge = 0;
    let priceDiscrepancyCount = 0;

    for (const discrepancy of discrepancies) {
      stats.byType[discrepancy.type]++;
      stats.bySeverity[discrepancy.severity]++;
      
      if (discrepancy.type === 'unit_price' && discrepancy.overchargeAmount) {
        totalOvercharge += discrepancy.overchargeAmount;
        priceDiscrepancyCount++;
      }
    }

    stats.totalOvercharge = totalOvercharge;
    stats.averageOvercharge = priceDiscrepancyCount > 0 ? totalOvercharge / priceDiscrepancyCount : 0;

    return stats;
  }

  /**
   * Filter discrepancies by type
   */
  filterDiscrepanciesByType(discrepancies: Discrepancy[], type: Discrepancy['type']): Discrepancy[] {
    return discrepancies.filter(d => d.type === type);
  }

  /**
   * Filter discrepancies by severity
   */
  filterDiscrepanciesBySeverity(discrepancies: Discrepancy[], severity: Discrepancy['severity']): Discrepancy[] {
    return discrepancies.filter(d => d.severity === severity);
  }

  /**
   * Sort discrepancies by severity (critical > error > warning)
   */
  sortDiscrepanciesBySeverity(discrepancies: Discrepancy[]): Discrepancy[] {
    const severityOrder = { critical: 3, error: 2, warning: 1 };
    
    return [...discrepancies].sort((a, b) => {
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get critical discrepancies that require immediate attention
   */
  getCriticalDiscrepancies(discrepancies: Discrepancy[]): Discrepancy[] {
    return discrepancies.filter(d => d.severity === 'critical');
  }

  /**
   * Validate reference drug data integrity
   */
  validateReferenceData(drugs: Drug[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const drug of drugs) {
      if (!drug.name || drug.name.trim() === '') {
        errors.push(`Drug missing name: ${JSON.stringify(drug)}`);
      }
      if (!drug.strength || drug.strength.trim() === '') {
        errors.push(`Drug missing strength: ${drug.name}`);
      }
      if (!drug.formulation || drug.formulation.trim() === '') {
        errors.push(`Drug missing formulation: ${drug.name}`);
      }
      if (!drug.payer || drug.payer.trim() === '') {
        errors.push(`Drug missing payer: ${drug.name}`);
      }
      if (typeof drug.unitPrice !== 'number' || drug.unitPrice < 0) {
        errors.push(`Drug has invalid unit price: ${drug.name} - ${drug.unitPrice}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

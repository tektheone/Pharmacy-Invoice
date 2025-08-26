import { DiscrepancyChecker, Drug, Discrepancy, ValidationResult } from '../src/services/discrepancyChecker';
import { InvoiceItem } from '../src/services/fileParser';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('DiscrepancyChecker', () => {
  let discrepancyChecker: DiscrepancyChecker;
  let mockReferenceDrugs: Drug[];
  let mockInvoiceItems: InvoiceItem[];

  beforeEach(() => {
    discrepancyChecker = new DiscrepancyChecker();
    
    // Mock reference drugs data
    mockReferenceDrugs = [
      {
        id: '1',
        name: 'Amoxicillin',
        strength: '500 mg',
        formulation: 'Capsule',
        payer: 'medicaid',
        unitPrice: 0.45
      },
      {
        id: '2',
        name: 'Lisinopril',
        strength: '10 mg',
        formulation: 'Tablet',
        payer: 'medicaid',
        unitPrice: 0.30
      },
      {
        id: '3',
        name: 'Metformin',
        strength: '500 mg',
        formulation: 'Tablet (ER)',
        payer: 'medicare',
        unitPrice: 0.15
      },
      {
        id: '4',
        name: 'Insulin Glargine',
        strength: '100 units/mL',
        formulation: 'Solution (vial, 10mL)',
        payer: 'medicare',
        unitPrice: 105.00
      },
      {
        id: '5',
        name: 'Loratadine',
        strength: '10 mg',
        formulation: 'Tablet',
        payer: 'medicare',
        unitPrice: 0.20
      },
      {
        id: '6',
        name: 'Erythropoietin',
        strength: '10000 IU/1.0ml',
        formulation: 'Solution (vial)',
        payer: 'medicaid',
        unitPrice: 180.00
      }
    ];

    // Mock invoice items
    mockInvoiceItems = [
      {
        patientName: 'Test Patient 1',
        drugName: 'Amoxicillin',
        strength: '500 mg',
        formulation: 'Capsule',
        doseInstructions: '1 capsule 3x daily',
        payer: 'medicaid',
        quantity: 30,
        unitPrice: 0.50, // 11.1% overcharge
        total: 15.00
      },
      {
        patientName: 'Test Patient 2',
        drugName: 'Lisinopril',
        strength: '10 mg',
        formulation: 'Tablet',
        doseInstructions: '1 tablet daily',
        payer: 'medicare', // Payer mismatch
        quantity: 30,
        unitPrice: 0.35, // 16.7% overcharge
        total: 10.50
      },
      {
        patientName: 'Test Patient 3',
        drugName: 'Metformin',
        strength: '500 mg',
        formulation: 'Tablet (ER)',
        doseInstructions: '1 tablet twice daily',
        payer: 'medicare',
        quantity: 60,
        unitPrice: 0.20, // 33.3% overcharge
        total: 12.00
      },
      {
        patientName: 'Test Patient 4',
        drugName: 'Insulin Glargine',
        strength: '100 units/mL',
        formulation: 'Solution (vial, 10mL)',
        doseInstructions: 'Inject 10 units subcut.',
        payer: 'medicaid', // Payer mismatch
        quantity: 1,
        unitPrice: 120.00, // 14.3% overcharge
        total: 120.00
      },
      {
        patientName: 'Test Patient 5',
        drugName: 'Loratadine',
        strength: '10 g', // Strength mismatch (should be 10 mg)
        formulation: 'Tablet',
        doseInstructions: '1 tablet daily',
        payer: 'medicare',
        quantity: 30,
        unitPrice: 0.25,
        total: 7.50
      },
      {
        patientName: 'Test Patient 6',
        drugName: 'Erythropoietin',
        strength: '10000 IU/1.0ml',
        formulation: 'Capsule', // Formulation mismatch (should be Solution)
        doseInstructions: 'sc 3x weekly',
        payer: 'medicaid',
        quantity: 1,
        unitPrice: 200.00,
        total: 200.00
      }
    ];
  });

  describe('setReferenceDrugs', () => {
    it('should set reference drugs data', () => {
      discrepancyChecker.setReferenceDrugs(mockReferenceDrugs);
      
      // Test by calling a method that uses reference drugs
      const result = discrepancyChecker.validateInvoice([mockInvoiceItems[0]]);
      expect(result.discrepancies.length).toBeGreaterThan(0);
    });
  });

  describe('validateInvoice', () => {
    beforeEach(() => {
      discrepancyChecker.setReferenceDrugs(mockReferenceDrugs);
    });

    it('should detect all types of discrepancies', () => {
      const result = discrepancyChecker.validateInvoice(mockInvoiceItems);
      
      expect(result.discrepancies.length).toBeGreaterThan(0);
      expect(result.summary.totalDiscrepancies).toBeGreaterThan(0);
    });

    it('should handle drugs not found in reference', () => {
      const unknownDrug: InvoiceItem = {
        patientName: 'Unknown Patient',
        drugName: 'Unknown Drug',
        strength: '100 mg',
        formulation: 'Tablet',
        doseInstructions: '1 tablet daily',
        payer: 'medicare',
        quantity: 30,
        unitPrice: 1.00,
        total: 30.00
      };

      const result = discrepancyChecker.validateInvoice([unknownDrug]);
      
      expect(result.discrepancies.length).toBe(1);
      expect(result.discrepancies[0].type).toBe('formulation');
      expect(result.discrepancies[0].message).toContain('not found in reference database');
    });
  });

  describe('unit price validation', () => {
    beforeEach(() => {
      discrepancyChecker.setReferenceDrugs(mockReferenceDrugs);
    });

    it('should detect price overcharge above 10% threshold', () => {
      const overchargedItem = mockInvoiceItems[0]; // Amoxicillin: 0.50 vs 0.45 (11.1% overcharge)
      
      const result = discrepancyChecker.validateInvoice([overchargedItem]);
      const priceDiscrepancies = result.discrepancies.filter(d => d.type === 'unit_price');
      
      expect(priceDiscrepancies.length).toBe(1);
      expect(priceDiscrepancies[0].percentageDifference).toBeCloseTo(0.111, 3);
      expect(priceDiscrepancies[0].overchargeAmount).toBeCloseTo(0.05, 2);
      expect(priceDiscrepancies[0].severity).toBe('error');
    });

    it('should handle extreme price overcharge gracefully', () => {
      const extremeOverchargeItem: InvoiceItem = {
        patientName: 'Extreme Overcharge Patient',
        drugName: 'Amoxicillin', // Use existing drug from mock data
        strength: '500 mg',
        formulation: 'Capsule',
        doseInstructions: '1 capsule 3x daily',
        payer: 'medicaid',
        quantity: 30,
        unitPrice: 50.00, // Extreme overcharge: 50 vs 0.45 (11000%+)
        total: 1500.00
      };
      
      const result = discrepancyChecker.validateInvoice([extremeOverchargeItem]);
      const priceDiscrepancies = result.discrepancies.filter(d => d.type === 'unit_price');
      
      expect(priceDiscrepancies.length).toBe(1);
      expect(priceDiscrepancies[0].percentageDifference).toBeGreaterThan(100); // Should be 11000%+
      expect(priceDiscrepancies[0].overchargeAmount).toBeCloseTo(49.55, 2);
      expect(priceDiscrepancies[0].severity).toBe('error');
      expect(priceDiscrepancies[0].message).toContain('1000%+ overcharge');
    });

    it('should not flag prices within 10% threshold', () => {
      const withinThresholdItem: InvoiceItem = {
        patientName: 'Within Threshold Patient',
        drugName: 'Amoxicillin',
        strength: '500 mg',
        formulation: 'Capsule',
        doseInstructions: '1 capsule 3x daily',
        payer: 'medicaid',
        quantity: 30,
        unitPrice: 0.49, // 8.9% overcharge (within 10% threshold)
        total: 14.70
      };

      const result = discrepancyChecker.validateInvoice([withinThresholdItem]);
      const priceDiscrepancies = result.discrepancies.filter(d => d.type === 'unit_price');
      
      expect(priceDiscrepancies.length).toBe(0);
    });

    it('should not flag prices below reference price', () => {
      const belowReferenceItem: InvoiceItem = {
        patientName: 'Below Reference Patient',
        drugName: 'Amoxicillin',
        strength: '500 mg',
        formulation: 'Capsule',
        doseInstructions: '1 capsule 3x daily',
        payer: 'medicaid',
        quantity: 30,
        unitPrice: 0.40, // Below reference price
        total: 12.00
      };

      const result = discrepancyChecker.validateInvoice([belowReferenceItem]);
      const priceDiscrepancies = result.discrepancies.filter(d => d.type === 'unit_price');
      
      expect(priceDiscrepancies.length).toBe(0);
    });
  });

  describe('formulation validation', () => {
    beforeEach(() => {
      discrepancyChecker.setReferenceDrugs(mockReferenceDrugs);
    });

    it('should detect formulation mismatches', () => {
      const formulationMismatchItem = mockInvoiceItems[5]; // Erythropoietin: Capsule vs Solution
      
      const result = discrepancyChecker.validateInvoice([formulationMismatchItem]);
      const formulationDiscrepancies = result.discrepancies.filter(d => d.type === 'formulation');
      
      expect(formulationDiscrepancies.length).toBe(1);
      expect(formulationDiscrepancies[0].invoiceValue).toBe('Capsule');
      expect(formulationDiscrepancies[0].referenceValue).toBe('Solution (vial)');
      expect(formulationDiscrepancies[0].severity).toBe('warning');
    });

    it('should not flag matching formulations', () => {
      const matchingFormulationItem = mockInvoiceItems[0]; // Amoxicillin: Capsule vs Capsule
      
      const result = discrepancyChecker.validateInvoice([matchingFormulationItem]);
      const formulationDiscrepancies = result.discrepancies.filter(d => d.type === 'formulation');
      
      expect(formulationDiscrepancies.length).toBe(0);
    });
  });

  describe('strength validation', () => {
    beforeEach(() => {
      discrepancyChecker.setReferenceDrugs(mockReferenceDrugs);
    });

    it('should detect strength mismatches with critical severity', () => {
      const strengthMismatchItem = mockInvoiceItems[4]; // Loratadine: 10 g vs 10 mg
      
      const result = discrepancyChecker.validateInvoice([strengthMismatchItem]);
      const strengthDiscrepancies = result.discrepancies.filter(d => d.type === 'strength');
      
      expect(strengthDiscrepancies.length).toBe(1);
      expect(strengthDiscrepancies[0].invoiceValue).toBe('10 g');
      expect(strengthDiscrepancies[0].referenceValue).toBe('10 mg');
      expect(strengthDiscrepancies[0].severity).toBe('critical');
      expect(strengthDiscrepancies[0].message).toContain('Safety concern');
    });

    it('should not flag matching strengths', () => {
      const matchingStrengthItem = mockInvoiceItems[0]; // Amoxicillin: 500 mg vs 500 mg
      
      const result = discrepancyChecker.validateInvoice([matchingStrengthItem]);
      const strengthDiscrepancies = result.discrepancies.filter(d => d.type === 'strength');
      
      expect(strengthDiscrepancies.length).toBe(0);
    });
  });

  describe('payer validation', () => {
    beforeEach(() => {
      discrepancyChecker.setReferenceDrugs(mockReferenceDrugs);
    });

    it('should detect payer mismatches', () => {
      const payerMismatchItem = mockInvoiceItems[1]; // Lisinopril: medicare vs medicaid
      
      const result = discrepancyChecker.validateInvoice([payerMismatchItem]);
      const payerDiscrepancies = result.discrepancies.filter(d => d.type === 'payer');
      
      expect(payerDiscrepancies.length).toBe(1);
      expect(payerDiscrepancies[0].invoiceValue).toBe('medicare');
      expect(payerDiscrepancies[0].referenceValue).toBe('medicaid');
      expect(payerDiscrepancies[0].severity).toBe('warning');
      expect(payerDiscrepancies[0].message).toContain('Claims review needed');
    });

    it('should not flag matching payers', () => {
      const matchingPayerItem = mockInvoiceItems[0]; // Amoxicillin: medicaid vs medicaid
      
      const result = discrepancyChecker.validateInvoice([matchingPayerItem]);
      const payerDiscrepancies = result.discrepancies.filter(d => d.type === 'payer');
      
      expect(payerDiscrepancies.length).toBe(0);
    });
  });

  describe('validation summary', () => {
    beforeEach(() => {
      discrepancyChecker.setReferenceDrugs(mockReferenceDrugs);
    });

    it('should provide accurate summary statistics', () => {
      const result = discrepancyChecker.validateInvoice(mockInvoiceItems);
      
      expect(result.summary.totalDiscrepancies).toBeGreaterThan(0);
      expect(result.summary.priceDiscrepancies).toBeGreaterThan(0);
      expect(result.summary.formulationIssues).toBeGreaterThan(0);
      expect(result.summary.strengthErrors).toBeGreaterThan(0);
      expect(result.summary.payerMismatches).toBeGreaterThan(0);
      expect(result.summary.totalOvercharge).toBeGreaterThan(0);
    });

    it('should calculate total overcharge correctly', () => {
      // Test with just the drugs that have price discrepancies
      const testItems = [
        mockInvoiceItems[0], // Amoxicillin: 0.50 vs 0.45 (overcharge: 0.05)
        mockInvoiceItems[1], // Lisinopril: 0.35 vs 0.30 (overcharge: 0.05)
        mockInvoiceItems[2], // Metformin: 0.20 vs 0.15 (overcharge: 0.05)
        mockInvoiceItems[3]  // Insulin: 120 vs 105 (overcharge: 15.00)
      ];
      
      const result = discrepancyChecker.validateInvoice(testItems);
      
      // Expected: 0.05 + 0.05 + 0.05 + 15.00 = 15.15
      const expectedOvercharge = 15.15;
      
      expect(result.summary.totalOvercharge).toBeCloseTo(expectedOvercharge, 2);
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      discrepancyChecker.setReferenceDrugs(mockReferenceDrugs);
    });

    it('should filter discrepancies by type', () => {
      const result = discrepancyChecker.validateInvoice(mockInvoiceItems);
      const priceDiscrepancies = discrepancyChecker.filterDiscrepanciesByType(result.discrepancies, 'unit_price');
      
      expect(priceDiscrepancies.every(d => d.type === 'unit_price')).toBe(true);
    });

    it('should filter discrepancies by severity', () => {
      const result = discrepancyChecker.validateInvoice(mockInvoiceItems);
      const criticalDiscrepancies = discrepancyChecker.filterDiscrepanciesBySeverity(result.discrepancies, 'critical');
      
      expect(criticalDiscrepancies.every(d => d.severity === 'critical')).toBe(true);
    });

    it('should sort discrepancies by severity', () => {
      const result = discrepancyChecker.validateInvoice(mockInvoiceItems);
      const sortedDiscrepancies = discrepancyChecker.sortDiscrepanciesBySeverity(result.discrepancies);
      
      const severityOrder = { critical: 3, error: 2, warning: 1 };
      for (let i = 0; i < sortedDiscrepancies.length - 1; i++) {
        const current = severityOrder[sortedDiscrepancies[i].severity];
        const next = severityOrder[sortedDiscrepancies[i + 1].severity];
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should get critical discrepancies', () => {
      const result = discrepancyChecker.validateInvoice(mockInvoiceItems);
      const criticalDiscrepancies = discrepancyChecker.getCriticalDiscrepancies(result.discrepancies);
      
      expect(criticalDiscrepancies.every(d => d.severity === 'critical')).toBe(true);
    });

    it('should get discrepancy statistics', () => {
      const result = discrepancyChecker.validateInvoice(mockInvoiceItems);
      const stats = discrepancyChecker.getDiscrepancyStats(result.discrepancies);
      
      expect(stats.total).toBe(result.summary.totalDiscrepancies);
      expect(stats.totalOvercharge).toBeCloseTo(result.summary.totalOvercharge, 2);
      expect(stats.byType.unit_price).toBe(result.summary.priceDiscrepancies);
      expect(stats.byType.formulation).toBe(result.summary.formulationIssues);
      expect(stats.byType.strength).toBe(result.summary.strengthErrors);
      expect(stats.byType.payer).toBe(result.summary.payerMismatches);
    });
  });

  describe('reference data validation', () => {
    it('should validate reference drug data integrity', () => {
      const validDrugs = mockReferenceDrugs;
      const invalidDrugs = [
        { ...mockReferenceDrugs[0], name: '' }, // Missing name
        { ...mockReferenceDrugs[1], strength: '' }, // Missing strength
        { ...mockReferenceDrugs[2], formulation: '' }, // Missing formulation
        { ...mockReferenceDrugs[3], payer: '' }, // Missing payer
        { ...mockReferenceDrugs[0], unitPrice: -1 } // Invalid price
      ];

      const validResult = discrepancyChecker.validateReferenceData(validDrugs);
      const invalidResult = discrepancyChecker.validateReferenceData(invalidDrugs);

      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });
});

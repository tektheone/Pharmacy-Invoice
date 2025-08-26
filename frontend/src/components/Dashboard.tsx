import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { DiscrepancyTable } from './DiscrepancyTable';
import { ValidationSummary } from './ValidationSummary';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock validation result
      const mockResult: ValidationResult = {
        id: `validation-${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        totalItems: 45,
        processingTime: 2.8,
        status: 'success',
        discrepancies: [
          {
            id: '1',
            invoiceItem: {
              id: 'inv-001',
              drugName: 'Amoxicillin',
              formulation: 'Capsule',
              strength: '500mg',
              unitPrice: 12.50,
              quantity: 100,
              payer: 'Medicare',
              totalAmount: 1250.00
            },
            referenceDrug: {
              id: 'ref-001',
              name: 'Amoxicillin',
              formulation: 'Capsule',
              strength: '500mg',
              unitPrice: 10.00,
              payer: 'Medicare'
            },
            type: 'price_overcharge',
            severity: 'high',
            description: 'Unit price exceeds reference by 25%',
            overchargePercentage: 25,
            expectedValue: '$10.00',
            actualValue: '$12.50'
          },
          {
            id: '2',
            invoiceItem: {
              id: 'inv-002',
              drugName: 'Ibuprofen',
              formulation: 'Tablet',
              strength: '200mg',
              unitPrice: 8.00,
              quantity: 50,
              payer: 'Medicaid',
              totalAmount: 400.00
            },
            referenceDrug: {
              id: 'ref-002',
              name: 'Ibuprofen',
              formulation: 'Capsule',
              strength: '200mg',
              unitPrice: 8.00,
              payer: 'Medicaid'
            },
            type: 'formulation_mismatch',
            severity: 'medium',
            description: 'Formulation does not match reference',
            expectedValue: 'Capsule',
            actualValue: 'Tablet'
          },
          {
            id: '3',
            invoiceItem: {
              id: 'inv-003',
              drugName: 'Metformin',
              formulation: 'Tablet',
              strength: '1000mg',
              unitPrice: 15.00,
              quantity: 30,
              payer: 'Private',
              totalAmount: 450.00
            },
            referenceDrug: {
              id: 'ref-003',
              name: 'Metformin',
              formulation: 'Tablet',
              strength: '500mg',
              unitPrice: 15.00,
              payer: 'Private'
            },
            type: 'strength_mismatch',
            severity: 'medium',
            description: 'Strength does not match reference',
            expectedValue: '500mg',
            actualValue: '1000mg'
          }
        ]
      };

      setValidationResult(mockResult);
    } catch (err) {
      setError('Failed to process the file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Invoice</CardTitle>
          <CardDescription>
            Upload your invoice file (.xlsx, .xls, .csv, .pdf) to validate against reference drug data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onFileUpload={handleFileUpload} disabled={isLoading} />
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <LoadingSpinner message="Processing invoice and validating data..." />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {validationResult && !isLoading && (
        <div className="space-y-6">
          {/* Validation Summary */}
          <ValidationSummary result={validationResult} />

          {/* Discrepancies Table */}
          {validationResult.discrepancies.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Discrepancies Found</CardTitle>
                <CardDescription>
                  Review the following discrepancies found in your invoice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DiscrepancyTable discrepancies={validationResult.discrepancies} />
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                No discrepancies found! Your invoice data matches the reference database.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
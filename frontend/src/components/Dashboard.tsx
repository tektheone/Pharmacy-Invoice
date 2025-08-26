import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { DiscrepancyTable } from './DiscrepancyTable';
import { ValidationSummary } from './ValidationSummary';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { pharmacyDataAPI } from '../services/api';
import type { ValidationResult, SupportedFormatsResponse } from '../services/api';

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

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportedFormats, setSupportedFormats] = useState({
    formats: ['.xlsx', '.xls', '.csv', '.pdf'],
    maxFileSize: 10 * 1024 * 1024 // 10MB default
  });

  // Fetch supported formats on component mount
  useEffect(() => {
    const fetchSupportedFormats = async () => {
      try {
        const formats = await pharmacyDataAPI.getSupportedFormats();
        setSupportedFormats(formats);
      } catch (error) {
        console.warn('Failed to fetch supported formats, using defaults:', error);
        // Keep default formats if API call fails
      }
    };

    fetchSupportedFormats();
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      // Use real API to validate invoice
      const result = await pharmacyDataAPI.validateInvoice(file);
      setValidationResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process the file. Please try again.';
      setError(errorMessage);
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
          <FileUpload
            onFileUpload={handleFileUpload}
            disabled={isLoading}
            supportedFormats={supportedFormats.formats}
            maxFileSize={supportedFormats.maxFileSize}
          />
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
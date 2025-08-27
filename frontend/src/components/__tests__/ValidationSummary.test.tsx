import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ValidationSummary } from '../ValidationSummary';

const mockResult = {
  id: 'test-123',
  fileName: 'test-invoice.csv',
  uploadedAt: '2025-08-26T23:00:00Z',
  totalItems: 10,
  totalDiscrepancies: 3,
  processingTime: 1.5,
  status: 'partial' as const,
  discrepancies: [],
  items: []
};

describe('ValidationSummary', () => {
  it('renders validation summary information', () => {
    render(<ValidationSummary result={mockResult} />);
    
    // Check if key information is displayed
    expect(screen.getByText('test-invoice.csv')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Total items
    expect(screen.getByText('1.50s')).toBeInTheDocument(); // Processing time
  });

  it('shows correct status', () => {
    render(<ValidationSummary result={mockResult} />);
    
    expect(screen.getByText('Partial Validation')).toBeInTheDocument();
  });

  it('displays file details', () => {
    render(<ValidationSummary result={mockResult} />);
    
    expect(screen.getByText(/uploaded/i)).toBeInTheDocument();
    expect(screen.getByText(/processing time/i)).toBeInTheDocument();
  });
});

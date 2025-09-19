import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUpload } from '../FileUpload';

// Mock the onFileUpload prop
const mockOnFileUpload = vi.fn();

describe('FileUpload', () => {
  it('renders file upload interface', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    // Check if the component renders
    expect(screen.getByText(/upload/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('shows supported file types', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    // Check if supported file types are displayed
    expect(screen.getByText(/csv/i)).toBeInTheDocument();
    expect(screen.getByText(/excel/i)).toBeInTheDocument();
    expect(screen.getByText(/pdf/i)).toBeInTheDocument();
  });

  it('has file input element', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);
    
    const fileInput = screen.getByRole('button');
    expect(fileInput).toBeInTheDocument();
  });
});

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import {
  Download,
  FileText,
  Table,
  BarChart3,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { pharmacyDataAPI } from '../services/api';

interface ExportReportDialogProps {
  open: boolean;
  validationId: string | null;
  onOpenChange: (open: boolean) => void;
}

type ExportFormat = 'pdf' | 'excel' | 'csv';
type ExportSection = 'summary' | 'discrepancies' | 'analytics' | 'all';

export function ExportReportDialog({
  open,
  validationId,
  onOpenChange
}: ExportReportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedSections, setSelectedSections] = useState(['summary', 'discrepancies']);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);

  const formatOptions = [
    {
      value: 'pdf' as ExportFormat,
      label: 'PDF Report',
      description: 'Professional report with charts and formatting',
      icon: FileText,
      recommended: true
    },
    {
      value: 'excel' as ExportFormat,
      label: 'Excel Workbook',
      description: 'Spreadsheet with multiple sheets for analysis',
      icon: FileSpreadsheet,
      recommended: false
    },
    {
      value: 'csv' as ExportFormat,
      label: 'CSV Data',
      description: 'Raw data for custom analysis',
      icon: Table,
      recommended: false
    }
  ];

  const sectionOptions = [
    {
      value: 'summary' as ExportSection,
      label: 'Executive Summary',
      description: 'Key findings and recommendations'
    },
    {
      value: 'discrepancies' as ExportSection,
      label: 'Detailed Issues',
      description: 'Complete list of all discrepancies'
    },
    {
      value: 'analytics' as ExportSection,
      label: 'Analytics & Charts',
      description: 'Visual analysis and statistics'
    },
    {
      value: 'all' as ExportSection,
      label: 'Complete Report',
      description: 'All sections with comprehensive data'
    }
  ];

  const handleSectionChange = (section: ExportSection, checked: boolean) => {
    if (section === 'all') {
      setSelectedSections(checked ? ['summary', 'discrepancies', 'analytics'] : []);
    } else {
      if (checked) {
        setSelectedSections(prev => [...prev.filter(s => s !== 'all'), section]);
      } else {
        setSelectedSections(prev => prev.filter(s => s !== section && s !== 'all'));
      }
    }
  };

  const handleExport = async () => {
    if (!validationId || selectedSections.length === 0) {
      return;
    }

    setIsExporting(true);
    setExportStatus('preparing');
    setExportProgress(0);
    setError(null);

    try {
      // Simulate export progress
      const progressSteps = [
        { status: 'preparing' as const, progress: 20, message: 'Preparing export...' },
        { status: 'generating' as const, progress: 60, message: 'Generating report...' },
        { status: 'complete' as const, progress: 100, message: 'Export complete!' }
      ];

      for (const step of progressSteps) {
        setExportStatus(step.status);
        setExportProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // In a real app, this would trigger the actual download
      const blob = await pharmacyDataAPI.downloadReport(validationId, selectedFormat);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `validation-report-${validationId}.${selectedFormat === 'excel' ? 'xlsx' : selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);

    } catch (err) {
      setExportStatus('error');
      setError('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const resetState = () => {
    setExportStatus('idle');
    setExportProgress(0);
    setError(null);
  };

  const handleClose = () => {
    if (!isExporting) {
      onOpenChange(false);
      resetState();
    }
  };

  const getStatusMessage = () => {
    switch (exportStatus) {
      case 'preparing': return 'Preparing your export...';
      case 'generating': return 'Generating report files...';
      case 'complete': return 'Export completed successfully!';
      case 'error': return 'Export failed';
      default: return '';
    }
  };

  const isAllSelected = selectedSections.length === 3 &&
    selectedSections.includes('summary') &&
    selectedSections.includes('discrepancies') &&
    selectedSections.includes('analytics');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Validation Report</span>
          </DialogTitle>
          <DialogDescription>
            Choose your preferred format and sections to include in the exported report.
          </DialogDescription>
        </DialogHeader>

        {exportStatus === 'idle' && (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Export Format</Label>
              <RadioGroup
                value={selectedFormat}
                onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
                className="space-y-3"
              >
                {formatOptions.map((format) => {
                  const IconComponent = format.icon;
                  return (
                    <div key={format.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={format.value} id={format.value} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <Label htmlFor={format.value} className="font-medium cursor-pointer">
                            {format.label}
                          </Label>
                          {format.recommended && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Section Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Report Sections</Label>
              <div className="space-y-2">
                {sectionOptions.map((section) => (
                  <div key={section.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={section.value}
                      checked={section.value === 'all' ? isAllSelected : selectedSections.includes(section.value)}
                      onCheckedChange={(checked) => handleSectionChange(section.value, !!checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={section.value} className="font-medium cursor-pointer">
                        {section.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Additional Options</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-charts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                  disabled={selectedFormat === 'csv'}
                />
                <Label htmlFor="include-charts" className="cursor-pointer">
                  Include charts and visualizations
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity-filter">Filter by severity</Label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="high">High severity only</SelectItem>
                    <SelectItem value="medium-high">Medium and high severity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSections.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please select at least one section to include in your report.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Export Progress */}
        {(exportStatus !== 'idle' && exportStatus !== 'error') && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-lg font-medium">
                {exportStatus === 'complete' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                <span>{getStatusMessage()}</span>
              </div>
            </div>
            <Progress value={exportProgress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {exportStatus === 'complete'
                ? 'Your download should start automatically.'
                : 'This may take a few moments depending on the report size.'
              }
            </p>
          </div>
        )}

        {/* Error State */}
        {exportStatus === 'error' && error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {exportStatus === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={selectedSections.length === 0}
                className="min-w-24"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </>
          )}

          {exportStatus === 'complete' && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}

          {exportStatus === 'error' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Try Again
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, CheckCircle2, Clock, Download, Search, Eye, Trash2 } from 'lucide-react';
import { ValidationResult } from './Dashboard';

interface ValidationHistoryProps {
  onViewDetails: (validation: ValidationResult) => void;
  onDeleteRequest: (validationId: string) => void;
  onExportRequest: (validationId: string) => void;
}

// Mock historical data - in a real app, this would come from your backend
const mockHistoryData: ValidationResult[] = [
  {
    id: 'validation-1',
    fileName: 'invoice_january_2024.xlsx',
    uploadedAt: '2024-01-15T10:30:00Z',
    totalItems: 125,
    processingTime: 3.2,
    status: 'success',
    discrepancies: [
      // Mock discrepancy data would go here
    ]
  },
  {
    id: 'validation-2',
    fileName: 'pharmacy_billing_Q4.csv',
    uploadedAt: '2024-01-10T14:22:00Z',
    totalItems: 87,
    processingTime: 2.1,
    status: 'success',
    discrepancies: [
      // Mock discrepancy data would go here - 5 items for example
      ...Array(5).fill(null)
    ]
  },
  {
    id: 'validation-3',
    fileName: 'december_invoices.pdf',
    uploadedAt: '2024-01-08T09:15:00Z',
    totalItems: 156,
    processingTime: 4.7,
    status: 'partial',
    discrepancies: [
      // Mock discrepancy data would go here - 12 items for example
      ...Array(12).fill(null)
    ]
  },
  {
    id: 'validation-4',
    fileName: 'invalid_format.txt',
    uploadedAt: '2024-01-05T16:45:00Z',
    totalItems: 0,
    processingTime: 0.5,
    status: 'error',
    discrepancies: []
  }
];

export function ValidationHistory({ onViewDetails, onDeleteRequest, onExportRequest }: ValidationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [historyData] = useState<ValidationResult[]>(mockHistoryData);

  const filteredHistory = historyData.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleViewResults = (validationId: string) => {
    // In a real app, this would navigate to a detailed view or open a modal
    console.log('View results for:', validationId);
  };

  const handleDownloadReport = (validationId: string) => {
    // In a real app, this would trigger a download of the validation report
    console.log('Download report for:', validationId);
  };

  const handleDeleteValidation = (validationId: string) => {
    // In a real app, this would delete the validation record
    console.log('Delete validation:', validationId);
  };

  // Calculate summary statistics
  const totalValidations = historyData.length;
  const successfulValidations = historyData.filter(v => v.status === 'success').length;
  const totalDiscrepancies = historyData.reduce((sum, v) => sum + v.discrepancies.length, 0);
  const averageProcessingTime = historyData.reduce((sum, v) => sum + v.processingTime, 0) / historyData.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalValidations}</p>
                <p className="text-sm text-muted-foreground">Total Validations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successfulValidations}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDiscrepancies}</p>
                <p className="text-sm text-muted-foreground">Issues Found</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageProcessingTime.toFixed(1)}s</p>
                <p className="text-sm text-muted-foreground">Avg Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Validation History</CardTitle>
          <CardDescription>
            Review your previous invoice validations and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search file names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No validation history matches your current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((validation) => (
                    <TableRow key={validation.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(validation.status)}
                          <span className="font-medium">{validation.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(validation.uploadedAt).toLocaleDateString()}
                          <div className="text-muted-foreground">
                            {new Date(validation.uploadedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(validation.status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{validation.totalItems}</span>
                      </TableCell>
                      <TableCell>
                        {validation.discrepancies.length > 0 ? (
                          <Badge variant="outline" className="text-orange-600">
                            {validation.discrepancies.length} issues
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            No issues
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{validation.processingTime}s</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(validation)}
                            disabled={validation.status === 'error'}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onExportRequest(validation.id)}
                            disabled={validation.status === 'error'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRequest(validation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
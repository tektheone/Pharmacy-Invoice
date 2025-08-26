import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, CheckCircle2, Clock, Search, Eye, Trash2, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ValidationResult } from '../services/api';
import { pharmacyDataAPI } from '../services/api';

interface ValidationHistoryProps {
  onViewDetails: (validation: ValidationResult) => void;
  onDeleteRequest: (validationId: string) => void;
  onRefresh?: (refreshFn: () => void) => void;
}

export function ValidationHistory({ onViewDetails, onDeleteRequest, onRefresh }: ValidationHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [historyData, setHistoryData] = useState<ValidationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchValidationHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const history = await pharmacyDataAPI.getValidationHistory();
      setHistoryData(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch validation history';
      setError(errorMessage);
      console.error('Error fetching validation history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch validation history on component mount
  useEffect(() => {
    fetchValidationHistory();
  }, [fetchValidationHistory]);

  // Expose refresh function to parent component
  useEffect(() => {
    if (onRefresh) {
      onRefresh(fetchValidationHistory);
    }
  }, [onRefresh, fetchValidationHistory]);

  const filteredHistory = historyData.filter(item => {
    const matchesSearch = (item.fileName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (item.status || 'unknown') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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
  const successfulValidations = historyData.filter(v => (v.status || 'unknown') === 'success').length;
  const totalDiscrepancies = historyData.reduce((sum, v) => sum + (v.discrepancies?.length || 0), 0);
  const averageProcessingTime = totalValidations > 0
    ? historyData.reduce((sum, v) => sum + (v.processingTime || 0), 0) / totalValidations
    : 0;

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Validation History</CardTitle>
              <CardDescription>
                Review your previous invoice validations and their results
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchValidationHistory}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
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
                  <TableHead className="text-center">File Name</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-center">Issues</TableHead>
                  <TableHead className="text-center">Processing Time</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                        Loading validation history...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-red-500">
                      <div className="flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 mr-2" />
                        {error}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No validation history matches your current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHistory.map((validation) => (
                    <TableRow key={validation.id || `unknown-${Math.random()}`}>
                      <TableCell className="text-center">
                        <div className="flex items-center space-x-2 text-center justify-center">
                          {getStatusIcon(validation.status || 'unknown')}
                          <span className="font-medium">{validation.fileName || 'Unknown File'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {validation.uploadedAt ? new Date(validation.uploadedAt).toLocaleDateString() : 'Unknown Date'}
                          <div className="text-muted-foreground">
                            {validation.uploadedAt ? new Date(validation.uploadedAt).toLocaleTimeString() : 'Unknown Time'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(validation.status || 'unknown')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{validation.totalItems || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {(validation.discrepancies?.length || 0) > 0 ? (
                          <Badge variant="outline" className="text-orange-600">
                            {validation.discrepancies?.length || 0} issues
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            No issues
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{validation.processingTime || 0}s</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(validation)}
                            disabled={(validation.status || 'unknown') === 'error'}
                          >
                            <Eye className="h-4 w-4" />
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

          {/* Pagination Controls */}
          {filteredHistory.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              {/* Items per page selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>

              {/* Page info */}
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} results
              </div>

              {/* Pagination buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
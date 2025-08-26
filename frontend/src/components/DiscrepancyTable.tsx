import React, { useState, useMemo } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, AlertCircle, Info, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { Discrepancy } from '../services/api';

interface DiscrepancyTableProps {
  discrepancies: Discrepancy[];
}

type SortField = 'drugName' | 'type' | 'severity' | 'overchargePercentage' | 'patientName' | 'details';
type SortDirection = 'asc' | 'desc';

export function DiscrepancyTable({ discrepancies }: DiscrepancyTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('severity');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4" />;
      case 'low':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'price_overcharge':
        return 'Price Overcharge';
      case 'formulation_mismatch':
        return 'Formulation Mismatch';
      case 'strength_mismatch':
        return 'Strength Mismatch';
      case 'payer_mismatch':
        return 'Payer Mismatch';
      case 'drug_not_found':
        return 'Drug Not Found';
      default:
        return type;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDiscrepancies = useMemo(() => {
    return [...discrepancies].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'drugName':
          aValue = a.drugName.toLowerCase();
          bValue = b.drugName.toLowerCase();
          break;
        case 'patientName':
          aValue = (a.patientName || '').toLowerCase();
          bValue = (b.patientName || '').toLowerCase();
          break;
        case 'details':
          aValue = `${a.actualValue} ${a.expectedValue}`.toLowerCase();
          bValue = `${b.actualValue} ${b.expectedValue}`.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'severity':
          aValue = a.severity.toLowerCase();
          bValue = b.severity.toLowerCase();
          break;
        case 'overchargePercentage':
          aValue = a.overchargePercentage || 0;
          bValue = b.overchargePercentage || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [discrepancies, sortField, sortDirection]);

  const filteredAndSortedDiscrepancies = useMemo(() => {
    let filtered = sortedDiscrepancies.filter(discrepancy => {
      // Filter out null discrepancies
      if (!discrepancy) {
        return false;
      }

      // Backend provides drugName directly in the discrepancy
      const drugName = discrepancy.drugName || '';
      const matchesSearch = drugName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || discrepancy.severity === severityFilter;
      const matchesType = typeFilter === 'all' || discrepancy.type === typeFilter;

      return matchesSearch && matchesSeverity && matchesType;
    });

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [sortedDiscrepancies, searchTerm, severityFilter, typeFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, severityFilter, typeFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const uniqueTypes = Array.from(new Set(discrepancies.filter(d => d !== null).map(d => d.type)));

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drug names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(type => (
              <SelectItem key={type} value={type}>
                {getTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {currentPage * itemsPerPage - itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedDiscrepancies.length)} of {filteredAndSortedDiscrepancies.length} discrepancies
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center space-x-1">
                  <span>Drug Name</span>
                  <button onClick={() => handleSort('drugName')}>
                    {sortField === 'drugName' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center space-x-1">
                  <span>Patient Name</span>
                  <button onClick={() => handleSort('patientName')}>
                    {sortField === 'patientName' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </TableHead>
              <TableHead className="w-[200px]">
                <div className="flex items-center space-x-1">
                  <span>Details</span>
                  <button onClick={() => handleSort('details')}>
                    {sortField === 'details' ? (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('type')}
                  className="h-auto p-0 font-medium"
                >
                  Type
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('severity')}
                  className="h-auto p-0 font-medium"
                >
                  Severity
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Issue</TableHead>
              <TableHead className="text-right">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedDiscrepancies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No discrepancies match your current filters
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedDiscrepancies.map((discrepancy, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{discrepancy.drugName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {discrepancy.patientName || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">Invoice:</span> {discrepancy.actualValue}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Reference:</span> {discrepancy.expectedValue}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTypeLabel(discrepancy.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(discrepancy.severity) as any}>
                        {getSeverityIcon(discrepancy.severity)}
                        <span className="ml-1 capitalize">{discrepancy.severity}</span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{discrepancy.message || discrepancy.description}</div>
                      {discrepancy.expectedValue && discrepancy.actualValue && (
                        <div className="text-muted-foreground mt-1">
                          Expected: {discrepancy.expectedValue} → Actual: {discrepancy.actualValue}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {discrepancy.type === 'price_overcharge' && discrepancy.overchargePercentage && (
                      <div className="text-sm">
                        <div className="font-medium text-destructive">
                          {discrepancy.overchargePercentage >= 1000 ? '1000%+' : `+${discrepancy.overchargePercentage.toFixed(1)}%`}
                        </div>
                        <div className="text-muted-foreground">
                          ${discrepancy.overchargeAmount?.toFixed(2) || '0.00'} excess
                        </div>
                        {discrepancy.overchargePercentage >= 1000 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Extreme overcharge
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedDiscrepancies.length > 0 && (
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
            Page {currentPage} of {Math.ceil(filteredAndSortedDiscrepancies.length / itemsPerPage)}
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
              {Array.from({ length: Math.min(5, Math.ceil(filteredAndSortedDiscrepancies.length / itemsPerPage)) }, (_, i) => {
                let pageNum;
                if (Math.ceil(filteredAndSortedDiscrepancies.length / itemsPerPage) <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= Math.ceil(filteredAndSortedDiscrepancies.length / itemsPerPage) - 2) {
                  pageNum = Math.ceil(filteredAndSortedDiscrepancies.length / itemsPerPage) - 4 + i;
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
              disabled={currentPage === Math.ceil(filteredAndSortedDiscrepancies.length / itemsPerPage)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.ceil(filteredAndSortedDiscrepancies.length / itemsPerPage))}
              disabled={currentPage === Math.ceil(filteredAndSortedDiscrepancies.length / itemsPerPage)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
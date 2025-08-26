import React, { useState, useMemo } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, AlertCircle, Info, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Discrepancy } from './Dashboard';

interface DiscrepancyTableProps {
  discrepancies: Discrepancy[];
}

type SortField = 'drugName' | 'type' | 'severity' | 'overchargePercentage';
type SortDirection = 'asc' | 'desc';

export function DiscrepancyTable({ discrepancies }: DiscrepancyTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
      setSortDirection('desc');
    }
  };

  const filteredAndSortedDiscrepancies = useMemo(() => {
    let filtered = discrepancies.filter(discrepancy => {
      // Filter out null discrepancies
      if (!discrepancy || !discrepancy.invoiceItem) {
        return false;
      }

      const matchesSearch = discrepancy.invoiceItem.drugName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || discrepancy.severity === severityFilter;
      const matchesType = typeFilter === 'all' || discrepancy.type === typeFilter;

      return matchesSearch && matchesSeverity && matchesType;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'drugName':
          aValue = a.invoiceItem.drugName;
          bValue = b.invoiceItem.drugName;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 };
          aValue = severityOrder[a.severity as keyof typeof severityOrder];
          bValue = severityOrder[b.severity as keyof typeof severityOrder];
          break;
        case 'overchargePercentage':
          aValue = a.overchargePercentage || 0;
          bValue = b.overchargePercentage || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [discrepancies, searchTerm, severityFilter, typeFilter, sortField, sortDirection]);

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
        Showing {filteredAndSortedDiscrepancies.length} of {discrepancies.filter(d => d !== null).length} discrepancies
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('drugName')}
                  className="h-auto p-0 font-medium"
                >
                  Drug Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Details</TableHead>
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
              filteredAndSortedDiscrepancies.map((discrepancy) => (
                <TableRow key={discrepancy.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{discrepancy.invoiceItem.drugName}</div>
                      <div className="text-sm text-muted-foreground">
                        {discrepancy.invoiceItem.formulation} {discrepancy.invoiceItem.strength}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>Price: ${discrepancy.invoiceItem.unitPrice.toFixed(2)}</div>
                      <div>Qty: {discrepancy.invoiceItem.quantity}</div>
                      <div>Payer: {discrepancy.invoiceItem.payer}</div>
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
                      <div>{discrepancy.description}</div>
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
                          +{discrepancy.overchargePercentage}%
                        </div>
                        <div className="text-muted-foreground">
                          ${(discrepancy.invoiceItem.unitPrice * discrepancy.invoiceItem.quantity *
                            (discrepancy.overchargePercentage / 100)).toFixed(2)} excess
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
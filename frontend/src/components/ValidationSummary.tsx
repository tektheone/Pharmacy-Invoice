import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, FileText, DollarSign } from 'lucide-react';
import type { ValidationResult } from '../services/api';

interface ValidationSummaryProps {
  result: ValidationResult;
}

export function ValidationSummary({ result }: ValidationSummaryProps) {
  const { discrepancies, totalItems, fileName, uploadedAt, processingTime, status } = result;

  const highSeverityCount = discrepancies.filter(d => d.severity === 'high').length;
  const mediumSeverityCount = discrepancies.filter(d => d.severity === 'medium').length;
  const lowSeverityCount = discrepancies.filter(d => d.severity === 'low').length;

  const overchargeDiscrepancies = discrepancies.filter(d => d.type === 'price_overcharge');
  const totalOvercharge = overchargeDiscrepancies.reduce((sum, d) => {
    if (typeof d.overchargeAmount === 'number') {
      return sum + d.overchargeAmount;
    }
    if (typeof d.overchargePercentage === 'number') {
      return sum + ((d.invoiceItem?.unitPrice || 0) * (d.invoiceItem?.quantity || 0) * (d.overchargePercentage / 100));
    }
    return sum;
  }, 0);

  // Calculate success rate based on items with no discrepancies
  const itemsWithDiscrepancies = new Set(discrepancies.map(d => d.drugName)).size;
  const successRate = totalItems > 0 ? ((totalItems - itemsWithDiscrepancies) / totalItems) * 100 : 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Validation Complete';
      case 'partial':
        return 'Partial Validation';
      case 'error':
        return 'Validation Failed';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className="space-y-6">
      {/* File Info and Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Validation Results</span>
              </CardTitle>
              <CardDescription>{fileName}</CardDescription>
            </div>
            <Badge
              variant={status === 'success' ? 'default' : status === 'partial' ? 'secondary' : 'destructive'}
              className="flex items-center space-x-1"
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
              <span>{getStatusText(status)}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Uploaded</p>
              <p className="font-medium">{new Date(uploadedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Processing Time</p>
              <p className="font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {processingTime >= 1
                  ? `${processingTime.toFixed(2)}s`
                  : `${(processingTime * 1000).toFixed(0)} ms`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Items</p>
              <p className="font-medium">{totalItems}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Success Rate</p>
              <p className="font-medium">{successRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Discrepancies */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{discrepancies.length}</p>
                <p className="text-sm text-muted-foreground">Total Issues</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={(itemsWithDiscrepancies / totalItems) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {((itemsWithDiscrepancies / totalItems) * 100).toFixed(1)}% of items
              </p>
            </div>
          </CardContent>
        </Card>

        {/* High Severity Issues */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{highSeverityCount}</p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
            {highSeverityCount > 0 && (
              <div className="mt-2">
                <Badge variant="destructive" className="text-xs">
                  Requires immediate attention
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medium Severity Issues */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{mediumSeverityCount}</p>
                <p className="text-sm text-muted-foreground">Medium Priority</p>
              </div>
            </div>
            {mediumSeverityCount > 0 && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  Review recommended
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Impact */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ${totalOvercharge.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Potential Savings</p>
              </div>
            </div>
            {totalOvercharge > 0 && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Price overcharges detected
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Issue Type */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Breakdown</CardTitle>
          <CardDescription>Distribution of discrepancy types found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(
              discrepancies.reduce((acc, d) => {
                acc[d.type] = (acc[d.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => {
              const numericCount = Number(count) || 0;
              const percentage = (numericCount / discrepancies.length) * 100;
              const getTypeLabel = (type: string) => {
                switch (type) {
                  case 'price_overcharge': return 'Price Overcharge';
                  case 'formulation_mismatch': return 'Formulation Mismatch';
                  case 'strength_mismatch': return 'Strength Mismatch';
                  case 'payer_mismatch': return 'Payer Mismatch';
                  case 'drug_not_found': return 'Drug Not Found';
                  default: return type;
                }
              };

              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{getTypeLabel(type)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {numericCount} issue{numericCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
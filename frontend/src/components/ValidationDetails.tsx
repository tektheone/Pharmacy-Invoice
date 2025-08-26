import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DiscrepancyTable } from './DiscrepancyTable';
import {
  ArrowLeft,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  BarChart3,
  TrendingUp,
  Eye,
  Calendar
} from 'lucide-react';
import type { ValidationResult } from '../services/api';

interface ValidationDetailsProps {
  validation: ValidationResult;
  onBack: () => void;
}

export function ValidationDetails({ validation, onBack }: ValidationDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    fileName,
    uploadedAt,
    totalItems,
    discrepancies,
    processingTime,
    status
  } = validation;

  // Calculate statistics
  const highSeverityCount = discrepancies.filter(d => d && d.severity === 'high').length;
  const mediumSeverityCount = discrepancies.filter(d => d && d.severity === 'medium').length;
  const lowSeverityCount = discrepancies.filter(d => d && d.severity === 'low').length;
  // Calculate success rate based on items with no discrepancies
  const itemsWithDiscrepancies = new Set(discrepancies.filter(d => d !== null).map(d => d.drugName)).size;
  const successRate = totalItems > 0 ? ((totalItems - itemsWithDiscrepancies) / totalItems) * 100 : 100;

  const overchargeDiscrepancies = discrepancies.filter(d => d && d.type === 'price_overcharge');
  const totalOvercharge = overchargeDiscrepancies.reduce((sum, d) => {
    if (d && d.overchargeAmount) {
      return sum + d.overchargeAmount;
    }
    if (d && d.overchargePercentage) {
      // Fallback calculation if overchargeAmount is not available
      return sum + (d.overchargePercentage / 100);
    }
    return sum;
  }, 0);

  const discrepancyBreakdown = discrepancies.filter(d => d !== null).reduce((acc, d) => {
    if (d) {
      acc[d.type] = (acc[d.type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'partial': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Validation Details</h1>
            <p className="text-muted-foreground">{fileName}</p>
          </div>
        </div>

      </div>

      {/* Status Banner */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon(status)}
              <div>
                <h3 className={`text-lg font-medium ${getStatusColor(status)}`}>
                  Validation {status === 'success' ? 'Completed' : status === 'partial' ? 'Partially Completed' : 'Failed'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Processed on {formatDate(uploadedAt)} • {processingTime}s processing time
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{discrepancies.length}</p>
              <p className="text-sm text-muted-foreground">Issues Found</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="discrepancies" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Issues ({discrepancies.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Summary</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalItems}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{highSeverityCount}</p>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
              </CardContent>
            </Card>
          </div>

          {/* File Information */}
          <Card>
            <CardHeader>
              <CardTitle>File Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">File Name</p>
                  <p className="font-medium">{fileName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Upload Date</p>
                  <p className="font-medium">{formatDate(uploadedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Processing Time</p>
                  <p className="font-medium">{processingTime} seconds</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Validation ID</p>
                  <p className="font-medium font-mono text-sm">{validation.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Breakdown</CardTitle>
              <CardDescription>Distribution of discrepancy types found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(discrepancyBreakdown).map(([type, count]) => {
                  const percentage = (count / discrepancies.length) * 100;
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{getTypeLabel(type)}</Badge>
                        <span className="text-sm font-medium">
                          {count} issue{count !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discrepancies Tab */}
        <TabsContent value="discrepancies">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Issues</CardTitle>
              <CardDescription>
                All discrepancies found during validation with filtering and sorting options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DiscrepancyTable discrepancies={discrepancies} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>High Severity</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{highSeverityCount}</span>
                      <div className="text-sm text-muted-foreground">
                        {discrepancies.length > 0 ? ((highSeverityCount / discrepancies.length) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <Progress value={discrepancies.length > 0 ? (highSeverityCount / discrepancies.length) * 100 : 0} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Medium Severity</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{mediumSeverityCount}</span>
                      <div className="text-sm text-muted-foreground">
                        {discrepancies.length > 0 ? ((mediumSeverityCount / discrepancies.length) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <Progress value={discrepancies.length > 0 ? (mediumSeverityCount / discrepancies.length) * 100 : 0} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Low Severity</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{lowSeverityCount}</span>
                      <div className="text-sm text-muted-foreground">
                        {discrepancies.length > 0 ? ((lowSeverityCount / discrepancies.length) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <Progress value={discrepancies.length > 0 ? (lowSeverityCount / discrepancies.length) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Financial Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-green-600">${totalOvercharge.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Potential Savings</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Price Overcharges</span>
                      <span className="font-medium">{overchargeDiscrepancies.length} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Overcharge</span>
                      <span className="font-medium">
                        {overchargeDiscrepancies.length > 0
                          ? (overchargeDiscrepancies.reduce((sum, d) => sum + (d.overchargePercentage || 0), 0) / overchargeDiscrepancies.length).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Affected Amount</span>
                      <span className="font-medium">
                        ${overchargeDiscrepancies.reduce((sum, d) => sum + (d.invoiceItem?.totalAmount || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Validation Summary Report</CardTitle>
              <CardDescription>
                Complete overview of the validation process and findings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <h3>Executive Summary</h3>
                <p>
                  The validation of <strong>{fileName}</strong> was completed on {formatDate(uploadedAt)}
                  with a processing time of {processingTime} seconds. Out of {totalItems} total items
                  processed, {discrepancies.length} discrepancies were identified, resulting in a
                  {successRate.toFixed(1)}% success rate.
                </p>

                <h3>Key Findings</h3>
                <ul>
                  <li><strong>{highSeverityCount}</strong> high-priority issues requiring immediate attention</li>
                  <li><strong>{mediumSeverityCount}</strong> medium-priority issues for review</li>
                  <li><strong>{lowSeverityCount}</strong> low-priority issues for monitoring</li>
                  <li>Potential cost savings of <strong>${totalOvercharge.toFixed(2)}</strong> identified</li>
                </ul>

                <h3>Recommendations</h3>
                <ul>
                  <li>Address all high-priority discrepancies immediately</li>
                  <li>Review price overcharges to ensure billing accuracy</li>
                  <li>Verify formulation and strength mismatches with suppliers</li>
                  <li>Update payer information where discrepancies were found</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
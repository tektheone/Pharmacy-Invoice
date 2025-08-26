import React, { useState, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { ValidationHistory } from './components/ValidationHistory';
import { ValidationDetails } from './components/ValidationDetails';

import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import { ExportReportDialog } from './components/ExportReportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { FileText, History } from 'lucide-react';
import { ValidationResult } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState<'validation' | 'history' | 'details'>('validation');
  const [selectedValidation, setSelectedValidation] = useState<ValidationResult | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; validationId: string | null }>({
    open: false,
    validationId: null
  });
  const [exportDialog, setExportDialog] = useState<{ open: boolean; validationId: string | null }>({
    open: false,
    validationId: null
  });
  const [refreshHistory, setRefreshHistory] = useState<(() => void) | null>(null);

  const handleRefreshHistory = useCallback((refreshFn: () => void) => {
    setRefreshHistory(() => refreshFn);
  }, []);

  const handleViewDetails = (validation: ValidationResult) => {
    setSelectedValidation(validation);
    setCurrentView('details');
  };

  const handleBackToHistory = () => {
    setCurrentView('history');
    setSelectedValidation(null);
  };

  const handleDeleteRequest = (validationId: string) => {
    setDeleteDialog({ open: true, validationId });
  };



  const renderCurrentView = () => {
    switch (currentView) {
      case 'details':
        return selectedValidation ? (
          <ValidationDetails
            validation={selectedValidation}
            onBack={handleBackToHistory}
          />
        ) : null;

      case 'history':
        return (
          <ValidationHistory
            onViewDetails={handleViewDetails}
            onDeleteRequest={handleDeleteRequest}
            onRefresh={handleRefreshHistory}
          />
        );
      case 'validation':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Pharmacy Data Solutions</h1>
                <p className="text-sm text-muted-foreground">Invoice Validation & Analysis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {currentView === 'details' ? (
          renderCurrentView()
        ) : (
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="validation" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Validation</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="validation">
              <Dashboard />
            </TabsContent>

            <TabsContent value="history">
              <ValidationHistory
                onViewDetails={handleViewDetails}
                onDeleteRequest={handleDeleteRequest}
                onRefresh={handleRefreshHistory}
              />
            </TabsContent>


          </Tabs>
        )}
      </main>

      {/* Dialogs */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        validationId={deleteDialog.validationId}
        onOpenChange={(open) => setDeleteDialog({ open, validationId: null })}
        onDeleteSuccess={() => {
          // Refresh the validation history after successful deletion
          if (refreshHistory) {
            refreshHistory();
          }
        }}
      />

      <ExportReportDialog
        open={exportDialog.open}
        validationId={exportDialog.validationId}
        onOpenChange={(open) => setExportDialog({ open, validationId: null })}
      />
    </div>
  );
}
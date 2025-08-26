import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { ValidationHistory } from './components/ValidationHistory';
import { ValidationDetails } from './components/ValidationDetails';
import { SettingsPage } from './components/SettingsPage';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import { ExportReportDialog } from './components/ExportReportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { FileText, History, Settings } from 'lucide-react';
import { ValidationResult } from './components/Dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<'validation' | 'history' | 'details' | 'settings'>('validation');
  const [selectedValidation, setSelectedValidation] = useState<ValidationResult | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; validationId: string | null }>({
    open: false,
    validationId: null
  });
  const [exportDialog, setExportDialog] = useState<{ open: boolean; validationId: string | null }>({
    open: false,
    validationId: null
  });

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

  const handleExportRequest = (validationId: string) => {
    setExportDialog({ open: true, validationId });
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
      case 'settings':
        return <SettingsPage />;
      case 'history':
        return (
          <ValidationHistory
            onViewDetails={handleViewDetails}
            onDeleteRequest={handleDeleteRequest}
            onExportRequest={handleExportRequest}
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
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="validation" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Validation</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>History</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="validation">
              <Dashboard />
            </TabsContent>

            <TabsContent value="history">
              <ValidationHistory
                onViewDetails={handleViewDetails}
                onDeleteRequest={handleDeleteRequest}
                onExportRequest={handleExportRequest}
              />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsPage />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Dialogs */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        validationId={deleteDialog.validationId}
        onOpenChange={(open) => setDeleteDialog({ open, validationId: null })}
      />

      <ExportReportDialog
        open={exportDialog.open}
        validationId={exportDialog.validationId}
        onOpenChange={(open) => setExportDialog({ open, validationId: null })}
      />
    </div>
  );
}
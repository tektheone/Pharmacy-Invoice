import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Settings,
  Database,
  Bell,
  Shield,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  RefreshCw,
  Globe,
  Key,
  Server
} from 'lucide-react';
import { pharmacyDataAPI } from '../services/api';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    // API Settings
    apiUrl: 'https://685daed17b57aebd2af6da54.mockapi.io/api/v1/drugs',
    apiKey: '',
    timeout: 30,
    retryAttempts: 3,

    // Validation Settings
    overchargeThreshold: 10,
    autoSaveResults: true,
    includeAnalytics: true,
    validateOnUpload: true,

    // Notification Settings
    emailNotifications: true,
    browserNotifications: false,
    notifyOnCompletion: true,
    notifyOnErrors: true,

    // Export Settings
    defaultExportFormat: 'pdf',
    includeChartsDefault: true,
    maxFileSize: 10,

    // Security Settings
    dataRetention: 30,
    autoLogout: 60,
    requireConfirmation: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await pharmacyDataAPI.healthCheck();
      setConnectionStatus('success');
    } catch {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      apiUrl: 'https://685daed17b57aebd2af6da54.mockapi.io/api/v1/drugs',
      apiKey: '',
      timeout: 30,
      retryAttempts: 3,
      overchargeThreshold: 10,
      autoSaveResults: true,
      includeAnalytics: true,
      validateOnUpload: true,
      emailNotifications: true,
      browserNotifications: false,
      notifyOnCompletion: true,
      notifyOnErrors: true,
      defaultExportFormat: 'pdf',
      includeChartsDefault: true,
      maxFileSize: 10,
      dataRetention: 30,
      autoLogout: 60,
      requireConfirmation: true
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your pharmacy data validation preferences and system settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {saveStatus === 'success' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to save settings. Please try again.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>API & Data</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Validation</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* API & Data Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Reference Data API</span>
              </CardTitle>
              <CardDescription>
                Configure the connection to your drug reference database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">API Endpoint</Label>
                <div className="flex space-x-2">
                  <Input
                    id="api-url"
                    value={settings.apiUrl}
                    onChange={(e) => updateSetting('apiUrl', e.target.value)}
                    placeholder="Enter API URL"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? 'Testing...' : 'Test'}
                  </Button>
                </div>
                {connectionStatus === 'success' && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Connection successful
                  </p>
                )}
                {connectionStatus === 'error' && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Connection failed
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key (Optional)</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => updateSetting('apiKey', e.target.value)}
                  placeholder="Enter API key if required"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={settings.timeout}
                    onChange={(e) => updateSetting('timeout', parseInt(e.target.value))}
                    min="10"
                    max="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    value={settings.retryAttempts}
                    onChange={(e) => updateSetting('retryAttempts', parseInt(e.target.value))}
                    min="1"
                    max="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>File Upload Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                <Input
                  id="max-file-size"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-validate on upload</Label>
                  <p className="text-sm text-muted-foreground">
                    Start validation immediately after file upload
                  </p>
                </div>
                <Switch
                  checked={settings.validateOnUpload}
                  onCheckedChange={(checked) => updateSetting('validateOnUpload', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Settings */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Parameters</CardTitle>
              <CardDescription>
                Configure the validation rules and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="overcharge-threshold">
                  Price Overcharge Threshold (%)
                </Label>
                <Input
                  id="overcharge-threshold"
                  type="number"
                  value={settings.overchargeThreshold}
                  onChange={(e) => updateSetting('overchargeThreshold', parseInt(e.target.value))}
                  min="1"
                  max="50"
                />
                <p className="text-sm text-muted-foreground">
                  Flag prices that exceed reference by this percentage
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save results</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save validation results to history
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSaveResults}
                    onCheckedChange={(checked) => updateSetting('autoSaveResults', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate detailed analytics and charts
                    </p>
                  </div>
                  <Switch
                    checked={settings.includeAnalytics}
                    onCheckedChange={(checked) => updateSetting('includeAnalytics', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Defaults</CardTitle>
              <CardDescription>
                Set default options for report exports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default export format</Label>
                <Select
                  value={settings.defaultExportFormat}
                  onValueChange={(value) => updateSetting('defaultExportFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="excel">Excel Workbook</SelectItem>
                    <SelectItem value="csv">CSV Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Include charts by default</Label>
                  <p className="text-sm text-muted-foreground">
                    Include visualizations in exported reports
                  </p>
                </div>
                <Switch
                  checked={settings.includeChartsDefault}
                  onCheckedChange={(checked) => updateSetting('includeChartsDefault', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about validation results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about validations
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Browser notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={settings.browserNotifications}
                  onCheckedChange={(checked) => updateSetting('browserNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify on completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when validation completes
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnCompletion}
                  onCheckedChange={(checked) => updateSetting('notifyOnCompletion', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify on errors</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when validation fails
                  </p>
                </div>
                <Switch
                  checked={settings.notifyOnErrors}
                  onCheckedChange={(checked) => updateSetting('notifyOnErrors', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Configure data retention and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data-retention">
                  Data Retention Period (days)
                </Label>
                <Input
                  id="data-retention"
                  type="number"
                  value={settings.dataRetention}
                  onChange={(e) => updateSetting('dataRetention', parseInt(e.target.value))}
                  min="7"
                  max="365"
                />
                <p className="text-sm text-muted-foreground">
                  Validation history will be automatically deleted after this period
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-logout">
                  Auto-logout after inactivity (minutes)
                </Label>
                <Input
                  id="auto-logout"
                  type="number"
                  value={settings.autoLogout}
                  onChange={(e) => updateSetting('autoLogout', parseInt(e.target.value))}
                  min="15"
                  max="480"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require confirmation for deletions</Label>
                  <p className="text-sm text-muted-foreground">
                    Show confirmation dialog before deleting data
                  </p>
                </div>
                <Switch
                  checked={settings.requireConfirmation}
                  onCheckedChange={(checked) => updateSetting('requireConfirmation', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect all your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    The following actions cannot be undone. Please proceed with caution.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">Clear all validation history</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete all validation records and reports
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
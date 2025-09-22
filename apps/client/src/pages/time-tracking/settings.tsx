import { useState } from 'react';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import RoleDebugInfo from '../../components/debug/role-debug-info';

export default function TimeTrackingSettingsPage() {
    const [settings, setSettings] = useState({
        // General Settings
        requireJobSelection: true,
        requireOperationSelection: true,
        allowManualTimeEntry: false,
        autoClockOut: true,
        autoClockOutHours: 12,

        // Units Tracking
        enableUnitsTracking: true,
        requireUnitsForProduction: true,
        allowZeroUnits: false,

        // Break Management
        enableBreakTracking: true,
        maxBreakMinutes: 30,
        requireBreakApproval: false,

        // Approval Workflow
        requireManagerApproval: true,
        autoApproveRegularHours: false,
        maxHoursWithoutApproval: 8,

        // Overtime Settings
        overtimeThreshold: 8,
        doubleTimeThreshold: 12,
        weeklyOvertimeThreshold: 40,

        // Notifications
        emailNotifications: true,
        clockInReminders: true,
        clockOutReminders: true,
        managerNotifications: true
    });

    const [activeSection, setActiveSection] = useState('general');

    const handleSettingChange = (setting: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const handleSaveSettings = () => {
        console.log('Saving settings:', settings);
        // API call to save settings
        alert('Settings saved successfully!');
    };

    const handleResetToDefaults = () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            // Reset to default values
            console.log('Resetting to defaults');
        }
    };

    const renderGeneralSettings = () => (
        <Card>
            <h3 className="text-lg font-semibold text-text mb-4">General Time Tracking Settings</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Require Job Selection</label>
                        <p className="text-sm text-text-muted">Employees must select a job when clocking in</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.requireJobSelection}
                        onChange={(e) => handleSettingChange('requireJobSelection', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Require Operation Selection</label>
                        <p className="text-sm text-text-muted">Employees must select an operation when clocking in</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.requireOperationSelection}
                        onChange={(e) => handleSettingChange('requireOperationSelection', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Allow Manual Time Entry</label>
                        <p className="text-sm text-text-muted">Allow employees to manually enter time instead of using clock in/out</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.allowManualTimeEntry}
                        onChange={(e) => handleSettingChange('allowManualTimeEntry', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Auto Clock Out</label>
                        <p className="text-sm text-text-muted">Automatically clock out employees after a set number of hours</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.autoClockOut}
                        onChange={(e) => handleSettingChange('autoClockOut', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>

                {settings.autoClockOut && (
                    <div className="ml-4">
                        <label className="block text-sm font-medium text-text mb-2">Auto Clock Out After (hours)</label>
                        <input
                            type="number"
                            min="1"
                            max="24"
                            value={settings.autoClockOutHours}
                            onChange={(e) => handleSettingChange('autoClockOutHours', parseInt(e.target.value))}
                            className="w-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text"
                        />
                    </div>
                )}
            </div>
        </Card>
    );

    const renderUnitsSettings = () => (
        <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Units Tracking Settings</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Enable Units Tracking</label>
                        <p className="text-sm text-text-muted">Track units produced during work sessions</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.enableUnitsTracking}
                        onChange={(e) => handleSettingChange('enableUnitsTracking', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Require Units for Production Jobs</label>
                        <p className="text-sm text-text-muted">Production jobs must have units entered before clocking out</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.requireUnitsForProduction}
                        onChange={(e) => handleSettingChange('requireUnitsForProduction', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Allow Zero Units</label>
                        <p className="text-sm text-text-muted">Allow employees to enter 0 units (e.g., for setup time)</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.allowZeroUnits}
                        onChange={(e) => handleSettingChange('allowZeroUnits', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>
            </div>
        </Card>
    );

    const renderOvertimeSettings = () => (
        <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Overtime Settings</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text mb-2">Daily Overtime Threshold (hours)</label>
                    <input
                        type="number"
                        min="1"
                        max="24"
                        step="0.5"
                        value={settings.overtimeThreshold}
                        onChange={(e) => handleSettingChange('overtimeThreshold', parseFloat(e.target.value))}
                        className="w-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text mb-2">Double Time Threshold (hours)</label>
                    <input
                        type="number"
                        min="1"
                        max="24"
                        step="0.5"
                        value={settings.doubleTimeThreshold}
                        onChange={(e) => handleSettingChange('doubleTimeThreshold', parseFloat(e.target.value))}
                        className="w-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text mb-2">Weekly Overtime Threshold (hours)</label>
                    <input
                        type="number"
                        min="1"
                        max="80"
                        step="0.5"
                        value={settings.weeklyOvertimeThreshold}
                        onChange={(e) => handleSettingChange('weeklyOvertimeThreshold', parseFloat(e.target.value))}
                        className="w-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text"
                    />
                </div>
            </div>
        </Card>
    );

    const renderApprovalSettings = () => (
        <Card>
            <h3 className="text-lg font-semibold text-text mb-4">Approval Workflow Settings</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Require Manager Approval</label>
                        <p className="text-sm text-text-muted">All time entries require manager approval</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.requireManagerApproval}
                        onChange={(e) => handleSettingChange('requireManagerApproval', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="font-medium text-text">Auto-approve Regular Hours</label>
                        <p className="text-sm text-text-muted">Automatically approve entries within normal hours</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.autoApproveRegularHours}
                        onChange={(e) => handleSettingChange('autoApproveRegularHours', e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                </div>

                {settings.autoApproveRegularHours && (
                    <div className="ml-4">
                        <label className="block text-sm font-medium text-text mb-2">Max Hours Without Approval</label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            step="0.5"
                            value={settings.maxHoursWithoutApproval}
                            onChange={(e) => handleSettingChange('maxHoursWithoutApproval', parseFloat(e.target.value))}
                            className="w-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text"
                        />
                    </div>
                )}
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <RoleDebugInfo />

            <div>
                <h1 className="text-3xl font-bold text-text mb-2">Time Tracking Settings</h1>
                <p className="text-text-muted">Configure time tracking system behavior and policies</p>
            </div>

            {/* Section Navigation */}
            <Card>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => setActiveSection('general')}
                        variant={activeSection === 'general' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        General
                    </Button>
                    <Button
                        onClick={() => setActiveSection('units')}
                        variant={activeSection === 'units' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Units Tracking
                    </Button>
                    <Button
                        onClick={() => setActiveSection('overtime')}
                        variant={activeSection === 'overtime' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Overtime
                    </Button>
                    <Button
                        onClick={() => setActiveSection('approval')}
                        variant={activeSection === 'approval' ? 'primary' : 'secondary'}
                        size="sm"
                    >
                        Approvals
                    </Button>
                </div>
            </Card>

            {/* Settings Content */}
            {activeSection === 'general' && renderGeneralSettings()}
            {activeSection === 'units' && renderUnitsSettings()}
            {activeSection === 'overtime' && renderOvertimeSettings()}
            {activeSection === 'approval' && renderApprovalSettings()}

            {/* Action Buttons */}
            <Card>
                <div className="flex justify-between items-center">
                    <Button
                        onClick={handleResetToDefaults}
                        variant="secondary"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                        Reset to Defaults
                    </Button>
                    <div className="flex space-x-2">
                        <Button variant="secondary">
                            Export Configuration
                        </Button>
                        <Button
                            onClick={handleSaveSettings}
                            variant="primary"
                        >
                            Save Settings
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Current Configuration Summary */}
            <Card className="bg-muted">
                <h3 className="text-lg font-semibold text-text mb-4">Current Configuration Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text">
                    <div>
                        <p><strong>Job Selection:</strong> {settings.requireJobSelection ? 'Required' : 'Optional'}</p>
                        <p><strong>Operation Selection:</strong> {settings.requireOperationSelection ? 'Required' : 'Optional'}</p>
                        <p><strong>Manual Entry:</strong> {settings.allowManualTimeEntry ? 'Allowed' : 'Disabled'}</p>
                        <p><strong>Auto Clock Out:</strong> {settings.autoClockOut ? `${settings.autoClockOutHours} hours` : 'Disabled'}</p>
                    </div>
                    <div>
                        <p><strong>Units Tracking:</strong> {settings.enableUnitsTracking ? 'Enabled' : 'Disabled'}</p>
                        <p><strong>Manager Approval:</strong> {settings.requireManagerApproval ? 'Required' : 'Optional'}</p>
                        <p><strong>Overtime Threshold:</strong> {settings.overtimeThreshold} hours/day</p>
                        <p><strong>Weekly Overtime:</strong> {settings.weeklyOvertimeThreshold} hours/week</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

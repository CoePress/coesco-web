/**
 * Auto-Fill UI Components
 * 
 * Provides visual indicators and controls for the auto-fill system:
 * - Field indicators showing auto-filled vs manual values
 * - Auto-fill status and progress
 * - User controls for accepting/rejecting auto-fills
 */

import React, { useState } from 'react';
import {
    Wand2,
    Check,
    X,
    Settings,
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    Sparkles,
    Zap
} from 'lucide-react';
import { Button, Text, Modal } from '@/components';
import { useAutoFill } from '../../contexts/performance/autofill.context';

// Simple Switch component
const Switch: React.FC<{
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    id?: string;
}> = ({ checked, onCheckedChange, id }) => (
    <button
        id={id}
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'
            }`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                }`}
        />
    </button>
);

// Field Indicator Component
interface AutoFillFieldIndicatorProps {
    fieldPath: string;
    isVisible?: boolean;
    className?: string;
}

export const AutoFillFieldIndicator: React.FC<AutoFillFieldIndicatorProps> = ({
    fieldPath,
    isVisible = true,
    className = ''
}) => {
    const { isFieldAutoFilled, markFieldAsManual } = useAutoFill();
    const isAutoFilled = isFieldAutoFilled(fieldPath);

    if (!isVisible || !isAutoFilled) {
        return null;
    }

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            <span className="inline-flex items-center text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                <Sparkles className="w-3 h-3 mr-1" />
                Auto-filled
            </span>
            <button
                onClick={() => markFieldAsManual(fieldPath)}
                className="h-6 w-6 p-0.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                title="Mark as manually entered"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
};

// Auto-Fill Status Component
export const AutoFillStatus: React.FC = () => {
    const { state } = useAutoFill();
    const [showDetails, setShowDetails] = useState(false);

    if (!state.settings.enabled) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {state.isAutoFilling && (
                <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <Text className="text-sm">Generating auto-fill values...</Text>
                </div>
            )}

            {state.error && (
                <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <Text className="text-sm">Auto-fill error: {state.error}</Text>
                </div>
            )}

            {state.hasSufficientData && !state.isAutoFilling && !state.error && (
                <div className="flex items-center gap-2 text-green-600">
                    <Zap className="w-4 h-4" />
                    <Text className="text-sm">Auto-fill ready</Text>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(!showDetails)}
                        className="h-6 w-6 p-0"
                    >
                        {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                </div>
            )}

            {showDetails && (
                <div className="text-xs text-gray-500">
                    Auto-filled fields: {state.autoFilledFields.size}
                </div>
            )}
        </div>
    );
};

// Auto-Fill Confirmation Modal
interface AutoFillConfirmationModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onReject: () => void;
    autoFillData: any;
}

export const AutoFillConfirmationModal: React.FC<AutoFillConfirmationModalProps> = ({
    isOpen,
    onAccept,
    onReject,
    autoFillData
}) => {
    const [previewMode, setPreviewMode] = useState(false);

    if (!isOpen || !autoFillData) {
        return null;
    }

    const fillableTabs = autoFillData.metadata?.fillableTabs || [];
    const autoFilledFieldCount = autoFillData.metadata?.autoFilledFieldCount || 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onReject}
            title="Auto-Fill Suggestions Available"
            size="md"
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Wand2 className="w-8 h-8 text-blue-600" />
                    <div>
                        <Text className="font-medium text-blue-900">
                            Auto-fill values generated successfully
                        </Text>
                        <Text className="text-sm text-blue-700">
                            Found minimum valid values for {fillableTabs.length} tabs with {autoFilledFieldCount} fields
                        </Text>
                    </div>
                </div>

                <div>
                    <Text className="font-medium mb-2">Tabs that will be updated:</Text>
                    <div className="flex flex-wrap gap-2">
                        {fillableTabs.map((tab: string) => (
                            <span key={tab} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                                {tab.replace('-', ' ')}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Switch
                        checked={previewMode}
                        onCheckedChange={setPreviewMode}
                        id="preview-mode"
                    />
                    <label htmlFor="preview-mode" className="text-sm">
                        Show detailed preview (advanced)
                    </label>
                </div>

                {previewMode && (
                    <div className="max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
                        <pre className="text-xs text-gray-700">
                            {JSON.stringify(autoFillData.data, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="secondary-outline"
                        onClick={onReject}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onAccept}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Accept Auto-Fill
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// Auto-Fill Settings Modal
interface AutoFillSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AutoFillSettingsModal: React.FC<AutoFillSettingsModalProps> = ({
    isOpen,
    onClose
}) => {
    const { state, updateSettings } = useAutoFill();
    const { settings } = state;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Auto-Fill Settings"
            size="sm"
        >
            <div className="space-y-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Text className="font-medium">Enable Auto-Fill</Text>
                            <Text className="text-sm text-gray-600">
                                Automatically suggest values when sufficient data is entered
                            </Text>
                        </div>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={(enabled) => updateSettings({ enabled })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Text className="font-medium">Preserve User Input</Text>
                            <Text className="text-sm text-gray-600">
                                Don't overwrite fields you've already filled
                            </Text>
                        </div>
                        <Switch
                            checked={settings.preserveUserInput}
                            onCheckedChange={(preserveUserInput) => updateSettings({ preserveUserInput })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Text className="font-medium">Prioritize Models</Text>
                            <Text className="text-sm text-gray-600">
                                Fill equipment models before individual parameters
                            </Text>
                        </div>
                        <Switch
                            checked={settings.prioritizeModels}
                            onCheckedChange={(prioritizeModels) => updateSettings({ prioritizeModels })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Text className="font-medium">Show Notifications</Text>
                            <Text className="text-sm text-gray-600">
                                Display status updates and completion messages
                            </Text>
                        </div>
                        <Switch
                            checked={settings.showNotifications}
                            onCheckedChange={(showNotifications) => updateSettings({ showNotifications })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Text className="font-medium">Require Confirmation</Text>
                            <Text className="text-sm text-gray-600">
                                Ask before applying auto-fill suggestions
                            </Text>
                        </div>
                        <Switch
                            checked={settings.requireConfirmation}
                            onCheckedChange={(requireConfirmation) => updateSettings({ requireConfirmation })}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                        <div>Auto-filled fields: {state.autoFilledFields.size}</div>
                        {state.lastAutoFillTimestamp && (
                            <div>
                                Last auto-fill: {new Date(state.lastAutoFillTimestamp).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};

// Auto-Fill Control Panel (for performance sheet header)
export const AutoFillControlPanel: React.FC = () => {
    const { state, acceptAutoFill, rejectAutoFill } = useAutoFill();
    const [showSettings, setShowSettings] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Show confirmation modal when pending auto-fill
    React.useEffect(() => {
        if (state.pendingAutoFill && state.settings.requireConfirmation) {
            setShowConfirmation(true);
        }
    }, [state.pendingAutoFill, state.settings.requireConfirmation]);

    const handleAcceptAutoFill = async () => {
        if (state.autoFillResults?.data) {
            await acceptAutoFill(state.autoFillResults.data);
            setShowConfirmation(false);
        }
    };

    const handleRejectAutoFill = () => {
        rejectAutoFill();
        setShowConfirmation(false);
    };

    if (!state.settings.enabled) {
        return null;
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <AutoFillStatus />

                <button
                    onClick={() => setShowSettings(true)}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                    title="Auto-fill settings"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            <AutoFillSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />

            <AutoFillConfirmationModal
                isOpen={showConfirmation}
                onAccept={handleAcceptAutoFill}
                onReject={handleRejectAutoFill}
                autoFillData={state.autoFillResults}
            />
        </>
    );
};

// Tab Auto-Fill Indicator Component
interface TabAutoFillIndicatorProps {
    tabName: string;
    label?: string;
    className?: string;
}

export const TabAutoFillIndicator: React.FC<TabAutoFillIndicatorProps> = ({
    tabName,
    label,
    className = ''
}) => {
    const { canAutoFillTab, state } = useAutoFill();

    const canFill = canAutoFillTab(tabName);
    const isInFillableList = state.fillableTabs.includes(tabName);

    if (!canFill && !isInFillableList) {
        return null;
    }

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            <div className={`w-2 h-2 rounded-full ${canFill ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
            <span className="text-xs text-gray-600">
                {canFill ? 'Ready to auto-fill' : 'Partial data available'}
            </span>
            {label && (
                <span className="text-xs text-gray-500">({label})</span>
            )}
        </div>
    );
};

// Tab Auto-Fill Status Bar Component
export const TabAutoFillStatusBar: React.FC<{ className?: string }> = ({
    className = ''
}) => {
    const { state } = useAutoFill();

    if (!state.settings.enabled) {
        return null;
    }

    const allTabs = ['rfq', 'tddbhd', 'reel-drive', 'str-utility', 'feed', 'shear'];
    const readyTabs = allTabs.filter(tab => state.tabAutoFillStatus[tab]);
    const partialTabs = state.fillableTabs.filter(tab => !state.tabAutoFillStatus[tab]);

    if (readyTabs.length === 0 && partialTabs.length === 0) {
        return null;
    }

    return (
        <div className={`p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <Text className="font-medium text-blue-900">
                    Auto-fill Status
                </Text>
            </div>

            {readyTabs.length > 0 && (
                <div className="mb-2">
                    <Text className="text-sm text-green-700 mb-1">
                        Ready to auto-fill ({readyTabs.length} tabs):
                    </Text>
                    <div className="flex flex-wrap gap-1">
                        {readyTabs.map(tab => (
                            <span
                                key={tab}
                                className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                            >
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                                {tab.replace('-', ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {partialTabs.length > 0 && (
                <div>
                    <Text className="text-sm text-yellow-700 mb-1">
                        Partial data available ({partialTabs.length} tabs):
                    </Text>
                    <div className="flex flex-wrap gap-1">
                        {partialTabs.map(tab => (
                            <span
                                key={tab}
                                className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                            >
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1" />
                                {tab.replace('-', ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

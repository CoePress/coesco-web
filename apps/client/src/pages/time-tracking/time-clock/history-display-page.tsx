import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

export default function HistoryDisplayPage({
    navigationContext,
    NavigateToPage
}: BasePageProps) {
    const handleBack = () => {
        NavigateToPage('History', {
            ...navigationContext,
            fromPage: 'HistoryDisplay'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">History Display</h2>
                    <p className="text-text-muted">Detailed time history view</p>
                </div>
                <Button onClick={handleBack} variant="secondary">
                    Back to History
                </Button>
            </div>

            <Card>
                <p className="text-text">History display functionality coming soon...</p>
                <p className="text-text-muted">Date Range: {navigationContext?.dateRange}</p>
            </Card>
        </div>
    );
}

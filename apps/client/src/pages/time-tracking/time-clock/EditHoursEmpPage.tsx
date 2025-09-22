import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

export default function EditHoursEmpPage({
    navigationContext,
    NavigateToPage
}: BasePageProps) {
    const handleBack = () => {
        NavigateToPage('Hours', {
            ...navigationContext,
            fromPage: 'EditHoursEmp'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Edit Hours (Employee)</h2>
                    <p className="text-text-muted">Modify your time entries</p>
                </div>
                <Button onClick={handleBack} variant="secondary">
                    Back to Hours
                </Button>
            </div>

            <Card>
                <p className="text-text">Employee hour editing functionality coming soon...</p>
            </Card>
        </div>
    );
}

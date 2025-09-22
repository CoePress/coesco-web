import Card from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { BasePageProps } from './types';

export default function ManagerAddHoursPage({
    NavigateToRootPage
}: BasePageProps) {
    const handleBack = () => {
        NavigateToRootPage();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Manager Add Hours</h2>
                    <p className="text-text-muted">Add hours for employees as manager</p>
                </div>
                <Button onClick={handleBack} variant="secondary">
                    Back to Time Clock
                </Button>
            </div>

            <Card>
                <p className="text-text">Manager add hours functionality coming soon...</p>
            </Card>
        </div>
    );
}

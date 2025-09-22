import { useAuth } from '@/contexts/auth.context';
import Card from '../ui/card';

const RoleDebugInfo = () => {
    const { user, employee } = useAuth();

    if (!user || !employee) {
        return null;
    }

    const isManager = employee?.title && employee.title.toLowerCase().includes('manager');
    const isAdmin = user?.role === 'ADMIN';

    return (
        <Card className="m-4 p-4 bg-surface">
            <h3 className="text-lg font-semibold mb-3 text-primary">Role Debug Info</h3>
            <div className="space-y-2 text-sm text-text">
                <div><strong>User ID:</strong> {user.id}</div>
                <div><strong>User Role:</strong> {user.role}</div>
                <div><strong>Employee Name:</strong> {employee.firstName} {employee.lastName}</div>
                <div><strong>Employee Title:</strong> {employee.title}</div>
                <div><strong>Is Manager:</strong> {isManager ? 'Yes' : 'No'}</div>
                <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>

                <div className="mt-4">
                    <strong>Time Tracking Access:</strong>
                    <ul className="ml-4 mt-1">
                        <li>• Time Clock: {(isAdmin || (!isManager)) ? '✅ Visible' : '❌ Hidden'}</li>
                        <li>• Time History: {(isAdmin || (!isManager)) ? '✅ Visible' : '❌ Hidden'}</li>
                        <li>• Manager Hours: {(isAdmin || isManager) ? '✅ Visible' : '❌ Hidden'}</li>
                        <li>• Settings: ✅ Visible (All users)</li>
                    </ul>
                </div>
            </div>
        </Card>
    );
};

export default RoleDebugInfo;

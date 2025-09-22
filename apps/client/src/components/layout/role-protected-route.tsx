import { ReactElement } from 'react';
import { useAuth } from '@/contexts/auth.context';
import NotFound from '@/pages/not-found';

interface RoleProtectedRouteProps {
    children: ReactElement;
    roleFilter?: (user: any, employee: any) => boolean;
}

const RoleProtectedRoute = ({ children, roleFilter }: RoleProtectedRouteProps) => {
    const { user, employee } = useAuth();

    // If no role filter is defined, allow access
    if (!roleFilter) {
        return children;
    }

    // Check if user has access based on role filter
    const hasAccess = roleFilter(user, employee);

    if (!hasAccess) {
        return <NotFound />;
    }

    return children;
};

export default RoleProtectedRoute;

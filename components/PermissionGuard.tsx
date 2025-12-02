
import React from 'react';
import { User } from '../types';
import { Permission, hasPermission } from '../utils/permissions';

interface PermissionGuardProps {
    user: User;
    permission: Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ user, permission, children, fallback = null }) => {
    if (hasPermission(user, permission)) {
        return <>{children}</>;
    }
    return <>{fallback}</>;
};

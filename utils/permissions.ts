
import { Role, User } from '../types';

export enum Permission {
    // User Management
    MANAGE_ALL_USERS = 'MANAGE_ALL_USERS',
    CREATE_INTERN_ACCOUNT = 'CREATE_INTERN_ACCOUNT',
    DELETE_USER = 'DELETE_USER',
    
    // Operational
    APPROVE_LOGS = 'APPROVE_LOGS',
    ASSIGN_TASKS = 'ASSIGN_TASKS',
    EVALUATE_STUDENT = 'EVALUATE_STUDENT',
    MANAGE_RESOURCES = 'MANAGE_RESOURCES',
    POST_ANNOUNCEMENT = 'POST_ANNOUNCEMENT',
    SCHEDULE_MEETING = 'SCHEDULE_MEETING',
    
    // System
    MANAGE_SYSTEM = 'MANAGE_SYSTEM',
    VIEW_ADMIN_DASHBOARD = 'VIEW_ADMIN_DASHBOARD',
    VIEW_SUPERVISOR_DASHBOARD = 'VIEW_SUPERVISOR_DASHBOARD',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.ADMIN]: [
        Permission.MANAGE_ALL_USERS,
        Permission.CREATE_INTERN_ACCOUNT, // Admins can create any user, including interns
        Permission.DELETE_USER,
        Permission.MANAGE_SYSTEM,
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.POST_ANNOUNCEMENT,
        Permission.APPROVE_LOGS, // Admins typically have override power
        Permission.ASSIGN_TASKS,
        Permission.MANAGE_RESOURCES
    ],
    [Role.SUPERVISOR]: [
        Permission.VIEW_SUPERVISOR_DASHBOARD,
        Permission.CREATE_INTERN_ACCOUNT, // Supervisors manage their team
        Permission.APPROVE_LOGS,
        Permission.ASSIGN_TASKS,
        Permission.EVALUATE_STUDENT,
        Permission.MANAGE_RESOURCES,
        Permission.POST_ANNOUNCEMENT,
        Permission.SCHEDULE_MEETING
    ],
    [Role.STUDENT]: [] // Students have implicit permissions via their own portal logic
};

export const hasPermission = (user: User, permission: Permission): boolean => {
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
};

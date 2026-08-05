export type UserRole =
    | "administrator"
    | "hr"
    | "manager"
    | "candidate"

export type User = {
    id: string;
    email: string;
    role: UserRole;
    first_name: string | null;
    last_name: string | null;
    tenant_id: string;
    is_active: boolean;
    created_at: string | null;
}

export const STAFF_ROLES: UserRole[] = ["hr", "manager"]
export const isStaff = (role: UserRole) => STAFF_ROLES.includes(role)
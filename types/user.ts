export type UserRole = "Super Admin" | "Store Manager" | "Operations Operator";

export interface AppUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly password?: string;
  readonly fullName: string;
  readonly displayName?: string;
  readonly avatarUrl?: string;
  readonly role: UserRole;
  readonly createdAt: string;
  readonly status: "active" | "inactive";
  readonly lastLoginAt?: string;
}

export interface UserProfileUpdateInput {
  readonly displayName?: string;
  readonly email?: string;
  readonly avatarUrl?: string;
  readonly currentPassword?: string;
  readonly newPassword?: string;
}

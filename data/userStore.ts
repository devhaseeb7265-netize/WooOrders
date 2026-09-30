import { AppUser, UserRole, UserProfileUpdateInput } from "@/types/user";

export type { AppUser, UserRole, UserProfileUpdateInput };

const STORAGE_USERS_KEY = "wooorders_user_registry";
const STORAGE_CURRENT_USER_KEY = "wooorders_current_active_user";
export const USER_UPDATED_EVENT = "wooorders_user_updated";

export const INITIAL_SEED_ADMIN: AppUser = {
  id: "usr_admin_haseeb_01",
  username: "Haseeb",
  email: "haseebbhatti7269@gmail.com",
  password: "1234",
  fullName: "Haseeb",
  displayName: "Haseeb",
  role: "Super Admin",
  createdAt: "2026-06-01T00:00:00.000Z",
  status: "active",
};

let inMemoryUsers: AppUser[] = [INITIAL_SEED_ADMIN];
let inMemoryCurrentUser: AppUser | null = INITIAL_SEED_ADMIN;

export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;

  const [username, domain] = parts;
  if (username.length <= 4) {
    return `${username.charAt(0)}****@${domain}`;
  }

  const prefix = username.slice(0, 2);
  const suffix = username.slice(-2);
  return `${prefix}******${suffix}@${domain}`;
}

export function getAllUsers(): AppUser[] {
  if (typeof window === "undefined") {
    return inMemoryUsers;
  }

  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(inMemoryUsers));
      return inMemoryUsers;
    }
    const parsed: AppUser[] = JSON.parse(raw);
    if (!parsed.some((u) => u.username.toLowerCase() === "haseeb")) {
      const merged = [INITIAL_SEED_ADMIN, ...parsed];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(merged));
      inMemoryUsers = merged;
      return merged;
    }
    inMemoryUsers = parsed;
    return parsed;
  } catch {
    return inMemoryUsers;
  }
}

export function findUserByUsername(username: string): AppUser | null {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;

  const users = getAllUsers();
  return (
    users.find((u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean) ||
    null
  );
}

export function authenticateUser(
  usernameOrEmail: string,
  pass: string
): { success: boolean; user?: AppUser; error?: string } {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanInput || !cleanPass) {
    return { success: false, error: "Please enter your username and password." };
  }

  const users = getAllUsers();
  const target = users.find(
    (u) =>
      u.username.toLowerCase() === cleanInput ||
      u.email.toLowerCase() === cleanInput
  );

  if (!target) {
    return { success: false, error: "Username or email not found in registry." };
  }

  if (target.password !== cleanPass) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  if (target.status !== "active") {
    return { success: false, error: "User account is suspended or inactive." };
  }

  const sessionUser: AppUser = {
    ...target,
    lastLoginAt: new Date().toISOString(),
  };

  setCurrentUser(sessionUser);
  return { success: true, user: sessionUser };
}

export function addUser(
  newUser: Omit<AppUser, "id" | "createdAt">
): { success: boolean; user?: AppUser; error?: string } {
  const cleanUsername = newUser.username.trim();
  const cleanEmail = newUser.email.trim();

  if (!cleanUsername || !cleanEmail) {
    return { success: false, error: "Username and Email are required." };
  }

  const users = getAllUsers();

  const isDuplicate = users.some(
    (u) =>
      u.username.toLowerCase() === cleanUsername.toLowerCase() ||
      u.email.toLowerCase() === cleanEmail.toLowerCase()
  );

  if (isDuplicate) {
    return {
      success: false,
      error: "Username or Email already registered",
    };
  }

  const createdUser: AppUser = {
    ...newUser,
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    displayName: newUser.displayName || newUser.fullName || cleanUsername,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [createdUser, ...users];
  inMemoryUsers = updatedUsers;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
  }

  return { success: true, user: createdUser };
}

export function updateUserProfile(
  userId: string,
  data: UserProfileUpdateInput
): { success: boolean; user?: AppUser; error?: string } {
  const users = getAllUsers();
  const targetIndex = users.findIndex((u) => u.id === userId);

  if (targetIndex === -1) {
    return { success: false, error: "User not found in registry." };
  }

  const target = users[targetIndex];

  // Email uniqueness validation
  if (data.email && data.email.trim().toLowerCase() !== target.email.toLowerCase()) {
    const cleanEmail = data.email.trim().toLowerCase();
    const isEmailTaken = users.some(
      (u) => u.id !== userId && u.email.toLowerCase() === cleanEmail
    );
    if (isEmailTaken) {
      return { success: false, error: "Email is already in use by another account." };
    }
  }

  // Password verification
  if (data.newPassword) {
    if (!data.currentPassword) {
      return { success: false, error: "Please enter your current password to set a new one." };
    }
    if (target.password && target.password !== data.currentPassword) {
      return { success: false, error: "Current password does not match." };
    }
  }

  const updatedUser: AppUser = {
    ...target,
    displayName: data.displayName !== undefined ? data.displayName.trim() : target.displayName,
    fullName: data.displayName !== undefined ? data.displayName.trim() : target.fullName,
    email: data.email !== undefined ? data.email.trim() : target.email,
    avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : target.avatarUrl,
    password: data.newPassword ? data.newPassword.trim() : target.password,
  };

  const newUsers = [...users];
  newUsers[targetIndex] = updatedUser;
  inMemoryUsers = newUsers;

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(updatedUser);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(newUsers));

    window.dispatchEvent(
      new CustomEvent(USER_UPDATED_EVENT, { detail: updatedUser })
    );
  }

  return { success: true, user: updatedUser };
}

export function deleteUser(id: string): { success: boolean; error?: string } {
  if (id === INITIAL_SEED_ADMIN.id) {
    return { success: false, error: "Default Super Admin cannot be deleted." };
  }

  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== id);
  inMemoryUsers = filtered;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(filtered));
  }

  return { success: true };
}

export function getCurrentUser(): AppUser {
  if (typeof window === "undefined") {
    return inMemoryCurrentUser || INITIAL_SEED_ADMIN;
  }

  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!raw) return inMemoryCurrentUser || INITIAL_SEED_ADMIN;
    const parsed = JSON.parse(raw);
    inMemoryCurrentUser = parsed;
    return parsed;
  } catch {
    return inMemoryCurrentUser || INITIAL_SEED_ADMIN;
  }
}

export function setCurrentUser(user: AppUser | null): void {
  inMemoryCurrentUser = user;

  if (typeof window === "undefined") return;

  if (!user) {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    window.dispatchEvent(
      new CustomEvent(USER_UPDATED_EVENT, { detail: null })
    );
    return;
  }

  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(
    new CustomEvent(USER_UPDATED_EVENT, { detail: user })
  );
}

export function logoutUser(onComplete?: () => void): void {
  setCurrentUser(null);
  if (onComplete) {
    onComplete();
  } else if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function subscribeToUserUpdates(
  callback: (user: AppUser) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = () => {
    callback(getCurrentUser());
  };

  window.addEventListener(USER_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(USER_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

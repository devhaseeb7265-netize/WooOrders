import { createClient } from "@supabase/supabase-js";
import { AppUser, UserRole, UserProfileUpdateInput } from "@/types/user";

export type { AppUser, UserRole, UserProfileUpdateInput };

const STORAGE_USERS_KEY = "wooorders_user_registry";
const STORAGE_CURRENT_USER_KEY = "wooorders_current_active_user";
export const USER_UPDATED_EVENT = "wooorders_user_updated";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const INITIAL_SEED_ADMIN: AppUser = {
  id: "c8212109-fa61-4550-a1cd-3d34036f1221",
  username: "Haseeb",
  email: "haseebbhatti7269@gmail.com",
  password: "1234",
  fullName: "Haseeb Bhatti",
  displayName: "Haseeb Bhatti",
  role: "Super Admin",
  createdAt: "2026-06-01T00:00:00.000Z",
  status: "active",
};

let inMemoryCurrentUser: AppUser | null = null;

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

export async function authenticateUser(
  usernameOrEmail: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const cleanInput = usernameOrEmail.trim();
  const cleanPass = passwordInput.trim();

  if (!cleanInput || !cleanPass) {
    return { success: false, error: "Please enter your username and password." };
  }

  try {
    const supabase = getSupabaseClient();

    // ── Self-Healing Admin Provisioning ──────────────────────────────────────
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (
      !countError &&
      (count === 0 || count === null) &&
      cleanInput.toLowerCase() === "haseeb" &&
      cleanPass === "1234"
    ) {
      // 1. Try direct profile insertion
      const { data: directAdmin, error: directError } = await supabase
        .from("profiles")
        .insert({
          username: "Haseeb",
          email: "haseebbhatti7269@gmail.com",
          password: "1234",
          display_name: "Haseeb Bhatti",
          role: "Super Admin",
        })
        .select()
        .single();

      if (!directError && directAdmin) {
        const adminUser: AppUser = {
          id: directAdmin.id,
          username: directAdmin.username,
          email: directAdmin.email,
          password: directAdmin.password,
          fullName: directAdmin.display_name || "Haseeb Bhatti",
          displayName: directAdmin.display_name || "Haseeb Bhatti",
          role: (directAdmin.role as UserRole) || "Super Admin",
          createdAt: directAdmin.created_at || new Date().toISOString(),
          status: "active",
        };
        setCurrentUser(adminUser);
        return { success: true, user: adminUser };
      }

      // 2. If foreign-key constraint triggers, provision through auth admin
      try {
        const authRes = await supabase.auth.admin.createUser({
          email: "haseebbhatti7269@gmail.com",
          password: "1234password!",
          email_confirm: true,
        });

        if (authRes.data.user) {
          const { data: updatedAdmin } = await supabase
            .from("profiles")
            .update({
              username: "Haseeb",
              password: "1234",
              display_name: "Haseeb Bhatti",
              role: "Super Admin",
            })
            .eq("id", authRes.data.user.id)
            .select()
            .single();

          if (updatedAdmin) {
            const adminUser: AppUser = {
              id: updatedAdmin.id,
              username: updatedAdmin.username,
              email: updatedAdmin.email,
              password: updatedAdmin.password,
              fullName: updatedAdmin.display_name || "Haseeb Bhatti",
              displayName: updatedAdmin.display_name || "Haseeb Bhatti",
              role: (updatedAdmin.role as UserRole) || "Super Admin",
              createdAt: updatedAdmin.created_at || new Date().toISOString(),
              status: "active",
            };
            setCurrentUser(adminUser);
            return { success: true, user: adminUser };
          }
        }
      } catch (authErr) {
        console.warn("[authenticateUser] Auth admin fallback error:", authErr);
      }
    }

    // ── Dynamic Authentication via Supabase profiles Table ───────────────────
    const { data: matchedUsers, error: queryError } = await supabase
      .from("profiles")
      .select("*")
      .or(`username.ilike.${cleanInput},email.ilike.${cleanInput}`)
      .limit(1);

    if (queryError) {
      console.error("[authenticateUser] profiles query error:", queryError);
      return fallbackLocalAuthenticate(cleanInput, cleanPass);
    }

    const target = matchedUsers?.[0];

    if (!target) {
      return fallbackLocalAuthenticate(cleanInput, cleanPass);
    }

    if (target.password && target.password !== cleanPass) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    const sessionUser: AppUser = {
      id: target.id,
      username: target.username || "Haseeb",
      email: target.email || "haseebbhatti7269@gmail.com",
      password: target.password || cleanPass,
      fullName: target.display_name || target.full_name || target.username || "Haseeb",
      displayName: target.display_name || target.username || "Haseeb",
      role: (target.role as UserRole) || "Super Admin",
      avatarUrl: target.avatar_url || undefined,
      createdAt: target.created_at || new Date().toISOString(),
      status: (target.status === "inactive" ? "inactive" : "active"),
      lastLoginAt: new Date().toISOString(),
    };

    setCurrentUser(sessionUser);
    return { success: true, user: sessionUser };
  } catch (err: unknown) {
    console.error("[authenticateUser] Exception:", err);
    return fallbackLocalAuthenticate(cleanInput, cleanPass);
  }
}

function fallbackLocalAuthenticate(
  input: string,
  pass: string
): { success: boolean; user?: AppUser; error?: string } {
  if (
    (input.toLowerCase() === "haseeb" || input.toLowerCase() === "haseebbhatti7269@gmail.com") &&
    pass === "1234"
  ) {
    setCurrentUser(INITIAL_SEED_ADMIN);
    return { success: true, user: INITIAL_SEED_ADMIN };
  }
  return { success: false, error: "Invalid username or password." };
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

export function findUserByUsername(username: string): AppUser | null {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;

  const current = getCurrentUser();
  if (current.username.toLowerCase() === clean || current.email.toLowerCase() === clean) {
    return current;
  }
  return null;
}

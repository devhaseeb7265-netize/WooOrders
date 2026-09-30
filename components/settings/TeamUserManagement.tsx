"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  UserCheck,
  Shield,
  Trash2,
  X,
  AlertCircle,
  Mail,
  User,
  Key,
} from "lucide-react";
import { FlipButton } from "@/components/motion/FlipButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  AppUser,
  getAllUsers,
  addUser,
  deleteUser,
  INITIAL_SEED_ADMIN,
} from "@/data/userStore";

export function TeamUserManagement() {
  const [users, setUsers] = useState<AppUser[]>(() => getAllUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New User Form State - Strictly NO placeholders
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppUser["role"]>("Store Manager");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenModal = () => {
    setUsername("");
    setEmail("");
    setFullName("");
    setPassword("");
    setRole("Store Manager");
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = addUser({
      username,
      email,
      fullName: fullName.trim() || username.trim(),
      password,
      role,
      status: "active",
    });

    if (!result.success) {
      setErrorMessage(result.error || "Failed to create user.");
      return;
    }

    setUsers(getAllUsers());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const res = deleteUser(id);
    if (res.success) {
      setUsers(getAllUsers());
    }
  };

  const getRoleBadge = (r: AppUser["role"]) => {
    switch (r) {
      case "Super Admin":
        return "bg-emerald-50 text-[#00875A] border-emerald-200/80";
      case "Store Manager":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-7 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">
              Team Members
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#00875A]/10 text-[#00875A] text-xs font-bold font-mono">
              {users.length} Users
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your team members and account roles.
          </p>
        </div>

        <FlipButton
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4 mr-0.5" />}
          label="Add Team Member"
          onClick={handleOpenModal}
          className="rounded-full !px-4 !py-2 text-xs font-semibold shadow-sm"
        />
      </div>

      {/* Users Table */}
      <div className="border border-zinc-200/80 rounded-2xl overflow-hidden divide-y divide-zinc-100">
        <div className="bg-zinc-50/50 px-5 py-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider grid grid-cols-12 gap-4 select-none">
          <div className="col-span-5">User & Email</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-3">Created</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {users.map((u) => {
          const isSeedAdmin = u.id === INITIAL_SEED_ADMIN.id;

          return (
            <div
              key={u.id}
              className="px-5 py-3.5 grid grid-cols-12 gap-4 items-center bg-white hover:bg-zinc-50/50 transition-colors text-xs"
            >
              {/* User & Email */}
              <div className="col-span-5 flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-100 text-zinc-700 font-bold font-mono text-xs shrink-0">
                  {u.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900">{u.username}</span>
                    {isSeedAdmin && (
                      <span className="px-2 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                        Primary Seed
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono block">
                    {u.email}
                  </span>
                </div>
              </div>

              {/* Role */}
              <div className="col-span-3">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadge(
                    u.role
                  )}`}
                >
                  <Shield className="h-3 w-3" />
                  {u.role}
                </span>
              </div>

              {/* Created */}
              <div className="col-span-3 text-zinc-400 font-mono text-[11px]">
                {new Date(u.createdAt).toLocaleDateString()}
              </div>

              {/* Action */}
              <div className="col-span-1 text-right">
                {!isSeedAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    aria-label={`Remove user ${u.username}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Team Member Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-[32px] p-7 sm:p-8 max-w-md w-full border border-black/[0.04] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Add Team Member</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 pt-5">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Username Input - Strictly NO Placeholder */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="member-username"
                  className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5"
                >
                  <User className="h-3 w-3 text-zinc-400" />
                  Username
                </label>
                <input
                  id="member-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                />
              </div>

              {/* Email Input - Strictly NO Placeholder */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="member-email"
                  className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5"
                >
                  <Mail className="h-3 w-3 text-zinc-400" />
                  Email Address
                </label>
                <input
                  id="member-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                />
              </div>

              {/* Password Input - Strictly NO Placeholder */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="member-password"
                  className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5"
                >
                  <Key className="h-3 w-3 text-zinc-400" />
                  Password
                </label>
                <input
                  id="member-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-[#00875A] focus:bg-white focus:ring-2 focus:ring-[#00875A]/10 transition-all"
                />
              </div>

              {/* Role Select */}
              <div className="flex flex-col gap-1">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5"
                >
                  <Shield className="h-3 w-3 text-zinc-400" />
                  System Role
                </label>
                <CustomSelect
                  value={role}
                  onChange={(val) => setRole(val as AppUser["role"])}
                  options={[
                    { value: "Super Admin", label: "Super Admin", description: "Full system administration & control" },
                    { value: "Store Manager", label: "Store Manager", description: "Manage orders, stores, and analytics" },
                    { value: "Operations Staff", label: "Operations Staff", description: "Process orders and view details" },
                  ]}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  Cancel
                </button>
                <FlipButton
                  type="submit"
                  variant="primary"
                  size="md"
                  label="Create Member"
                  className="rounded-xl shadow-md px-5"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

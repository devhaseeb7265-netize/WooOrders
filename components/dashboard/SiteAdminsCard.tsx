"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

interface AdminUser {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly bgClass: string;
  readonly textClass: string;
}

const DEFAULT_USERS: readonly AdminUser[] = [
  { id: "u1", name: "Alex Morgan", initials: "AM", bgClass: "bg-amber-100", textClass: "text-amber-800" },
  { id: "u2", name: "David Miller", initials: "DM", bgClass: "bg-orange-100", textClass: "text-orange-800" },
  { id: "u3", name: "Sarah Connor", initials: "SC", bgClass: "bg-rose-100", textClass: "text-rose-800" },
  { id: "u4", name: "James Wilson", initials: "JW", bgClass: "bg-blue-100", textClass: "text-blue-800" },
];

interface SiteAdminsCardProps {
  title?: string;
  subtitle?: string;
  users?: readonly AdminUser[];
  extraCount?: number;
  onViewAll?: () => void;
}

export function SiteAdminsCard({
  title = "Mandatory Payments",
  subtitle = "Recent payments",
  users = DEFAULT_USERS,
  extraCount = 2,
  onViewAll,
}: SiteAdminsCardProps) {
  return (
    <div className="bg-white rounded-[28px] p-6 border border-black/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_38px_rgba(0,0,0,0.05)] w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          aria-label="View All Team Members"
          className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar Cluster */}
      <div className="flex items-center gap-2 pt-1">
        {users.map((user) => (
          <div
            key={user.id}
            title={user.name}
            className={`flex items-center justify-center h-10 w-10 rounded-full border-2 border-white shadow-xs text-xs font-bold ${user.bgClass} ${user.textClass} transition-transform duration-150 hover:scale-105 cursor-pointer`}
          >
            {user.initials}
          </div>
        ))}

        {extraCount > 0 && (
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#00875A] text-white text-xs font-bold border-2 border-white shadow-xs">
            +{extraCount}
          </div>
        )}
      </div>
    </div>
  );
}

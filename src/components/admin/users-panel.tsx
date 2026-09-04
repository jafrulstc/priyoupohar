"use client";

/**
 * Users panel — role & activation management, self-protection included
 * (an admin can't demote, deactivate or delete their own account).
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { ApiError, pyFetch, type AdminUser } from "@/lib/py-api";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AdminTable,
  EmptyState,
  ErrorState,
  PanelHeader,
  RowActions,
  RowsSkeleton,
  Td,
  Th,
  formatDate,
} from "./admin-ui";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export default function UsersPanel() {
  const token = useAdminStore((s) => s.token);
  const selfUser = useAdminStore((s) => s.adminUser);
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => pyFetch<AdminUser[]>("/api/admin/users", { token }),
    retry: 1,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { role?: string; is_active?: boolean } }) =>
      pyFetch<AdminUser>(`/api/admin/users/${id}`, { method: "PATCH", body, token }),
    onSuccess: (user) => {
      queryClient.setQueryData<AdminUser[]>(["admin", "users"], (old) =>
        old ? old.map((u) => (u.id === user.id ? user : u)) : old
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`Updated ${user.name}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      pyFetch<{ ok: boolean }>(`/api/admin/users/${id}`, { method: "DELETE", token }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`User #${id} removed`);
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not delete user");
      setDeleting(null);
    },
  });

  const items = usersQuery.data ?? [];

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Users"
        description="Customers and fellow admins — change roles or deactivate accounts."
      />

      {usersQuery.isError ? (
        <ErrorState
          message={usersQuery.error instanceof Error ? usersQuery.error.message : "Failed to load users"}
          onRetry={() => usersQuery.refetch()}
        />
      ) : usersQuery.isLoading ? (
        <AdminTable>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Active</Th>
              <Th>Joined</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <RowsSkeleton rows={5} cols={5} />
        </AdminTable>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Registered shoppers will show up here."
        />
      ) : (
        <AdminTable maxHeight="55dvh">
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Active</Th>
              <Th>Joined</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const isSelf = u.id === selfUser?.id;
              return (
                <tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-extrabold text-white"
                        aria-hidden
                      >
                        {initials(u.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="max-w-[200px] truncate font-bold">{u.name}</span>
                          {isSelf && (
                            <Badge className="rounded-full bg-rose-100 font-extrabold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {isSelf ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand dark:text-rose-400">
                        <ShieldCheck className="h-4 w-4" aria-hidden /> admin
                      </span>
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={(v) =>
                          patchMutation.mutate({ id: u.id, body: { role: v } })
                        }
                        disabled={patchMutation.isPending}
                      >
                        <SelectTrigger
                          className="h-9 w-[120px] rounded-xl text-xs"
                          aria-label={`Change role for ${u.name}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">admin</SelectItem>
                          <SelectItem value="customer">customer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Td>
                  <Td>
                    <Switch
                      checked={u.is_active}
                      disabled={isSelf || patchMutation.isPending}
                      onCheckedChange={(v) => patchMutation.mutate({ id: u.id, body: { is_active: v } })}
                      aria-label={
                        isSelf ? "You can't deactivate your own account" : `Toggle active for ${u.name}`
                      }
                    />
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(u.created_at)}
                  </Td>
                  <Td>
                    <RowActions
                      label={`Actions for ${u.name}`}
                      items={[
                        {
                          label: isSelf ? "You can't remove yourself" : "Remove user",
                          icon: Trash2,
                          danger: true,
                          disabled: isSelf,
                          onSelect: () => setDeleting(u),
                        },
                      ]}
                    />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Their account and access will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-600 font-extrabold text-white hover:bg-rose-700"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting.id);
              }}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

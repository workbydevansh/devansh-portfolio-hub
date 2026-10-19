"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Notice } from "@/components/admin/FormFields";
import { GlassCard } from "@/components/shared/GlassCard";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSupabaseQuery } from "@/lib/supabase/useSupabaseQuery";
import { getErrorMessage } from "@/lib/utils";

type Row = { id: string; title: string };

export type AdminTableColumn<T> = {
  header: string;
  cell: (row: T) => ReactNode;
};

type AdminTableProps<T extends Row> = {
  table: "projects" | "certificates" | "achievements";
  noun: string;
  orderBy: { column: string; ascending: boolean }[];
  columns: AdminTableColumn<T>[];
  deleteWarning?: string;
  minWidthClassName: string;
  onMutate?: () => Promise<void>;
};

const capitalize = (value: string) => value[0].toUpperCase() + value.slice(1);

// The shared list for every admin content type: load, edit link, delete.
export function AdminTable<T extends Row>({
  table,
  noun,
  orderBy,
  columns,
  deleteWarning = "This cannot be undone.",
  minWidthClassName,
  onMutate,
}: AdminTableProps<T>) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data: rows, error, isLoading, reload } = useSupabaseQuery(
    () =>
      orderBy.reduce(
        (query, { column, ascending }) => query.order(column, { ascending }),
        getSupabaseBrowserClient().from(table).select("*"),
      ),
    [] as T[],
    `Unable to load ${noun}s.`,
  );

  async function handleDelete(row: T) {
    if (!window.confirm(`Delete "${row.title}"? ${deleteWarning}`)) {
      return;
    }

    setMessage("");
    setActionError("");
    setDeletingId(row.id);

    try {
      const { error: deleteError } = await getSupabaseBrowserClient()
        .from(table)
        .delete()
        .eq("id", row.id);

      if (deleteError) {
        setActionError(deleteError.message);
        return;
      }

      setMessage(`${capitalize(noun)} deleted successfully.`);
      reload();
      await onMutate?.();
      router.refresh();
    } catch (caughtError) {
      setActionError(getErrorMessage(caughtError, `Unable to delete ${noun}.`));
    } finally {
      setDeletingId(null);
    }
  }

  const emptyState = (text: string) => (
    <div className="p-5">
      <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
        {text}
      </p>
    </div>
  );

  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-xl font-semibold text-white">
          All {capitalize(noun)}s
        </h2>
      </div>

      <Notice tone="success" message={message} className="mx-5 mt-5" />
      <Notice tone="error" message={actionError || error} className="mx-5 mt-5" />

      {isLoading ? (
        emptyState(`Loading ${noun}s...`)
      ) : rows.length ? (
        <div className="overflow-x-auto">
          <table
            className={`w-full ${minWidthClassName} border-collapse text-left`}
          >
            <thead>
              <tr className="border-b border-white/10 text-sm text-zinc-400">
                {columns.map((column) => (
                  <th key={column.header} className="px-5 py-4 font-medium">
                    {column.header}
                  </th>
                ))}
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/10">
                  {columns.map((column, index) => (
                    <td
                      key={column.header}
                      className={
                        index === 0
                          ? "px-5 py-4 text-sm font-semibold text-white"
                          : "px-5 py-4 text-sm text-zinc-300"
                      }
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/${table}/${row.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-100 transition-colors duration-200 hover:bg-white/10"
                      >
                        <Pencil size={14} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === row.id}
                        onClick={() => void handleDelete(row)}
                        className="inline-flex items-center gap-2 rounded-md border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100 transition-colors duration-200 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Trash2 size={14} />
                        {deletingId === row.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        emptyState(`No ${noun}s added yet.`)
      )}
    </GlassCard>
  );
}

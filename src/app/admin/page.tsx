"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AdminShell } from "@/components/admin/admin-overlay";

export default function AdminPage() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <>
      <Toaster position="bottom-right" closeButton />
      <QueryClientProvider client={queryClient}>
        <AdminShell />
      </QueryClientProvider>
    </>
  );
}

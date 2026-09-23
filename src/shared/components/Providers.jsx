// src/shared/components/Providers.jsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import AdminAuthGuard from "../../core/guards/AdminAuthGuard";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthGuard>{children}</AdminAuthGuard>
      <Toaster position="top-right" richColors theme="dark" />
    </QueryClientProvider>
  );
}

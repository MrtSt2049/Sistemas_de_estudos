"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";

interface Options<TData> {
  invalidate: QueryKey[];
  success?: string;
  /** Falso quando o formulário já exibe o erro. */
  toastError?: boolean;
  onSuccess?: (data: TData) => void;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Não foi possível conectar ao servidor.";
}

export function useApiMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  { invalidate, success, toastError = true, onSuccess }: Options<TData>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data) => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      if (success) toast.success(success);
      onSuccess?.(data);
    },
    onError: (error) => {
      if (toastError) toast.error(errorMessage(error));
    },
  });
}

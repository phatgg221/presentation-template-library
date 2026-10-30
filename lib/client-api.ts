/** Browser-side fetch helper: turns API error payloads into Error messages for toasts/UI. */
export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message)
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(input, {
      ...init,
      headers: { ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    })
  } catch {
    throw new ClientApiError(0, "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.")
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ClientApiError(res.status, data?.error?.message ?? `Lỗi ${res.status}`, data?.error?.code, data?.error?.details)
  }
  return data as T
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

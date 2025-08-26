// lib/https.ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type BodyInitLike = BodyInit | Record<string, unknown> | undefined | null;

export interface ApiOptions extends Omit<RequestInit, 'method' | 'body' | 'headers'> {
  headers?: Record<string, string>;
  baseUrl?: string;
  raw?: boolean;
}

export class ApiError extends Error {
  status: number;
  payload?: unknown;
  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

// 🔒 fallback seguro: proxy do Next em /api
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  '/api';

function getClientToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // 🔑 padroniza em 'authToken', mas mantém compatibilidade
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  } catch {
    return null;
  }
}

function joinUrl(base: string, path: string) {
  if (!base) return path;
  // mantém http/https absolutos se alguém chamar com URL completa (mas preferimos SEMPRE usar paths)
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function apiFetch<T>(
  path: string,
  method: HttpMethod,
  body?: BodyInitLike,
  opts?: ApiOptions
): Promise<T> {
  const baseUrl = (opts?.baseUrl ?? DEFAULT_BASE_URL) || '';

  if (!baseUrl && typeof window !== 'undefined') {
    console.warn('⚠️ [HTTPS] BASE URL vazia. Defina NEXT_PUBLIC_API_URL ou use /api via rewrites.');
  }

  const mergedHeaders: Record<string, string> = { Accept: 'application/json' };

  if (opts?.headers) {
    for (const [k, v] of Object.entries(opts.headers)) mergedHeaders[k] = v;
  }

  if (!mergedHeaders['Authorization'] && typeof window !== 'undefined') {
    const token = getClientToken();
    if (token) mergedHeaders['Authorization'] = `Bearer ${token}`;
  }

  let finalBody: BodyInit | undefined;
  if (body !== null && body !== undefined) {
    if (typeof body === 'string') {
      finalBody = body;
      if (!mergedHeaders['Content-Type']) mergedHeaders['Content-Type'] = 'application/json';
    } else if (body instanceof FormData) {
      finalBody = body; // boundary automático
    } else if (
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof URLSearchParams
    ) {
      finalBody = body;
    } else if (typeof body === 'object') {
      try {
        finalBody = JSON.stringify(body);
        mergedHeaders['Content-Type'] ||= 'application/json';
      } catch (error) {
        console.error('❌ [HTTPS] Erro ao serializar body:', error);
        throw new Error('Erro ao serializar dados para JSON');
      }
    }
  }

  const { headers: _ignored, ...restOpts } = opts ?? {};
  const fetchOptions: RequestInit = {
    method,
    headers: mergedHeaders,
    cache: 'no-store',
    ...restOpts,
    ...(finalBody !== undefined ? { body: finalBody } : {}),
  };

  try {
    const url = joinUrl(baseUrl, path);
    const res = await fetch(url, fetchOptions);

    if (opts?.raw) return res as unknown as T;

    const text = await res.text();
    let payload: any = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }

    if (!res.ok) {
      const msg = payload?.message || payload?.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new ApiError(String(msg), res.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ [HTTPS] API Error:', {
        status: error.status, message: error.message, payload: error.payload,
      });
      throw error;
    }
    const errMsg = (typeof error === 'object' && error && 'message' in error)
      ? (error as { message: string }).message
      : String(error);
    console.error('❌ [HTTPS] Network Error:', errMsg);
    throw new Error(`Erro de rede: ${errMsg}`);
  }
}

export const api = {
  get:   <T>(path: string, opts?: ApiOptions) => apiFetch<T>(path, 'GET', undefined, opts),
  post:  <T>(path: string, body?: BodyInitLike, opts?: ApiOptions) => apiFetch<T>(path, 'POST', body, opts),
  put:   <T>(path: string, body?: BodyInitLike, opts?: ApiOptions) => apiFetch<T>(path, 'PUT', body, opts),
  patch: <T>(path: string, body?: BodyInitLike, opts?: ApiOptions) => apiFetch<T>(path, 'PATCH', body, opts),
  delete:<T>(path: string, opts?: ApiOptions) => apiFetch<T>(path, 'DELETE', undefined, opts),
};

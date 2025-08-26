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

const IS_BROWSER = typeof window !== 'undefined';

// Em execução no servidor (SSR/build) você pode usar variável de ambiente;
// no browser, SEMPRE força '/api' para passar no rewrite e evitar Mixed Content.
const ENV_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  undefined;

const DEFAULT_BASE_URL = IS_BROWSER ? '/api' : (ENV_BASE ?? '/api');

function getClientToken(): string | null {
  if (!IS_BROWSER) return null;
  try {
    // Mantém compat com 'authToken' e 'token'
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  } catch {
    return null;
  }
}

function joinURL(base: string, path: string): string {
  if (!base) return path;
  // Se path já for absoluto (http/https), respeita
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

async function apiFetch<T>(
  path: string,
  method: HttpMethod,
  body?: BodyInitLike,
  opts?: ApiOptions
): Promise<T> {
  const baseUrl = (opts?.baseUrl ?? DEFAULT_BASE_URL) || '';

  if (IS_BROWSER && baseUrl !== '/api') {
    // Grande parte dos problemas de Mixed Content vem de baseUrl http no browser.
    // Este log ajuda a detectar usos indevidos de baseUrl custom no cliente.
    console.warn('⚠️ [HTTPS] baseUrl custom no browser:', baseUrl, '— preferir "/api".');
  }

  // 1) Accept padrão
  const mergedHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  // 2) Mescla headers do caller (sem sobrescrever os que definirmos depois)
  if (opts?.headers) {
    for (const [k, v] of Object.entries(opts.headers)) {
      mergedHeaders[k] = v;
    }
  }

  // 3) Authorization no client via localStorage (se caller não passou)
  if (!mergedHeaders['Authorization'] && IS_BROWSER) {
    const token = getClientToken();
    if (token) mergedHeaders['Authorization'] = `Bearer ${token}`;
  }

  // 4) Constrói body e Content-Type quando necessário
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
        if (!mergedHeaders['Content-Type']) mergedHeaders['Content-Type'] = 'application/json';
      } catch (error) {
        console.error('❌ [HTTPS] Erro ao serializar body:', error);
        throw new Error('Erro ao serializar dados para JSON');
      }
    }
  }

  // 5) Monta fetchOptions sem deixar opts.headers sobrescrever o que preparamos
  const { headers: _ignoredHeaders, ...restOpts } = opts ?? {};
  const fetchOptions: RequestInit = {
    method,
    headers: mergedHeaders,
    cache: 'no-store',
    ...restOpts,
  };
  if (finalBody !== undefined) fetchOptions.body = finalBody;

  const url = joinURL(baseUrl, path);

  try {
    const res = await fetch(url, fetchOptions as RequestInit);

    if (opts?.raw) return res as unknown as T;

    const text = await res.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    if (!res.ok) {
      const msg = payload?.message || payload?.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new ApiError(String(msg), res.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ [HTTPS] API Error:', {
        status: error.status,
        message: error.message,
        payload: error.payload,
        url,
      });
      throw error;
    }
    const errMsg =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);
    console.error('❌ [HTTPS] Network Error:', errMsg, 'URL:', url);
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

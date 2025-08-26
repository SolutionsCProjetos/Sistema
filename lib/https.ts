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

const DEFAULT_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL;

function getClientToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  method: HttpMethod,
  body?: BodyInitLike,
  opts?: ApiOptions
): Promise<T> {
  const baseUrl = (opts?.baseUrl ?? DEFAULT_BASE_URL) || '';
  if (!baseUrl) {
    console.warn('⚠️ [HTTPS] BASE URL vazia. Defina API_URL ou NEXT_PUBLIC_API_URL.');
  }

  // 1) Comece com Accept padrão
  const mergedHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  // 2) Mescle headers vindos do caller (NUNCA substituir os que definirmos depois)
  if (opts?.headers) {
    for (const [k, v] of Object.entries(opts.headers)) {
      mergedHeaders[k] = v;
    }
  }

  // 3) Se não veio Authorization e estivermos no client, tente localStorage
  if (!mergedHeaders['Authorization'] && typeof window !== 'undefined') {
    const token = getClientToken();
    if (token) {
      mergedHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // 4) Construa o body e garanta Content-Type quando necessário
  let finalBody: BodyInit | undefined;
  if (body !== null && body !== undefined) {
    if (typeof body === 'string') {
      finalBody = body;
      // Se caller não passou Content-Type, assumimos JSON string
      if (!mergedHeaders['Content-Type']) {
        mergedHeaders['Content-Type'] = 'application/json';
      }
    } else if (body instanceof FormData) {
      finalBody = body; // browser define o boundary
      // NÃO definir Content-Type aqui
    } else if (
      body instanceof Blob ||
      body instanceof ArrayBuffer ||
      body instanceof URLSearchParams
    ) {
      finalBody = body;
      // Content-Type opcional conforme o tipo
    } else if (typeof body === 'object') {
      try {
        finalBody = JSON.stringify(body);
        mergedHeaders['Content-Type'] = mergedHeaders['Content-Type'] || 'application/json';
      } catch (error) {
        console.error('❌ [HTTPS] Erro ao serializar body:', error);
        throw new Error('Erro ao serializar dados para JSON');
      }
    }
  }

  // 5) Monte fetchOptions sem deixar opts.headers sobrescrever o que preparamos
  const { headers: _ignored, ...restOpts } = opts ?? {};
  const fetchOptions: RequestInit = {
    method,
    headers: mergedHeaders,
    cache: 'no-store',
    ...restOpts,
  };
  if (finalBody !== undefined) {
    fetchOptions.body = finalBody;
  }



  try {
    const res = await fetch(`${baseUrl}${path}`, fetchOptions as RequestInit);

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
      });
      throw error;
    }
    const errMsg =
      typeof error === 'object' && error !== null && 'message' in error
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

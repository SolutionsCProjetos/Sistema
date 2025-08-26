// core/auth.ts
export type LoginCoreInput = { email: string; senha: string };
export type LoginCoreResult =
  | { ok: true; token: string }
  | { ok: false; message: string };

// Fonte do backend: use variável de ambiente (com fallback)
const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL
  //  "http://localhost:3008";

export async function loginCore(
  { email, senha }: LoginCoreInput
): Promise<LoginCoreResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // server actions rodam no servidor → seguro enviar direto
      body: JSON.stringify({ email, senha }),
      // não cachear login
      cache: 'no-store',
    });

    if (!res.ok) {
      // tenta extrair mensagem do back
      let message = 'Falha ao autenticar.';
      try {
        const data = await res.json();
        if (data?.message) message = data.message;
      } catch {
        /* ignore */
      }
      return { ok: false, message };
    }

    const data = (await res.json()) as { token?: string; message?: string };
    if (!data?.token) {
      return { ok: false, message: 'Token não recebido.' };
    }

    return { ok: true, token: data.token };
  } catch (err) {
    return {
      ok: false,
      message: 'Erro de rede ou servidor indisponível.',
    };
  }
}

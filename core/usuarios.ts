// core/usuario.ts
import { api, ApiOptions } from '../lib/https';

export type Setor = { id: number; setor: string };

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  empresa?: string | null;
  rule: '0' | '1' | '2'; // 0: Padrão, 1: Admin, 2: Recrutador (se usar)
  setor?: Setor | null;
};

export type UpsertUsuarioInput = {
  id?: number;
  nome: string;
  email: string;
  senha?: string;         // somente no create ou quando trocar
  empresa?: string | null;
  rule: '0' | '1' | '2';
  setorId?: number | null;
};

type Opts = Pick<ApiOptions, 'headers' | 'baseUrl'>;

export async function listUsuarios(opts?: Opts): Promise<Usuario[]> {
  return await api.get<Usuario[]>('/usuario', opts);
}

export async function getUsuario(id: number, opts?: Opts): Promise<Usuario> {
  return await api.get<Usuario>(`/usuario/${id}`, opts);
}

export async function deleteUsuario(id: number, opts?: Opts): Promise<void> {
  await api.delete(`/usuario/${id}`, opts);
}

export async function upsertUsuario(input: UpsertUsuarioInput, opts?: Opts): Promise<Usuario> {
  const headers = { ...opts?.headers, 'Content-Type': 'application/json' };
  const body = {
    nome: input.nome,
    email: input.email,
    senha: input.senha ?? undefined,
    empresa: input.empresa ?? null,
    rule: input.rule,
    setorId: input.setorId ?? null,
  };

  if (input.id) {
    return await api.put<Usuario>(`/usuario/${input.id}`, body, { ...opts, headers });
  }
  return await api.post<Usuario>('/usuario', body, { ...opts, headers });
}

// fluxo de recuperação (token)
export async function solicitarToken(email: string, opts?: Opts): Promise<{ token: string }> {
  const headers = { ...opts?.headers, 'Content-Type': 'application/json' };
  return await api.post<{ token: string }>('/token', { email }, { ...opts, headers });
}

export async function redefinirSenhaComToken(token: string, novaSenha: string, opts?: Opts): Promise<void> {
  const headers = { ...opts?.headers, 'Content-Type': 'application/json' };
  await api.put('/token', { token, novaSenha }, { ...opts, headers });
}

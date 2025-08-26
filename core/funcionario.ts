// core/employees.ts
import { api, ApiOptions } from '../lib/https';

export type Funcionario = {
  id: number;
  nome: string;
  setor: 'vendedor' | 'cobrador';
};

export type UpsertFuncionarioInput = {
  id?: number;
  nome: string;
  setor: 'vendedor' | 'cobrador';
};

type Opts = Pick<ApiOptions, 'headers' | 'baseUrl'>;

export async function listFuncionarios(opts?: Opts): Promise<Funcionario[]> {
  return await api.get<Funcionario[]>('/funcionario', opts);
}

export async function getFuncionario(id: number, opts?: Opts): Promise<Funcionario> {
  return await api.get<Funcionario>(`/funcionario/${id}`, opts);
}

export async function upsertFuncionario(input: UpsertFuncionarioInput, opts?: Opts): Promise<Funcionario> {
  const headers = { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) };
  if (input.id) {
    return await api.put<Funcionario>(`/funcionario/${input.id}`, { nome: input.nome.trim(), setor: input.setor }, { ...opts, headers });
  }
  return await api.post<Funcionario>('/funcionario', { nome: input.nome.trim(), setor: input.setor }, { ...opts, headers });
}

export async function deleteFuncionario(id: number, opts?: Opts): Promise<void> {
  await api.delete(`/funcionario/${id}`, opts);
}

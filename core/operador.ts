// core/users.ts
import { api, ApiOptions } from '../lib/https';

type Opts = Pick<ApiOptions, 'headers' | 'baseUrl'>;

export type Usuario = {
  id: number;
  nome: string;
  rule?: number;
};

export async function listUsuarios(opts?: Opts): Promise<Usuario[]> {
  const data = await api.get<unknown[]>('/usuario', opts);
  return (data ?? []).map((u) => {
    const r = (u ?? {}) as Record<string, unknown>;
    return {
      id: Number(r.id),
      nome: String(r.nome ?? ''),
      rule: typeof r.rule === 'number' ? r.rule : undefined,
    };
  });
}

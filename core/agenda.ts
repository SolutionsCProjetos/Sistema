// core/operacoes.ts
import { api, ApiOptions } from '../lib/https';

type Opts = Pick<ApiOptions, 'headers' | 'baseUrl'>;

export type Status = 'Aberto' | 'Andamento' | 'Atrasado' | 'Finalizado' | 'Cancelado';
export type Motivo = 'Sem exito' | 'Sem Perfil' | 'Pausado' | null;

export type Usuario = { id: number; nome: string };

export type Operacao = {
  id: number;
  atividade: string;
  status: Status;
  startTime: string | null;
  endTime: string | null;
  startDate: string;        // ISO yyyy-MM-dd
  endDate: string | null;   // ISO yyyy-MM-dd | null
  closingDate: string | null; // ISO yyyy-MM-dd | null
  valorOperacao: number;
  obs: string | null;
  motivo: Motivo;
  usuario: Usuario;
};

export type OperacaoInput = {
  atividade: string;
  startTime: string;
  endTime?: string | null;
  valorOperacao: number;
  status: Status;
  startDate: string;        // ISO yyyy-MM-dd
  endDate: string;          // ISO yyyy-MM-dd
  closingDate?: string | null;
  obs?: string | null;
  motivo?: Motivo;
  userId: number;
};

// ---------- helpers ----------
function ddmmyyyyToISO(d: string | null | undefined): string | null {
  if (!d) return null;
  if (d.includes('-')) return d; // já ISO
  const [dd, mm, yyyy] = d.split('/');
  if (!dd || !mm || !yyyy) return d;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeUsuario(u: unknown): Usuario {
  if (u && typeof u === 'object') {
    const anyU = u as Record<string, unknown>;
    return { id: Number(anyU.id ?? 0), nome: String(anyU.nome ?? '') };
  }
  return { id: 0, nome: '' };
}

function normalizeOperacao(raw: unknown): Operacao {
  const r = (raw ?? {}) as Record<string, any>;
  const startISO =
    ddmmyyyyToISO(r.startDate) ??
    ddmmyyyyToISO(r.createdAt) ??
    '';

  return {
    id: Number(r.id),
    atividade: String(r.atividade ?? ''),
    status: (r.status as Status) ?? 'Aberto',
    startTime: r.startTime ?? null,
    endTime: r.endTime ?? null,
    startDate: String(startISO ?? ''),
    endDate: ddmmyyyyToISO(r.endDate) ?? null,
    closingDate: ddmmyyyyToISO(r.closingDate) ?? null,
    valorOperacao: Number(r.valorOperacao ?? 0),
    obs: r.obs ? String(r.obs) : null,
    motivo: (r.motivo as Motivo) ?? null,
    usuario: normalizeUsuario(r.usuario),
  };
}

// ---------- LISTAR ----------
export async function listOperacoes(opts?: Opts): Promise<Operacao[]> {
  const data = await api.get<unknown[]>('/operacoes', opts);
  return (data ?? []).map(normalizeOperacao);
}

// ---------- BUSCAR POR ID ----------
export async function getOperacao(id: number, opts?: Opts): Promise<Operacao> {
  const raw = await api.get<unknown>(`/operacao/${id}`, opts);
  return normalizeOperacao(raw);
}

// ---------- CRIAR/ATUALIZAR ----------
export async function upsertOperacao(payload: { id?: number } & OperacaoInput, opts?: Opts) {
  // validações básicas
  if (!payload.atividade?.trim()) throw new Error('Campo "atividade" é obrigatório.');
  if (!payload.startTime?.trim()) throw new Error('Campo "startTime" é obrigatório.');
  if (!payload.startDate?.trim()) throw new Error('Campo "startDate" é obrigatório.');
  if (!payload.endDate?.trim()) throw new Error('Campo "endDate" é obrigatório.');
  if (!payload.userId) throw new Error('Campo "userId" é obrigatório.');

  const body = {
    atividade: payload.atividade.trim(),
    startTime: payload.startTime,
    endTime: payload.endTime ?? null,
    valorOperacao: Number(payload.valorOperacao ?? 0),
    status: payload.status,
    startDate: payload.startDate,   // já ISO
    endDate: payload.endDate,       // já ISO
    closingDate: payload.closingDate ?? null,
    obs: payload.obs ?? null,
    motivo: payload.motivo ?? null,
    userId: payload.userId,
  };

  if (payload.id) {
    return await api.put(`/operacao/${payload.id}`, body, opts);
  }
  return await api.post('/operacao', body, opts);
}

// ---------- DELETAR ----------
export async function deleteOperacao(id: number, opts?: Opts) {
  return await api.delete(`/operacao/${id}`, opts);
}

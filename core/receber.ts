// core/receber.ts
import { api, ApiOptions } from '../lib/https';
type Opts = Pick<ApiOptions, 'headers' | 'baseUrl'>;

export type Receber = {
  id: number;
  status: 'Aberto' | 'Parcial' | 'Atrasado' | 'Fechado';
  clienteId: number;
  clienteNome?: string;
  cidade?: string;
  ficha?: string;
  vencimento: string;        // 'YYYY-MM-DD' (normalizado)
  valorReceber: number;
  parcelas: number;
  formaPagamento?: string | null;
  categoria?: string | null;
  dataReceber?: string | null; // 'YYYY-MM-DD' ou null
  valorPago?: number | null;
  custos?: number | null;
  descontos?: number | null;
  valorEmAberto?: number | null;
  obs?: string | null;
  melhorDia?: number | null;
  empresa?: string | null;
  createdAt?: string;        // ISO
  usuario?: { id: number; nome: string } | null;
};

export type ReceberInput = {
  status?: Receber['status'];
  clienteId: number;
  vencimento: string;               // 'YYYY-MM-DD'
  valorReceber: number;
  parcelas: number;
  formaPagamento?: string | null;
  categoria?: string | null;
  dataReceber?: string | null;      // 'YYYY-MM-DD' ou null
  valorPago?: number | null;
  custos?: number | null;
  descontos?: number | null;
  valorEmAberto?: number | null;
  obs?: string | null;
  melhorDia?: number | null;
  empresa?: string | null;
};

function parseNumber(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function toISO(dateLike: string) {
  // aceita 'YYYY-MM-DD' ou 'dd/MM/yyyy'
  if (!dateLike) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return dateLike;
  const m = dateLike.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return dateLike;
}

export async function listReceber(opts?: Opts): Promise<Receber[]> {
  const data = await api.get<any[]>('/receber', opts);
  return data.map((r) => ({
    id: r.id,
    status: r.status,
    clienteId: r.cliente?.id ?? r.clienteId,
    clienteNome: r.cliente?.razaoSocial ?? r.clienteNome ?? r.cliente,
    cidade: r.cidade ?? r.cliente?.cidade ?? null,
    ficha: r.ficha ?? r.recibo ?? null,
    vencimento: toISO(r.vencimento),
    valorReceber: parseNumber(r.valorReceber),
    parcelas: parseNumber(r.parcelas ?? 1),
    formaPagamento: r.formaPagamento ?? r.pagamento ?? null,
    categoria: r.categoria ?? null,
    dataReceber: r.dataReceber ? toISO(r.dataReceber) : null,
    valorPago: r.valorPago != null ? parseNumber(r.valorPago) : null,
    custos: r.custos != null ? parseNumber(r.custos) : null,
    descontos: r.descontos != null ? parseNumber(r.descontos) : null,
    valorEmAberto: r.valorEmAberto != null ? parseNumber(r.valorEmAberto) : null,
    obs: r.obs ?? null,
    melhorDia: r.melhorDia != null ? parseNumber(r.melhorDia) : null,
    empresa: r.empresa ?? null,
    createdAt: r.createdAt ?? null,
  }));
}

export async function getReceber(id: number, opts?: Opts): Promise<Receber> {
  const r = await api.get<any>(`/receber/${id}`, opts);
  return {
    id: r.id,
    status: r.status,
    clienteId: r.cliente?.id ?? r.clienteId,
    clienteNome: r.cliente?.razaoSocial ?? r.clienteNome ?? r.cliente,
    cidade: r.cidade ?? r.cliente?.cidade ?? null,
    ficha: r.cliente?.ficha ?? r.ficha ?? r.recibo ?? null,
    vencimento: toISO(r.vencimento),
    valorReceber: parseNumber(r.valorReceber),
    parcelas: parseNumber(r.parcelas ?? 1),
    formaPagamento: r.formaPagamento ?? r.pagamento ?? null,
    categoria: r.categoria ?? null,
    dataReceber: r.dataReceber ? toISO(r.dataReceber) : null,
    valorPago: r.valorPago != null ? parseNumber(r.valorPago) : null,
    custos: r.custos != null ? parseNumber(r.custos) : null,
    descontos: r.descontos != null ? parseNumber(r.descontos) : null,
    valorEmAberto: r.valorEmAberto != null ? parseNumber(r.valorEmAberto) : null,
    obs: r.obs ?? null,
    melhorDia: r.melhorDia != null ? parseNumber(r.melhorDia) : null,
    empresa: r.empresa ?? null,
  };
}

export async function upsertReceber(
  payload: { id?: number } & ReceberInput,
  opts?: Opts
) {
  // limpeza
  if (!payload.clienteId) throw new Error('Selecione um cliente.');
  if (!payload.vencimento) throw new Error('Data da venda é obrigatória.');
  if (!payload.valorReceber || payload.valorReceber <= 0) throw new Error('Valor a receber inválido.');

  const body = {
    status: payload.status, // opcional (no create calculamos no front)
    clienteId: payload.clienteId,
    vencimento: payload.vencimento,
    valorReceber: payload.valorReceber,
    parcelas: payload.parcelas ?? 1,
    formaPagamento: payload.formaPagamento ?? null,
    categoria: payload.categoria ?? null,
    dataReceber: payload.dataReceber ?? null,
    valorPago: payload.valorPago ?? null,
    custos: payload.custos ?? null,
    descontos: payload.descontos ?? null,
    valorEmAberto: payload.valorEmAberto ?? null,
    obs: payload.obs ?? null,
    melhorDia: payload.melhorDia ?? null,
    empresa: payload.empresa ?? null,
  };

  if (payload.id) {
    return await api.put(`/receber/${payload.id}`, body, opts);
  }
  return await api.post(`/receber`, body, opts);
}

export async function deleteReceber(id: number, opts?: Opts) {
  return await api.delete(`/receber/${id}`, opts);
}

// ---- extras p/ outras telas antigas ----
export type Recebido = {
  id: number;
  idReceber: number;
  cobrador?: string | null;
  cliente?: string | null;
  ficha?: string | null;
  recebido: string;   // 'YYYY-MM-DD'
  valorPago: number;
  cidade?: string | null;
};
export async function listRecebidos(opts?: Opts): Promise<Recebido[]> {
  const data = await api.get<any[]>('/recebidos', opts);
  return data.map((r) => ({
    id: r.id,
    idReceber: r.idReceber ?? r.id_receber ?? 0,
    cobrador: r.cobrador ?? null,
    cliente: r.cliente ?? null,
    ficha: r.ficha ?? null,
    recebido: toISO(r.recebido),
    valorPago: parseNumber(r.valorPago),
    cidade: r.cidade ?? null,
  }));
}

export type PagamentoLinha = { id: number; valorPago: number; formaPagamento: string; dataPagamento: string };
export async function listPagamentosDoReceber(id: number, opts?: Opts): Promise<PagamentoLinha[]> {
  const data = await api.get<any[]>(`/datapag/${id}`, opts);
  return data.map((p) => ({
    id: p.id,
    valorPago: parseNumber(p.valorPago),
    formaPagamento: p.formaPagamento ?? '',
    dataPagamento: toISO(p.dataPagamento),
  }));
}

export async function listReceberPorCliente(clienteId: number, opts?: Opts): Promise<Receber[]> {
  const data = await api.get<any[]>(`/recebercliente/${clienteId}`, opts);
  return data.map((r) => ({
    id: r.id,
    status: r.status,
    clienteId: r.clienteId ?? clienteId,
    clienteNome: r.cliente ?? r.clienteNome ?? null,
    vencimento: toISO(r.vencimento),
    valorReceber: parseNumber(r.valorReceber),
    parcelas: parseNumber(r.parcelas ?? 1),
    formaPagamento: r.formaPagamento ?? null,
    categoria: r.categoria ?? null,
    dataReceber: r.dataReceber ? toISO(r.dataReceber) : null,
    valorPago: r.valorPago != null ? parseNumber(r.valorPago) : null,
    descontos: r.descontos != null ? parseNumber(r.descontos) : null,
    valorEmAberto: r.valorEmAberto != null ? parseNumber(r.valorEmAberto) : null,
    empresa: r.empresa ?? null,
  }));
}

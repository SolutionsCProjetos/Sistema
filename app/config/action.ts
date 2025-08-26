// app/config/action.ts
'use server';

import { cookies } from 'next/headers';
import {
  listSetores, upsertSetor, deleteSetor,
  listPagamentos, upsertPagamento, deletePagamento,
  listCategorias, upsertCategoria, deleteCategoria,
} from '../../core/configs';

async function authHeaderFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// SETOR
export async function listSetoresAction() {
  try {
    const headers = await authHeaderFromCookie();
    const data = await listSetores({ headers });
    return { ok: true as const, data };
  } catch (e: any) {
    console.error('Erro ao listar setores:', e);
    return { ok: false as const, message: e?.message ?? 'Erro ao listar setores' };
  }
}

export async function upsertSetorAction(input: { id?: number; setor: string }) {
  try {
    const headers = await authHeaderFromCookie();
    const result = await upsertSetor(input, { headers });
    return { ok: true as const, data: result };
  } catch (e: any) {
    return { ok: false as const, message: e?.message ?? 'Erro ao salvar setor' };
  }
}

export async function deleteSetorAction(id: number) {
  try {
    const headers = await authHeaderFromCookie();
    await deleteSetor(id, { headers });
    return { ok: true as const };
  } catch (e: any) {
    console.error('Erro ao deletar setor:', e);
    return { ok: false as const, message: e?.message ?? 'Erro ao deletar setor' };
  }
}

// PAGAMENTO
export async function listPagamentosAction() {
  try {
    const headers = await authHeaderFromCookie();
    const data = await listPagamentos({ headers });
    return { ok: true as const, data };
  } catch (e: any) {
    console.error('Erro ao listar pagamentos:', e);
    return { ok: false as const, message: e?.message ?? 'Erro ao listar pagamentos' };
  }
}

export async function upsertPagamentoAction(input: { id?: number; tipo: string }) {
  try {
    const headers = await authHeaderFromCookie();
    const result = await upsertPagamento(input, { headers });
    return { ok: true as const, data: result };
  } catch (e: any) {
    return { ok: false as const, message: e?.message ?? 'Erro ao salvar pagamento' };
  }
}

export async function deletePagamentoAction(id: number) {
  try {
    const headers = await authHeaderFromCookie();
    await deletePagamento(id, { headers });
    return { ok: true as const };
  } catch (e: any) {
    console.error('Erro ao deletar pagamento:', e);
    return { ok: false as const, message: e?.message ?? 'Erro ao deletar pagamento' };
  }
}

// CATEGORIA
export async function listCategoriasAction() {
  try {
    const headers = await authHeaderFromCookie();
    const data = await listCategorias({ headers });
    return { ok: true as const, data };
  } catch (e: any) {
    console.error('Erro ao listar categorias:', e);
    return { ok: false as const, message: e?.message ?? 'Erro ao listar categorias' };
  }
}

export async function upsertCategoriaAction(input: { id?: number; categoria: string }) {
  try {
    const headers = await authHeaderFromCookie();
    const result = await upsertCategoria(input, { headers });
    return { ok: true as const, data: result };
  } catch (e: any) {
    console.error('Erro ao salvar categoria:', e);
    return { ok: false as const, message: e?.message ?? 'Erro ao salvar categoria' };
  }
}

export async function deleteCategoriaAction(id: number) {
  try {
    const headers = await authHeaderFromCookie();
    await deleteCategoria(id, { headers });
    return { ok: true as const };
  } catch (e: any) {
    console.error('Erro ao deletar categoria:', e);
    return { ok: false as const, message: e?.message ?? 'Erro ao deletar categoria' };
  }
}
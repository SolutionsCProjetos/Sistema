'use server';

import { cookies } from 'next/headers';
import {
  deleteClient,
  getClients,
  upsertClient,
  listVendedores,
  listCobradores,
  getClientById,
  type Client,
  type UpsertClientInput,
} from '../../core/clients';

export type ClientsResult =
  | { ok: true; data: Awaited<ReturnType<typeof getClients>> }
  | { ok: false; message: string };

async function authHeaderFromCookie() {
  const cookieStore = await cookies();                    // Next 15: await
  const token = cookieStore.get('authToken')?.value;      // mesma chave do login
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function getClientsAction(): Promise<ClientsResult> {
  try {
    const headers = await authHeaderFromCookie();
    const data = await getClients({ headers });
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro ao buscar clientes' };
  }
}

export async function deleteClientAction(id: number): Promise<{ ok: boolean; message?: string }> {
  try {
    const headers = await authHeaderFromCookie();
    await deleteClient(id, { headers });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro ao deletar cliente' };
  }
}

export type UpsertResult =
  | { ok: true; data: Client }
  | { ok: false; message: string };

// app/home/action.ts
// app/home/action.ts
export async function upsertClientAction(input: any): Promise<UpsertResult> {
  try {
    const headers = await authHeaderFromCookie();
    const data = await upsertClient(input, { headers });
    return { ok: true, data };
  } catch (e: any) {
    console.error('upsertClientAction ERROR:', e);
    return { ok: false, message: e?.message ?? 'Erro ao salvar cliente' };
  }
}

export async function loadFormDataAction(id?: number): Promise<{
  vendedores: Awaited<ReturnType<typeof listVendedores>>;
  cobradores: Awaited<ReturnType<typeof listCobradores>>;
  cliente: Client | null;
}> {
  const headers = await authHeaderFromCookie();
  if (!headers) throw new Error('Acesso negado. Token não fornecido.');

  const [vendedores, cobradores, cliente] = await Promise.all([
    listVendedores({ headers }),
    listCobradores({ headers }),
    id ? getClientById(id, { headers }) : Promise.resolve(null),
  ]);

  return { vendedores, cobradores, cliente };
}

// Se quiser uma action específica para detalhe:
export async function getClientByIdAction(id: number): Promise<{
  ok: boolean; data?: Client; message?: string;
}> {
  try {
    const headers = await authHeaderFromCookie();
    const data = await getClientById(id, { headers });
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro ao buscar cliente' };
  }
}

// core/configs.ts
import { api, ApiOptions } from '../lib/https';

type Opts = Pick<ApiOptions, 'headers' | 'baseUrl'>;

export type Setor = { id: number; setor: string };
export type Pagamento = { id: number; tipo: string };
export type Categoria = { id: number; categoria: string };

// ---------- SETOR ----------
export async function listSetores(opts?: Opts): Promise<Setor[]> {
  const data = await api.get<any[]>('/setor', opts);
  return data.map(s => ({ id: s.id, setor: s.setor }));
}

export async function upsertSetor(payload: { id?: number; setor: string }, opts?: Opts) {
  
  // 🔥 VALIDAÇÃO E LIMPEZA DOS DADOS
  const setorValue = payload.setor?.trim();
  if (!setorValue) {
    throw new Error('Campo "setor" é obrigatório.');
  }

  // 🔥 OBJETO SIMPLES E LIMPO - exatamente como o backend espera
  const requestBody = {
    setor: setorValue
  };

  try {
    let result;
    if (payload.id) {
      // 🔥 Atualização - PUT
      result = await api.put(`/setor/${payload.id}`, requestBody, opts);
    } else {
      // 🔥 Criação - POST
      result = await api.post('/setor', requestBody, opts);
    }

    return result;
  } catch (error) {
    console.error('❌ [CONFIG] Erro ao salvar setor:', error);
    throw error;
  }
}

export async function deleteSetor(id: number, opts?: Opts) {
  return await api.delete(`/setor/${id}`, opts);
}

// ---------- PAGAMENTO ----------
export async function listPagamentos(opts?: Opts): Promise<Pagamento[]> {
  const data = await api.get<any[]>('/pagamento', opts);

  // BACK envia { id, formasPagamento: string }, mas às vezes pode vir como "tipo".
  return data.map((p: any) => ({
    id: p.id,
    tipo: p.tipo ?? p.formasPagamento ?? p.formaPagamento ?? p.descricao ?? '',
  }));
}


export async function upsertPagamento(payload: { id?: number; tipo: string }, opts?: Opts) {
  const tipoValue = payload.tipo?.trim();
  if (!tipoValue) {
    throw new Error('Campo "tipo" é obrigatório.');
  }

  const requestBody = {
    tipo: tipoValue
  };
  
  try {
    let result;
    if (payload.id) {
      result = await api.put(`/pagamento/${payload.id}`, requestBody, opts);
    } else {
      result = await api.post('/pagamento', requestBody, opts);
    }
    return result;
  } catch (error) {
    console.error('❌ [CONFIG] Erro ao salvar pagamento:', error);
    throw error;
  }
}

export async function deletePagamento(id: number, opts?: Opts) {
  return await api.delete(`/pagamento/${id}`, opts);
}

// ---------- CATEGORIA ----------
export async function listCategorias(opts?: Opts): Promise<Categoria[]> {
  const data = await api.get<any[]>('/categoria', opts);
  return data.map(c => ({ id: c.id, categoria: c.categoria }));
}

export async function upsertCategoria(payload: { id?: number; categoria: string }, opts?: Opts) {
  const categoriaValue = payload.categoria?.trim();
  if (!categoriaValue) {
    throw new Error('Campo "categoria" é obrigatório.');
  }

  const requestBody = {
    categoria: categoriaValue
  };
  
  try {
    let result;
    if (payload.id) {
      result = await api.put(`/categoria/${payload.id}`, requestBody, opts);
    } else {
      result = await api.post('/categoria', requestBody, opts);
    }
    return result;
  } catch (error) {
    console.error('❌ [CONFIG] Erro ao salvar categoria:', error);
    throw error;
  }
}

export async function deleteCategoria(id: number, opts?: Opts) {
  return await api.delete(`/categoria/${id}`, opts);
}
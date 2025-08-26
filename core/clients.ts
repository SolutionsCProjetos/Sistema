import { api, ApiOptions } from '../lib/https';

export type Employee = { id: number; nome: string };

export type Client = {
  id: number;
  razaoSocial: string;
  cidade: string;
  contato?: string;
  cpf?: string;
  funcionarioPrincipal?: Employee | null;   // vendedor
  funcionarioSecundario?: Employee | null;  // cobrador

  // campos aceitos pelo back:
  cnpj?: string | null;
  status?: string | null;
  email?: string | null;
  fantasia?: string | null;           // (conhecido por)
  cep?: string | null;
  endereco?: string | null;
  num?: string | null;
  bairro?: string | null;
  uf?: string | null;
  pontoReferencia?: string | null;
  telefone_2?: string | null;
  obs?: string | null;
  ficha?: string | null;
  situacao?: string | null;           // Liberado/Bloqueado

  // datas (se existirem)
  vencimentoCertificado?: string | null;
  vencimentoContrato?: string | null;
};

// core/clients.ts
export type UpsertClientInput = {
  id?: number;
  razaoSocial: string;
  contato: string;
  cpf?: string; // ⚠️ mudar para string (pode ser vazia)
  cnpj?: string; // ⚠️ mudar para string (pode ser vazia)
  funcionarioPrincipalId: number;
  funcionarioSecundarioId: number;
  status?: string;
  email?: string;
  fantasia?: string;
  cep?: string;
  endereco?: string;
  num?: string;
  bairro?: string;
  uf?: string;
  cidade?: string;
  pontoReferencia?: string;
  telefone_2?: string;
  obs?: string;
  ficha?: string;
  situacao?: string;
};

type Opts = Pick<ApiOptions, 'headers' | 'baseUrl'>;

// helpers
const onlyDigits = (v?: string | null) => (v ? v.replace(/\D+/g, '') : v);
const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// core/clients.ts
function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    // Não remover campos numéricos zero ou IDs obrigatórios
    if (v !== undefined && v !== null && v !== '') {
      // Preservar IDs mesmo que sejam zero (se for o caso)
      if (k.includes('Id') && typeof v === 'number') {
        out[k] = v;
      } else if (typeof v === 'string' && v.trim() !== '') {
        out[k] = v;
      } else if (typeof v !== 'string') {
        out[k] = v;
      }
    }
  }
  return out as Partial<T>;
}

// Função auxiliar para converter string vazia em null
const emptyToNull = (value: any) => 
  (value !== null && value !== undefined && value !== '') ? value : null;

// Use assim:
function mapToBackend(input: UpsertClientInput) {
  const payload = {
    cnpj: emptyToNull(input.cnpj),
    cpf: emptyToNull(input.cpf),
    email: emptyToNull(input.email),
    fantasia: emptyToNull(input.fantasia),
    cep: emptyToNull(input.cep),
    endereco: emptyToNull(input.endereco),
    num: emptyToNull(input.num),
    bairro: emptyToNull(input.bairro),
    uf: emptyToNull(input.uf),
    cidade: emptyToNull(input.cidade),
    pontoReferencia: emptyToNull(input.pontoReferencia),
    telefone_2: emptyToNull(input.telefone_2),
    obs: emptyToNull(input.obs),
    ficha: emptyToNull(input.ficha),
    
    // Campos obrigatórios
    status: input.status || 'Ativo',
    contato: input.contato || '',
    razaoSocial: input.razaoSocial,
    funcionarioPrincipalId: input.funcionarioPrincipalId,
    funcionarioSecundarioId: input.funcionarioSecundarioId,
    situacao: input.situacao || 'Liberado',
  };

  return payload;
}


// ======== APIs ========
export async function getClients(opts?: Opts): Promise<Client[]> {
  return await api.get<Client[]>('/cliente', opts);
}

export async function getClientById(id: number, opts?: Opts): Promise<Client> {
  return await api.get<Client>(`/cliente/${id}`, opts);
}

export async function deleteClient(id: number, opts?: Opts): Promise<void> {
  await api.delete(`/cliente/${id}`, opts);
}

// export async function upsertClient(input: UpsertClientInput, opts?: Opts): Promise<Client> {
//   const body = mapToBackend(input);
//   if (input.id) return await api.put<Client>(`/cliente/${input.id}`, body, opts);
//   console.log('upsertClient: body=', body);
//   return await api.post<Client>('/cliente', body, opts);
// }

export async function upsertClient(input: UpsertClientInput, opts?: Opts): Promise<Client> {
  const body = mapToBackend(input);
  
  // ⚠️ GARANTIR headers corretos
  const headers = {
    ...opts?.headers,
    'Content-Type': 'application/json' // ← Force application/json
  };

  try {
    if (input.id) {
      return await api.put<Client>(`/cliente/${input.id}`, body, { ...opts, headers });
    }
    return await api.post<Client>('/cliente', body, { ...opts, headers });
  } catch (err: any) {
    console.error('❌ Upsert client error:', err);
    throw err;
  }
}


// listas p/ selects
export async function listVendedores(opts?: Opts): Promise<Employee[]> {
  return await api.get<Employee[]>('/vendedor', opts);
}
export async function listCobradores(opts?: Opts): Promise<Employee[]> {
  return await api.get<Employee[]>('/cobrador', opts);
}

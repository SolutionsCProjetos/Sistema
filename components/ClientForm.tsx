'use client';

import { useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { Client, Employee } from '../core/clients';
import { upsertClientAction } from '../app/home/action';

type Mode = 'create' | 'edit';

type Props = {
  mode: Mode;
  initial?: Client | null;
  vendedores?: Employee[];
  cobradores?: Employee[];
  onSuccess?: () => void;
};

const onlyDigits = (v?: string | null) => (v ? v.replace(/\D+/g, '') : '');
const maskCPF = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
};
const maskCNPJ = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};
const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};
const maskCEP = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
};
const normalizeUF = (v: string) => v.toUpperCase().slice(0, 2);

export default function ClientForm({
  mode,
  initial,
  vendedores = [],
  cobradores = [],
  onSuccess,
}: Props) {
  const router = useRouter();

  // estados (mapeados 1:1 ao back)
  const [cnpj, setCnpj] = useState(initial?.cnpj ?? '');
  const [cpf, setCpf] = useState(initial?.cpf ?? '');
  const [razaoSocial, setRazaoSocial] = useState(initial?.razaoSocial ?? '');
  const [fantasia, setFantasia] = useState(initial?.fantasia ?? '');

  const [vendedorId, setVendedorId] = useState<number | ''>(initial?.funcionarioPrincipal?.id ?? '');
  const [cobradorId, setCobradorId] = useState<number | ''>(initial?.funcionarioSecundario?.id ?? '');

  const [contato, setContato] = useState(initial?.contato ?? '');
  const [telefone2, setTelefone2] = useState((initial as any)?.telefone_2 ?? '');

  const [email, setEmail] = useState(initial?.email ?? '');
  const [cep, setCep] = useState(initial?.cep ?? '');
  const [endereco, setEndereco] = useState(initial?.endereco ?? '');
  const [num, setNum] = useState((initial as any)?.num ?? '');
  const [bairro, setBairro] = useState(initial?.bairro ?? '');
  const [uf, setUf] = useState(initial?.uf ?? '');
  const [cidade, setCidade] = useState(initial?.cidade ?? '');
  const [pontoReferencia, setPontoReferencia] = useState(initial?.pontoReferencia ?? '');
  const [ficha, setFicha] = useState((initial as any)?.ficha ?? '');

  const [situacao, setSituacao] = useState(initial?.situacao ?? 'Liberado');
  const [status, setStatus] = useState(initial?.status ?? 'Ativo');

  const [obs, setObs] = useState((initial as any)?.obs ?? '');

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  // validações obrigatórias
  const requiredOk = useMemo(() => {
    const hasCpfOrCnpj = onlyDigits(cpf).length === 11 || onlyDigits(cnpj).length === 14;
    const telOk = onlyDigits(contato).length >= 10;
    const vendedorOk = !!vendedorId;
    const cobradorOk = !!cobradorId;
    return hasCpfOrCnpj && razaoSocial.trim().length > 1 && telOk && vendedorOk && cobradorOk;
  }, [cpf, cnpj, razaoSocial, contato, vendedorId, cobradorId]);

  // ViaCEP
  const buscarCEP = async () => {
    const dig = onlyDigits(cep);
    if (dig.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${dig}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEndereco(data.logradouro ?? '');
        setBairro(data.bairro ?? '');
        setCidade(data.localidade ?? '');
        setUf(normalizeUF(data.uf ?? ''));
        setPontoReferencia(data.complemento ?? '');
      }
    } catch {
      // silenciar erro de rede do ViaCEP
    }
  };

 // No onSubmit do ClientForm
// const onSubmit = async (e: FormEvent) => {
//   e.preventDefault();
//   setErr('');

//   // Validações
//   if (!razaoSocial.trim()) {
//     setErr('O nome do cliente é obrigatório!');
//     return;
//   }
//   const cpfDigits = onlyDigits(cpf);
//   const cnpjDigits = onlyDigits(cnpj);
//   if (!cpfDigits && !cnpjDigits) {
//     setErr('O CPF/CNPJ é obrigatório!');
//     return;
//   }
//   if (onlyDigits(contato).length < 10) {
//     setErr('O telefone é obrigatório!');
//     return;
//   }
//   if (!vendedorId) {
//     setErr('Selecione um vendedor válido!');
//     return;
//   }
//   if (!cobradorId) {
//     setErr('Selecione um cobrador válido!');
//     return;
//   }

//   // ⚠️ IMPORTANTE: Contornar os problemas do backend
//   const payload = {
//     id: (initial as any)?.id,

//     status: status || 'Ativo',
//     email: email || null,
//     contato: onlyDigits(contato) || null,
    
//     // Enviar CNPJ/CPF já formatados SEM PONTOS (como o backend espera)
//     cnpj: cnpjDigits || null,  // ⚠️ Enviar null em vez de ''
//     cpf: cpfDigits || null,    // ⚠️ Enviar null em vez de ''
    
//     razaoSocial: razaoSocial || null,
//     fantasia: fantasia || null,

//     // ⚠️ ENVIAR STRING VAZIA EM VEZ DE NULL para evitar erro no .replace()
//     cep: onlyDigits(cep) || null,
//     endereco: endereco || null,
//     num: num || null,
//     bairro: bairro || null,
//     uf: uf || null,
//     cidade: cidade || null,
//     pontoReferencia: pontoReferencia || null,

//     // ⚠️ ENVIAR STRING VAZIA EM VEZ DE NULL
//     telefone_2: onlyDigits(telefone2) || null,

//     funcionarioPrincipalId: Number(vendedorId),
//     funcionarioSecundarioId: Number(cobradorId),

//     situacao: situacao || 'Liberado',
//     ficha: ficha || null,
//     obs: obs || null,
//   };

//   // ⚠️ REMOVER CAMPOS VAZIOS que podem causar problemas
//   const cleanedPayload = Object.fromEntries(
//     Object.entries(payload).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
//   );

//   setSaving(true);
//   try {
//     const res = await upsertClientAction(cleanedPayload);
//     if (!res.ok) {
//       setErr(res.message ?? 'Erro ao salvar.');
//       return;
//     }

//     if (onSuccess) {
//       onSuccess();
//     } else if (mode === 'create') {
//       const id = (res as any).data?.id;
//       if (id) router.push("/home");
//       else router.back();
//     } else {
//       router.back();
//     }
//   } catch (error: any) {
//     console.error('Erro ao salvar cliente:', error);
//     setErr(error.message || 'Erro ao salvar cliente. Verifique o console para mais detalhes.');
//   } finally {
//     setSaving(false);
//   }
// };

  const onSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setErr('');

  // Validações
  if (!razaoSocial.trim()) {
    setErr('O nome do cliente é obrigatório!');
    return;
  }
  const cpfDigits = onlyDigits(cpf);
  const cnpjDigits = onlyDigits(cnpj);
  if (!cpfDigits && !cnpjDigits) {
    setErr('O CPF/CNPJ é obrigatório!');
    return;
  }
  if (onlyDigits(contato).length < 10) {
    setErr('O telefone é obrigatório!');
    return;
  }
  if (!vendedorId) {
    setErr('Selecione um vendedor válido!');
    return;
  }
  if (!cobradorId) {
    setErr('Selecione um cobrador válido!');
    return;
  }

  // ⚠️ IMPORTANTE: Enviar string vazia em vez de null
  const payload = {
    id: (initial as any)?.id,

    status: status || 'Ativo',
    email: email || '', // string vazia
    contato: onlyDigits(contato) || '',
    
    cnpj: onlyDigits(cnpj) || '',  // string vazia
    cpf: onlyDigits(cpf) || '',    // string vazia
    
    razaoSocial: razaoSocial || '',
    fantasia: fantasia || '',

    cep: onlyDigits(cep) || '',    // string vazia
    endereco: endereco || '',
    num: num || '',
    bairro: bairro || '',
    uf: uf || '',
    cidade: cidade || '',
    pontoReferencia: pontoReferencia || '',

    telefone_2: onlyDigits(telefone2) || '', // string vazia

    funcionarioPrincipalId: Number(vendedorId),
    funcionarioSecundarioId: Number(cobradorId),

    situacao: situacao || 'Liberado',
    ficha: ficha || '',
    obs: obs || '',
  };

  // ⚠️ REMOVA ESTE FILTRO - deixe as strings vazias passarem!
  // const cleanedPayload = Object.fromEntries(
  //   Object.entries(payload).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
  // );

  setSaving(true);
  try {
    // Envie o payload diretamente, sem filtrar strings vazias
    const res = await upsertClientAction(payload);
    
    if (res && typeof res === 'object' && 'ok' in res) {
      if (!res.ok) {
        setErr(res.message ?? 'Erro ao salvar.');
        return;
      }
    } else {
      throw new Error('Resposta inesperada do servidor');
    }

    if (onSuccess) {
      onSuccess();
    } else if (mode === 'create') {
      const id = (res as any).data?.id;
      if (id) router.push("/home");
      else router.back();
    } else {
      router.back();
    }
  } catch (error: any) {
    console.error('Erro ao salvar cliente:', error);
    
    if (error.status === 409) {
      setErr('Este cliente já está cadastrado no sistema. Verifique o CPF/CNPJ.');
    } else {
      setErr(error.message || 'Erro ao salvar cliente.');
    }
  } finally {
    setSaving(false);
  }
};


  return (
    <form onSubmit={onSubmit} className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {err && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {err}
        </div>
      )}

      <h2 className="text-2xl font-bold text-[#17686f] mb-6 border-b border-gray-200 pb-3">
        {mode === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* CNPJ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={cnpj}
            onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
            placeholder="00.000.000/0000-00"
          />
        </div>

        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">*CPF:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
          />
        </div>

        {/* Razão Social */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">*Nome:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            placeholder="Nome completo"
          />
        </div>

        {/* Fantasia (Conhecido por) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conhecido por:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={fantasia}
            onChange={(e) => setFantasia(e.target.value)}
          />
        </div>

        {/* Vendedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">*Vendedor:</label>
          <select
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">Selecione um vendedor</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Cobrador */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">*Cobrador:</label>
          <select
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={cobradorId}
            onChange={(e) => setCobradorId(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">Selecione um cobrador</option>
            {cobradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Telefone 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">*Telefone:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={contato}
            onChange={(e) => setContato(maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            required
          />
        </div>

        {/* Telefone 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone 2:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={telefone2}
            onChange={(e) => setTelefone2(maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@email.com"
          />
        </div>

        {/* CEP + Buscar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEP:</label>
          <div className="flex gap-2">
            <input
              className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              value={cep}
              onChange={(e) => setCep(maskCEP(e.target.value))}
              placeholder="00000-000"
            />
            <button
              type="button"
              onClick={buscarCEP}
              className="px-4 py-2 bg-[#007cb2] text-white rounded-lg hover:bg-[#00689c] transition-colors flex items-center"
              title="Buscar endereço"
            >
              <FaSearch className="text-sm" />
            </button>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
        </div>

        {/* Número */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={num}
            onChange={(e) => setNum(e.target.value)}
          />
        </div>

        {/* Bairro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bairro:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
          />
        </div>

        {/* UF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">UF:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={uf}
            onChange={(e) => setUf(normalizeUF(e.target.value))}
            placeholder="PE"
            maxLength={2}
          />
        </div>

        {/* Cidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          />
        </div>

        {/* Ponto de Referência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={pontoReferencia}
            onChange={(e) => setPontoReferencia(e.target.value)}
          />
        </div>

        {/* Ficha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">COD. Ficha:</label>
          <input
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={ficha}
            onChange={(e) => setFicha(e.target.value)}
          />
        </div>

        {/* Situação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Situação:</label>
          <select
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
          >
            <option value="Liberado">Liberado</option>
            <option value="Bloqueado">Bloqueado</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
          <select
            className="w-full border border-[#007cb2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Observação */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Observação:</label>
        <textarea
          className="w-full border border-[#007cb2] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#007cb2] h-28 resize-none"
          placeholder="Digite aqui..."
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          maxLength={300}
        />
        <div className="text-right text-xs text-gray-500">{obs.length}/300</div>
      </div>

      {/* Ações */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={saving || !requiredOk}
          className="px-6 py-2 bg-[#007cb2] text-white rounded-lg hover:bg-[#00689c] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Gravando...' : 'Gravar'}
        </button>
      </div>
    </form>
  );

}

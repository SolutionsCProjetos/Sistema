'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { Receber, ReceberInput, upsertReceber } from '../core/receber';
import { listPagamentos, listCategorias, Pagamento, Categoria } from '../core/configs';
import ClienteSelect from './ClienteSelect';

type Props = {
  editingId?: number;
  initial?: Partial<Receber>;
  onSaved?: () => void;
  onCancel?: () => void;
};

function toCurrencyBR(v: number): string {
  return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseCurrencyBR(v: string): number {
  if (!v) return 0;
  const clean = v.replace(/\./g, '').replace(',', '.');
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}
function maskBR(raw: string) {
  const digits = raw.replace(/\D/g, '');
  const padded = digits.padStart(3, '0');
  const withComma = `${padded.slice(0, -2)},${padded.slice(-2)}`;
  return withComma.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function ReceberForm({ editingId, initial, onSaved, onCancel }: Props) {
  const [clienteId, setClienteId] = useState<number | null>(initial?.clienteId ?? null);

  const [vencimento, setVencimento] = useState(initial?.vencimento ?? '');
  const [valorStr, setValorStr] = useState(toCurrencyBR(initial?.valorReceber ?? 0));
  const [parcelas] = useState<number>(initial?.parcelas ?? 1);

  const [formaPagamento, setFormaPagamento] = useState<string | null>(initial?.formaPagamento ?? null);
  const [categoria, setCategoria] = useState<string | null>(initial?.categoria ?? null);

  const [dataReceber, setDataReceber] = useState(initial?.dataReceber ?? '');
  const [valorPagoStr, setValorPagoStr] = useState(toCurrencyBR(initial?.valorPago ?? 0));
  const [descontosStr, setDescontosStr] = useState(toCurrencyBR(initial?.descontos ?? 0));
  const [custosStr, setCustosStr] = useState(toCurrencyBR(initial?.custos ?? 0));
  const [obs, setObs] = useState(initial?.obs ?? '');
  const [melhorDia, setMelhorDia] = useState<number | ''>(initial?.melhorDia ?? '');
  const [empresa, setEmpresa] = useState(initial?.empresa ?? 'WELLINGTON MOVEIS - BEZERROS');

  const [pags, setPags] = useState<Pagamento[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(true);

  const [openPagamento, setOpenPagamento] = useState(false);
  const [openCategoria, setOpenCategoria] = useState(false);

  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' | 'warn' } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingCombos(true);
        const [lp, lc] = await Promise.all([listPagamentos(), listCategorias()]);
        if (!alive) return;
        setPags(lp);
        setCats(lc);
      } catch (e) {
        // opcional: exibir erro
      } finally {
        if (alive) setLoadingCombos(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const valor = parseCurrencyBR(valorStr);
  const valorPago = parseCurrencyBR(valorPagoStr);
  const descontos = parseCurrencyBR(descontosStr);
  const custos = parseCurrencyBR(custosStr);

  const valorEmAberto = useMemo(() => {
    const final = Math.max(0, valor - descontos - valorPago);
    return final;
  }, [valor, descontos, valorPago]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!clienteId) return setToast({ text: 'Selecione um cliente.', kind: 'warn' });
    if (!vencimento) return setToast({ text: 'A data da venda é obrigatória.', kind: 'warn' });
    if (valor <= 0) return setToast({ text: 'O Valor a Receber é obrigatório.', kind: 'warn' });

    if (melhorDia !== '' && (Number(melhorDia) < 1 || Number(melhorDia) > 31)) {
      return setToast({ text: 'O melhor dia precisa estar entre 1 e 31.', kind: 'warn' });
    }

    let status: Receber['status'] = 'Aberto';
    if (valorEmAberto <= 0) status = 'Fechado';
    else if (valorPago > 0 && valorPago < valor - descontos) status = 'Parcial';

    const payload: ReceberInput = {
      status,
      clienteId,
      vencimento,
      valorReceber: valor,
      parcelas,
      formaPagamento: formaPagamento ?? null,
      categoria: categoria ?? null,
      dataReceber: dataReceber || null,
      valorPago: valorPago || null,
      custos: custos || null,
      descontos: descontos || null,
      valorEmAberto: valorEmAberto || null,
      obs: obs ? obs.toUpperCase() : null,
      melhorDia: melhorDia === '' ? null : Number(melhorDia),
      empresa: empresa || null,
    };

    setWorking(true);
    try {
      await upsertReceber({ id: editingId, ...payload });
      setToast({ text: editingId ? 'Receber atualizado!' : 'Receber criado!', kind: 'success' });
      onSaved?.();
    } catch (err: any) {
      setToast({ text: String(err?.message ?? 'Erro ao salvar.'), kind: 'error' });
    } finally {
      setWorking(false);
    }
  }

  const disabled = working;

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h2 className="text-xl lg:text-2xl font-bold text-[#17686f] mb-4">
        {editingId ? 'Editar Contas a Receber' : 'Nova Contas a Receber'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* linha 1 */}
        <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">*Data da venda</label>
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1 flex items-center gap-2">
              Forma de Pagamento
              {loadingCombos && <FaSpinner className="animate-spin text-[#007cb2]" size={14} />}
            </label>
            <div className="relative">
              <select
                value={formaPagamento ?? ''}
                onChange={(e) => {
                  setFormaPagamento(e.target.value || null);
                  setOpenPagamento(false);
                }}
                onMouseDown={() => setOpenPagamento(true)}
                onBlur={() => setOpenPagamento(false)}
                className="w-full h-10 px-3 py-2 pr-10 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2] appearance-none"
                disabled={loadingCombos || disabled}
              >
                <option value="">Selecione...</option>
                {pags.map((p) => (
                  <option key={p.id} value={p.tipo}>
                    {p.tipo}
                  </option>
                ))}
              </select>
              <span
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
                  openPagamento ? 'rotate-180' : 'rotate-0'
                }`}
              >
                ▼
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1 flex items-center gap-2">
              Categoria
              {loadingCombos && <FaSpinner className="animate-spin text-[#007cb2]" size={14} />}
            </label>
            <div className="relative">
              <select
                value={categoria ?? ''}
                onChange={(e) => {
                  setCategoria(e.target.value || null);
                  setOpenCategoria(false);
                }}
                onMouseDown={() => setOpenCategoria(true)}
                onBlur={() => setOpenCategoria(false)}
                className="w-full h-10 px-3 py-2 pr-10 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2] appearance-none"
                disabled={loadingCombos || disabled}
              >
                <option value="">Selecione...</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.categoria}>
                    {c.categoria}
                  </option>
                ))}
              </select>
              <span
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
                  openCategoria ? 'rotate-180' : 'rotate-0'
                }`}
              >
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* cliente */}
        <ClienteSelect
          label="*Cliente"
          initialId={typeof initial?.clienteId === 'number' ? initial?.clienteId : undefined}
          onChange={(id) => setClienteId(id ?? null)}
          required
        />

        {/* valores */}
        <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">*Valor total a Receber</label>
            <input
              value={valorStr}
              onChange={(e) => setValorStr(maskBR(e.target.value))}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              placeholder="0,00"
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Parcelas</label>
            <input
              value={String(parcelas)}
              readOnly
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md bg-gray-50"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Data Recebido</label>
            <input
              type="date"
              value={dataReceber ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                const today = new Date().toISOString().slice(0, 10);
                if (v && v > today) {
                  setToast({ text: 'A data recebida não pode ser posterior à data atual.', kind: 'warn' });
                  return;
                }
                setDataReceber(v);
              }}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Valor Pago</label>
            <input
              value={valorPagoStr}
              onChange={(e) => setValorPagoStr(maskBR(e.target.value))}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Descontos</label>
            <input
              value={descontosStr}
              onChange={(e) => setDescontosStr(maskBR(e.target.value))}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Custos</label>
            <input
              value={custosStr}
              onChange={(e) => setCustosStr(maskBR(e.target.value))}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Valor em aberto</label>
            <div className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md bg-gray-50 flex items-center">
              R$ {toCurrencyBR(valorEmAberto)}
            </div>
          </div>

          {valorEmAberto < 0 && (
            <div className="flex flex-col">
              <label className="text-sm text-gray-700 mb-1">Troco</label>
              <div className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md bg-gray-50 flex items-center">
                R$ {toCurrencyBR(Math.abs(valorEmAberto))}
              </div>
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Melhor dia</label>
            <input
              type="number"
              value={melhorDia}
              onChange={(e) => setMelhorDia(e.target.value ? Number(e.target.value) : '')}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              placeholder="Dia 1 a 31"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 sm:grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Empresa</label>
            <input
              value={empresa ?? ''}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              disabled={disabled}
            />
          </div>

          {editingId && (
            <div className="flex flex-col">
              <label className="text-sm text-gray-700 mb-1">Status (visualização)</label>
              <input
                value={initial?.status ?? '—'}
                readOnly
                className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md bg-gray-50"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Observação</label>
          <textarea
            value={obs ?? ''}
            onChange={(e) => setObs(e.target.value)}
            className="w-full px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            rows={4}
            placeholder="Digite aqui…"
            disabled={disabled}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              onClick={onCancel}
              disabled={disabled}
            >
              Voltar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:opacity-60"
            disabled={disabled}
          >
            {working ? 'Gravando…' : 'Gravar'}
          </button>
        </div>
      </form>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow z-50 ${
            toast.kind === 'success'
              ? 'bg-green-600 text-white'
              : toast.kind === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-yellow-500 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

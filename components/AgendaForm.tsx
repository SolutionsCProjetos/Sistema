'use client';

import { useMemo, useState } from 'react';
import { Motivo, Operacao, OperacaoInput, Status, upsertOperacao } from '../core/agenda';
import OperadorSelect from './OperadorSelect';

type Props = {
  editingId?: number;
  initial?: Partial<Operacao>;
  onSaved?: (msg?: string) => void;
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

export default function OperacaoForm({ editingId, initial, onSaved, onCancel }: Props) {
  const nowHHMM = useMemo(() => {
    const dt = new Date();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }, []);

  // Operador: select mostra NOME, mas guardamos ID para enviar ao back
  const [userId, setUserId] = useState<number | null>(initial?.usuario?.id ?? null);

  const [atividade, setAtividade] = useState(initial?.atividade ?? '');
  const [startTime, setStartTime] = useState(initial?.startTime ?? nowHHMM);
  const [endTime, setEndTime] = useState(initial?.endTime ?? '');
  const [valorOperacaoStr, setValorOperacaoStr] = useState(toCurrencyBR(initial?.valorOperacao ?? 0));
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [closingDate, setClosingDate] = useState(initial?.closingDate ?? '');
  const [status, setStatus] = useState<Status>(initial?.status ?? 'Aberto');
  const [motivo, setMotivo] = useState<Motivo>(initial?.motivo ?? null);
  const [obs, setObs] = useState(initial?.obs ?? '');
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' | 'warn' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      setToast({ text: 'Selecione o operador.', kind: 'warn' });
      return;
    }
    if (!atividade.trim()) {
      setToast({ text: 'A atividade é obrigatória.', kind: 'warn' });
      return;
    }
    if (!startTime.trim()) {
      setToast({ text: 'O tempo inicial é obrigatório.', kind: 'warn' });
      return;
    }
    if (!startDate.trim()) {
      setToast({ text: 'A data inicial é obrigatória.', kind: 'warn' });
      return;
    }
    if (!endDate.trim()) {
      setToast({ text: 'Informe a data de finalização.', kind: 'warn' });
      return;
    }

    const payload: OperacaoInput = {
      atividade,
      startTime,
      endTime: endTime || null,
      valorOperacao: parseCurrencyBR(valorOperacaoStr),
      status,
      startDate,
      endDate,
      closingDate: closingDate || null,
      obs: obs || null,
      motivo,
      userId, // ← envia somente o ID
    };

    setWorking(true);
    try {
      await upsertOperacao({ id: editingId, ...payload });
      setToast({ text: editingId ? 'Operação atualizada!' : 'Operação criada!', kind: 'success' });
      onSaved?.(editingId ? 'updated' : 'created');
    } catch (err: any) {
      setToast({ text: String(err?.message ?? 'Erro ao salvar.'), kind: 'error' });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h2 className="text-xl lg:text-2xl font-bold text-[#17686f] mb-4">
        {editingId ? 'Editar Operação' : 'Nova Operação'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-4">
          {/* Operador (Select por nome, devolve id) */}
          <OperadorSelect
            titulo="Operador:"
            initialOperadorId={typeof initial?.usuario?.id === 'number' ? initial?.usuario?.id : undefined}
            onChange={(id) => setUserId(id)}
            required
          />

          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-gray-700 mb-1">Atividade</label>
            <input
              value={atividade}
              onChange={(e) => setAtividade(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              placeholder="Descrição da operação"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Início da atividade</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Fim da atividade</label>
            <input
              type="time"
              value={endTime ?? ''}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Valor da operação</label>
            <input
              value={valorOperacaoStr}
              onChange={(e) => setValorOperacaoStr(maskBR(e.target.value))}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              placeholder="0,00"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Data para finalizar OC</label>
            <input
              type="date"
              value={endDate ?? ''}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Data da finalização</label>
            <input
              type="date"
              value={closingDate ?? ''}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Status</label>
          <div className="flex items-center gap-6 flex-wrap">
            {(['Aberto', 'Andamento', 'Atrasado', 'Finalizado', 'Cancelado'] as Status[]).map((s) => (
              <label key={s} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={(e) => setStatus(e.target.value as Status)}
                />
                <span>{s === 'Andamento' ? 'Em andamento' : s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Motivo</label>
          <div className="flex items-center gap-6 flex-wrap">
            {(['Sem exito', 'Sem Perfil', 'Pausado'] as Exclude<Motivo, null>[]).map((m) => (
              <label key={m} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="motivo"
                  value={m}
                  checked={motivo === m}
                  onChange={(e) => setMotivo(e.target.value as Motivo)}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Observação */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Observação</label>
          <textarea
            value={obs ?? ''}
            onChange={(e) => setObs(e.target.value)}
            className="w-full px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            rows={4}
            placeholder="Digite aqui…"
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              onClick={onCancel}
              disabled={working}
            >
              Voltar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:opacity-60"
            disabled={working}
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

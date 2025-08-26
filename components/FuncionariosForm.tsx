'use client';

import { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { Funcionario, UpsertFuncionarioInput, upsertFuncionario, getFuncionario } from '../core/funcionario';

type Props = {
  editingId?: number;
  initial?: Partial<Funcionario>;
  onSaved?: (msg?: string) => void;
  onCancel?: () => void;
};

export default function EmployeeForm({ editingId, initial, onSaved, onCancel }: Props) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [setor, setSetor] = useState<'vendedor' | 'cobrador'>(
    (initial?.setor as 'vendedor' | 'cobrador') ?? 'vendedor'
  );

  const [loadingInit, setLoadingInit] = useState<boolean>(!!editingId);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'warn' } | null>(null);

  // controla animação do chevron
  const [isSetorOpen, setIsSetorOpen] = useState(false);

  useEffect(() => {
    if (!editingId) return;

    (async () => {
      try {
        setLoadingInit(true);
        const data = await getFuncionario(editingId);
        setNome(data.nome);
        setSetor(data.setor);
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e && 'message' in e ? (e as any).message : 'Erro ao carregar funcionário';
        setToast({ text: String(msg), type: 'error' });
      } finally {
        setLoadingInit(false);
      }
    })();
  }, [editingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setToast({ text: 'O nome é obrigatório.', type: 'warn' });
      return;
    }
    if (!setor) {
      setToast({ text: 'O setor é obrigatório.', type: 'warn' });
      return;
    }

    const payload: UpsertFuncionarioInput = { id: editingId, nome, setor };

    setWorking(true);
    try {
      await upsertFuncionario(payload);
      setToast({ text: editingId ? 'Funcionário atualizado!' : 'Funcionário cadastrado!', type: 'success' });
      onSaved?.(editingId ? 'updated' : 'created');
    } catch (e: unknown) {
      const msg = typeof e === 'object' && e && 'message' in e ? (e as any).message : 'Erro ao salvar';
      setToast({ text: String(msg), type: 'error' });
    } finally {
      setWorking(false);
    }
  }

  const disabled = loadingInit || working;

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h2 className="text-xl lg:text-2xl font-bold text-[#17686f] mb-4">
        {editingId ? 'Atualizar Funcionário' : 'Novo Funcionário'}
      </h2>

      {/* Loader inicial */}
      {loadingInit && (
        <div className="flex items-center gap-3 mb-4 text-[#007cb2]">
          <FaSpinner className="animate-spin" size={22} />
          <span>Carregando dados…</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 sm:grid-cols-1 gap-4">
          {/* Nome */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Nome *</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
              placeholder="Nome do funcionário"
              disabled={disabled}
            />
          </div>

          {/* Setor */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">Setor *</label>
            <div className="relative">
              <select
                value={setor}
                onChange={(e) => {
                  setSetor(e.target.value as 'vendedor' | 'cobrador');
                  setIsSetorOpen(false);
                }}
                onMouseDown={() => setIsSetorOpen(true)}
                onBlur={() => setIsSetorOpen(false)}
                className="w-full h-10 px-3 py-2 pr-10 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2] appearance-none"
                disabled={disabled}
              >
                <option value="vendedor">Vendedor</option>
                <option value="cobrador">Cobrador</option>
              </select>

              {/* Chevron animado */}
              <span
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
                  isSetorOpen ? 'rotate-180' : 'rotate-0'
                }`}
                aria-hidden
              >
                ▼
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
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
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : toast.type === 'error'
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

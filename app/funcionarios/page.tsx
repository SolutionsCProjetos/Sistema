'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteFuncionario, listFuncionarios, Funcionario } from '../../core/funcionario';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { FaSearch } from 'react-icons/fa';

const ITENS_POR_PAGINA = 15;

function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  working,
  title = 'Confirmar exclusão',
  message = 'Deseja deletar este funcionário?',
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  working?: boolean;
  title?: string;
  message?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={onCancel}
            disabled={!!working}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            onClick={onConfirm}
            disabled={!!working}
          >
            {working ? 'Deletando...' : 'Deletar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListaFuncionariosPage() {
  const [all, setAll] = useState<Funcionario[]>([]);
  const [list, setList] = useState<Funcionario[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFuncionarios();
      setAll(data);
      setList(data);
      setPage(1);
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e: any) {
      setToast({ text: e?.message ?? 'Erro ao carregar', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aplicar = useCallback(() => {
    const term = q.trim().toUpperCase();
    let base = [...all];
    if (term) {
      base = base.filter((f) => `${f.nome} ${f.setor}`.toUpperCase().includes(term));
    }
    setList(base);
    setPage(1);
  }, [all, q]);

  useEffect(() => {
    aplicar();
  }, [aplicar]);

  const totalPag = Math.max(1, Math.ceil(list.length / ITENS_POR_PAGINA));
  const visiveis = useMemo(() => {
    const start = (page - 1) * ITENS_POR_PAGINA;
    return list.slice(start, start + ITENS_POR_PAGINA);
  }, [list, page]);

  function abrirExcluir(id: number) {
    setDeleteId(id);
    setModalOpen(true);
  }
  function fecharExcluir() {
    setDeleteId(null);
    setModalOpen(false);
  }
  async function confirmarExcluir() {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await deleteFuncionario(deleteId);
      setAll((prev) => prev.filter((f) => f.id !== deleteId));
      setList((prev) => prev.filter((f) => f.id !== deleteId));
      setToast({ text: 'Excluído com sucesso!', type: 'success' });
    } catch (e: any) {
      setToast({ text: e?.message ?? 'Erro ao excluir', type: 'error' });
    } finally {
      setDeleting(false);
      fecharExcluir();
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />

      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          {/* filtros (busca 50% máx e botões à direita; sem "Aplicar") */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-6">
            <div className="w-full lg:w-1/2">
              <label className="text-sm text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aplicar()}
                  className="w-full border border-[#007cb2] rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  placeholder="nome ou setor…"
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="flex gap-2 lg:ml-auto">
              <button
                onClick={() => {
                  setQ('');
                  setList(all);
                  setPage(1);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Limpar
              </button>
              <Link
                href="/funcionarios/novo"
                className="px-6 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] transition"
              >
                Novo
              </Link>
            </div>
          </div>

          {/* tabela */}
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-[#1c7d87] text-white">
                <tr>
                  <th className="px-4 py-3">Setor</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-500">
                      Carregando…
                    </td>
                  </tr>
                ) : visiveis.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-500">
                      Sem registros.
                    </td>
                  </tr>
                ) : (
                  visiveis.map((f) => (
                    <tr key={f.id} className="even:bg-[#c4f9ff]">
                      <td className="px-4 py-3 capitalize">{f.setor}</td>
                      <td className="px-4 py-3">{f.nome}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-3 justify-center">
                          <Link href={`/funcionarios/${f.id}`} className="text-[#007cb2] hover:underline">
                            Editar
                          </Link>
                          <button className="text-red-600 hover:underline" onClick={() => abrirExcluir(f.id)}>
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* paginação padronizada */}
          {list.length > 0 && (
            <div className="mt-6 flex flex-col xs:flex-row justify-center items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:bg-gray-400"
              >
                Anterior
              </button>

              <span className="text-gray-700">
                Página {page} de {totalPag}
              </span>

              <button
                disabled={page === totalPag}
                onClick={() => setPage((p) => Math.min(p + 1, totalPag))}
                className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:bg-gray-400"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ConfirmModal open={modalOpen} onCancel={fecharExcluir} onConfirm={confirmarExcluir} working={deleting} />

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

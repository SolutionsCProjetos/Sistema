'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { deleteOperacao, listOperacoes, Operacao } from '../../core/agenda';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const ITENS_POR_PAGINA = 10;

function formatBRFromISO(d: string): string {
  const [y, m, dd] = d.split('-');
  if (!y || !m || !dd) return d;
  return `${dd}/${m}/${y}`;
}

function ConfirmModal({
  open,
  title = 'Confirmar exclusão',
  message = 'Deseja deletar este registro?',
  onCancel,
  onConfirm,
  working,
}: {
  open: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  working?: boolean;
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

export default function OperacoesListPage() {
  const [todos, setTodos] = useState<Operacao[]>([]);
  const [lista, setLista] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [texto, setTexto] = useState('');
  const [status, setStatus] = useState<'Todos' | Operacao['status']>('Todos');
  const [tipoData, setTipoData] = useState<'dia' | 'intervalo'>('dia');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // estados para animar os chevrons dos selects
  const [statusOpen, setStatusOpen] = useState(false);
  const [tipoOpen, setTipoOpen] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listOperacoes();
      setTodos(data);
      setLista(data);
      setPagina(1);
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e: any) {
      const msg = e?.message ?? 'Erro ao carregar';
      setError(msg);
      setToast({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aplicar = useCallback(() => {
    let base = [...todos];
    const term = texto.trim().toUpperCase();
    if (term) {
      base = base.filter((it) =>
        `${it.atividade} ${it.startDate} ${it.usuario?.nome}`.toUpperCase().includes(term)
      );
    }
    if (status !== 'Todos') {
      base = base.filter((it) => it.status === status);
    }
    if (tipoData === 'dia') {
      if (dataIni) base = base.filter((it) => it.startDate?.slice(0, 10) === dataIni);
    } else {
      if (dataIni && dataFim) {
        base = base.filter((it) => {
          const d = it.startDate?.slice(0, 10);
          return d >= dataIni && d <= dataFim;
        });
      }
    }
    setLista(base);
    setPagina(1);
  }, [todos, texto, status, tipoData, dataIni, dataFim]);

  useEffect(() => {
    aplicar();
  }, [aplicar]);

  const totalPag = Math.max(1, Math.ceil(lista.length / ITENS_POR_PAGINA));
  const visiveis = useMemo(() => {
    const start = (pagina - 1) * ITENS_POR_PAGINA;
    return lista.slice(start, start + ITENS_POR_PAGINA);
  }, [lista, pagina]);

  function abrirExcluir(id: number) {
    setDeleteId(id);
    setModalOpen(true);
  }
  function fecharExcluir() {
    setModalOpen(false);
    setDeleteId(null);
  }
  async function confirmarExcluir() {
    if (deleteId == null) return;
    setDeletando(true);
    try {
      await deleteOperacao(deleteId);
      setTodos((prev) => prev.filter((x) => x.id !== deleteId));
      setLista((prev) => prev.filter((x) => x.id !== deleteId));
      setToast({ text: 'Registro excluído com sucesso!', type: 'success' });
    } catch (e: any) {
      setToast({ text: e?.message ?? 'Erro ao excluir', type: 'error' });
    } finally {
      setDeletando(false);
      fecharExcluir();
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />

      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          {/* filtros */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            {/* Busca */}
            <div className="flex-1">
              <label className="text-sm text-gray-700 mb-1 block">Buscar</label>
              <input
                ref={inputRef}
                className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && aplicar()}
                placeholder="atividade, data ou operador…"
              />
            </div>

            {/* Status (select com chevron) */}
            <div className="w-full md:w-48">
              <label className="text-sm text-gray-700 mb-1 block">Status</label>
              <div className="relative">
                <select
                  className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#007cb2] appearance-none"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as typeof status);
                    setStatusOpen(false);
                  }}
                  onMouseDown={() => setStatusOpen(true)}
                  onBlur={() => setStatusOpen(false)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Aberto">Aberto</option>
                  <option value="Andamento">Em andamento</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
                    statusOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Tipo de data (select com chevron) */}
            <div className="w-full md:w-40">
              <label className="text-sm text-gray-700 mb-1 block">Tipo de data</label>
              <div className="relative">
                <select
                  className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#007cb2] appearance-none"
                  value={tipoData}
                  onChange={(e) => {
                    setTipoData(e.target.value as 'dia' | 'intervalo');
                    setTipoOpen(false);
                  }}
                  onMouseDown={() => setTipoOpen(true)}
                  onBlur={() => setTipoOpen(false)}
                >
                  <option value="dia">Dia</option>
                  <option value="intervalo">Intervalo</option>
                </select>
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
                    tipoOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Datas (inputs padronizados) */}
            {tipoData === 'dia' ? (
              <div className="w-full md:w-48">
                <label className="text-sm text-gray-700 mb-1 block">Data</label>
                <input
                  type="date"
                  className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  value={dataIni}
                  onChange={(e) => setDataIni(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="w-full md:w-48">
                  <label className="text-sm text-gray-700 mb-1 block">Início</label>
                  <input
                    type="date"
                    className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                    value={dataIni}
                    onChange={(e) => setDataIni(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <label className="text-sm text-gray-700 mb-1 block">Fim</label>
                  <input
                    type="date"
                    className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTexto('');
                  setStatus('Todos');
                  setTipoData('dia');
                  setDataIni('');
                  setDataFim('');
                  setLista(todos);
                  setPagina(1);
                }}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Limpar
              </button>
              <Link
              href="/agenda/nova"
              className="px-6 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] transition"
            >
              Nova
            </Link>
            </div>
          </div>

          {/* Loader */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin text-[#007cb2]">
                <FaSpinner size={32} />
              </div>
              <span className="ml-3 text-gray-600">Carregando atividades...</span>
            </div>
          )}

          {/* tabela */}
          {!loading && (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-[#1c7d87] text-white">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Operador</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Início</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Finalizado</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Data</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {error ? (
                    <tr>
                      <td colSpan={6} className="text-center text-red-600 py-6">
                        {error}
                      </td>
                    </tr>
                  ) : visiveis.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        Sem registros.
                      </td>
                    </tr>
                  ) : (
                    visiveis.map((cad) => (
                      <tr key={cad.id} className="even:bg-[#c4f9ff]">
                        <td
                          className={`px-4 py-3 ${
                            cad.status === 'Atrasado' ? 'text-orange-600 font-semibold' : ''
                          }`}
                        >
                          {cad.status}
                        </td>
                        <td className="px-4 py-3">{cad.usuario?.nome}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">{cad.startTime || '—'}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">{cad.endTime || '00:00'}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {cad.startDate ? formatBRFromISO(cad.startDate.slice(0, 10)) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-3 justify-center">
                            <Link
                              href={`/agenda/${cad.id}`}
                              className="text-[#007cb2] hover:underline"
                              title="Editar"
                            >
                              Editar
                            </Link>
                            <button
                              className="text-red-600 hover:underline"
                              onClick={() => abrirExcluir(cad.id)}
                              title="Deletar"
                            >
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
          )}

          {/* paginação (padrão da ListaClientePage) */}
          {!loading && !error && lista.length > 0 && (
            <div className="mt-6 flex flex-col xs:flex-row justify-center items-center gap-3">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:bg-gray-400"
              >
                Anterior
              </button>

              <span className="text-gray-700">
                Página {pagina} de {totalPag}
              </span>

              <button
                disabled={pagina === totalPag}
                onClick={() => setPagina((p) => Math.min(p + 1, totalPag))}
                className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:bg-gray-400"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ConfirmModal open={modalOpen} onCancel={fecharExcluir} onConfirm={confirmarExcluir} working={deletando} />

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow z-50 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

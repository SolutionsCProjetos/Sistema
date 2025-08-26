'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listReceber, deleteReceber, Receber } from '../../core/receber';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { FaSpinner } from 'react-icons/fa';

const ITENS_POR_PAGINA = 30;

function formatBRFromISO(d?: string | null) {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  if (!y || !m || !dd) return d;
  return `${dd}/${m}/${y}`;
}

export default function ReceberListPage() {
  const [todos, setTodos] = useState<Receber[]>([]);
  const [lista, setLista] = useState<Receber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [texto, setTexto] = useState('');
  const [status, setStatus] = useState<'Todos' | Receber['status']>('Todos');
  const [tipoData, setTipoData] = useState<'dia' | 'intervalo'>('dia');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // estados para chevrons animados nos selects
  const [statusOpen, setStatusOpen] = useState(false);
  const [tipoDataOpen, setTipoDataOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listReceber();
      setTodos(data);
      setLista(data);
      setPagina(1);
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar contas a receber.');
      setToast({ text: e?.message ?? 'Erro ao carregar', type: 'error' });
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
        `${it.clienteNome ?? ''} ${it.ficha ?? ''} ${it.cidade ?? ''} ${it.valorReceber} ${it.vencimento}`
          .toUpperCase()
          .includes(term)
      );
    }
    if (status !== 'Todos') {
      base = base.filter((it) => it.status === status);
    }
    if (tipoData === 'dia') {
      if (dataIni) base = base.filter((it) => it.vencimento?.slice(0, 10) === dataIni);
    } else if (dataIni && dataFim) {
      base = base.filter((it) => {
        const d = it.vencimento?.slice(0, 10);
        return d >= dataIni && d <= dataFim;
      });
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

  const pagesWindow = useMemo(() => {
    const maxBtns = 15;
    const start = Math.max(1, pagina - Math.floor(maxBtns / 2));
    const end = Math.min(totalPag, start + maxBtns - 1);
    const out: number[] = [];
    for (let p = start; p <= end; p++) out.push(p);
    return out;
  }, [pagina, totalPag]);

  async function confirmarExcluir(id: number) {
    setDeletando(true);
    try {
      await deleteReceber(id);
      setTodos((prev) => prev.filter((x) => x.id !== id));
      setLista((prev) => prev.filter((x) => x.id !== id));
      setToast({ text: 'Registro excluído com sucesso!', type: 'success' });
    } catch (e: any) {
      setToast({ text: e?.message ?? 'Erro ao excluir', type: 'error' });
    } finally {
      setDeletando(false);
      setDeleteId(null);
    }
  }

  const limpar = () => {
    setTexto('');
    setStatus('Todos');
    setTipoData('dia');
    setDataIni('');
    setDataFim('');
    setLista(todos);
    setPagina(1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />

      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm text-gray-700 mb-1 block">Buscar</label>
              <input
                ref={inputRef}
                className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && aplicar()}
                placeholder="cliente, ficha, cidade…"
                disabled={loading}
              />
            </div>

            {/* Status (com chevron animado) */}
            <div className="w-full md:w-48">
              <label className="text-sm text-gray-700 mb-1 block">Status</label>
              <div className="relative">
                <select
                  className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as typeof status);
                    setStatusOpen(false);
                  }}
                  onMouseDown={() => setStatusOpen(true)}
                  onBlur={() => setStatusOpen(false)}
                  disabled={loading}
                >
                  <option value="Todos">Todos</option>
                  <option value="Aberto">Aberto</option>
                  <option value="Parcial">Parcial</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Fechado">Fechado</option>
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

            {/* Tipo de data (com chevron animado) */}
            <div className="w-full md:w-40">
              <label className="text-sm text-gray-700 mb-1 block">Tipo de data</label>
              <div className="relative">
                <select
                  className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  value={tipoData}
                  onChange={(e) => {
                    setTipoData(e.target.value as 'dia' | 'intervalo');
                    setTipoDataOpen(false);
                  }}
                  onMouseDown={() => setTipoDataOpen(true)}
                  onBlur={() => setTipoDataOpen(false)}
                  disabled={loading}
                >
                  <option value="dia">Dia</option>
                  <option value="intervalo">Intervalo</option>
                </select>
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
                    tipoDataOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Datas (sem chevron) */}
            {tipoData === 'dia' ? (
              <div className="w-full md:w-48">
                <label className="text-sm text-gray-700 mb-1 block">Data</label>
                <input
                  type="date"
                  className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  value={dataIni}
                  onChange={(e) => setDataIni(e.target.value)}
                  disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                <div className="w-full md:w-48">
                  <label className="text-sm text-gray-700 mb-1 block">Fim</label>
                  <input
                    type="date"
                    className="w-full h-10 border border-[#007cb2] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={limpar}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-60"
                disabled={loading}
              >
                Limpar
              </button>
              <Link href="/receber/nova" className="px-6 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] transition">
              Novo
            </Link>
            </div>
          </div>

          {/* Indicador de carregamento */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin text-[#007cb2]">
                <FaSpinner size={32} />
              </div>
              <span className="ml-3 text-gray-600">Carregando registros…</span>
            </div>
          )}

          {/* Erro */}
          {!loading && error && (
            <div className="text-center text-red-600 py-6">{error}</div>
          )}

          {/* tabela */}
          {!loading && !error && (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-[#1c7d87] text-white">
                  <tr>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3 hidden md:table-cell">N° Ficha</th>
                    <th className="px-3 py-3">Vencimento</th>
                    <th className="px-3 py-3 hidden sm:table-cell">Valor Pcl.</th>
                    <th className="px-3 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-gray-500">
                        Sem registros.
                      </td>
                    </tr>
                  ) : (
                    visiveis.map((cad) => (
                      <tr key={cad.id} className="even:bg-[#c4f9ff]">
                        <td className="px-3 py-2">{cad.status}</td>
                        <td className="px-3 py-2">{cad.clienteNome ?? '—'}</td>
                        <td className="px-3 py-2 hidden md:table-cell">{cad.ficha ?? '—'}</td>
                        <td className="px-3 py-2">{formatBRFromISO(cad.vencimento)}</td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          R{' '}
                          {cad.valorReceber.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-3 justify-center">
                            <Link href={`/receber/${cad.id}`} className="text-[#007cb2] hover:underline">
                              Exibir
                            </Link>
                            <button
                              className="text-red-600 hover:underline"
                              onClick={() => setDeleteId(cad.id)}
                              disabled={deletando}
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

          {/* paginação (padrão ListaClientePage) */}
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

      {/* modal simples */}
      {deleteId != null && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-4">Deseja deletar este registro?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setDeleteId(null)}
                disabled={deletando}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                onClick={() => confirmarExcluir(deleteId)}
                disabled={deletando}
              >
                {deletando ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}

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

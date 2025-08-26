'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteUsuario, listUsuarios, Usuario } from '../../core/usuarios';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { FaSearch, FaSpinner } from 'react-icons/fa';

const ITENS_POR_PAGINA = 10;

function normalize(s = '') {
  return s.toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export default function UsuariosListPage() {
  const [todos, setTodos] = useState<Usuario[]>([]);
  const [lista, setLista] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(1);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listUsuarios();
      setTodos(data);
      setLista(data);
      setPagina(1);
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aplicar = useCallback(() => {
    const term = normalize(q.trim());
    let base = [...todos];
    if (term) {
      base = base.filter((it) => normalize(`${it.nome} ${it.email ?? ''}`).includes(term));
    }
    setLista(base);
    setPagina(1);
  }, [q, todos]);

  useEffect(() => {
    aplicar();
  }, [aplicar]);

  const totalPag = Math.max(1, Math.ceil(lista.length / ITENS_POR_PAGINA));
  const visiveis = useMemo(() => {
    const start = (pagina - 1) * ITENS_POR_PAGINA;
    return lista.slice(start, start + ITENS_POR_PAGINA);
  }, [lista, pagina]);

  const handleClear = () => {
    setQ('');
    setLista(todos);
    setPagina(1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  function openDelete(id: number) {
    setToDeleteId(id);
    setConfirmOpen(true);
  }
  function closeDelete() {
    setConfirmOpen(false);
    setToDeleteId(null);
  }
  async function confirmDelete() {
    if (toDeleteId == null) return;
    setDeleting(true);
    try {
      await deleteUsuario(toDeleteId);
      setTodos((prev) => prev.filter((x) => x.id !== toDeleteId));
      setLista((prev) => prev.filter((x) => x.id !== toDeleteId));
    } catch (e: any) {
      alert(e?.message ?? 'Erro ao deletar.');
    } finally {
      setDeleting(false);
      closeDelete();
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />

      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          {/* filtros padronizados (busca máx 50% e botões no end; sem “Aplicar”) */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
            <div className="w-full lg:w-1/2">
              <label className="text-sm text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <input
                  ref={inputRef}
                  className="w-full h-10 border border-[#007cb2] rounded px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aplicar()}
                  placeholder="nome ou e-mail…"
                  disabled={loading}
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="flex gap-2 lg:ml-auto">
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-60"
                disabled={loading}
              >
                Limpar
              </button>
              <Link
                href="/usuarios/novo"
                className="px-6 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] transition"
              >
                Novo
              </Link>
            </div>
          </div>

          {/* loading */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin text-[#007cb2]">
                <FaSpinner size={28} />
              </div>
              <span className="ml-3 text-gray-600">Carregando…</span>
            </div>
          )}

          {/* erro */}
          {!loading && error && <div className="text-center text-red-600 py-6">{error}</div>}

          {/* tabela */}
          {!loading && !error && (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-[#1c7d87] text-white">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Setor</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-500">
                        {q ? 'Nenhum usuário encontrado para esta busca.' : 'Sem registros.'}
                      </td>
                    </tr>
                  ) : (
                    visiveis.map((u) => (
                      <tr key={u.id} className="even:bg-[#c4f9ff]">
                        <td className="px-4 py-3">{u.nome}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">{u.setor?.setor ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-3 justify-center">
                            <Link href={`/usuarios/${u.id}`} className="text-[#007cb2] hover:underline">
                              Editar
                            </Link>
                            <button className="text-red-600 hover:underline" onClick={() => openDelete(u.id)}>
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

          {/* paginação padrão (Anterior / Próxima) */}
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
      {confirmOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-4">Deseja deletar este usuário?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={closeDelete}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { deleteClientAction, getClientsAction } from './action';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

type Employee = { id: number; nome: string };
type Client = {
  id: number;
  razaoSocial: string;
  cidade: string;
  contato?: string;
  cpf?: string;
  funcionarioPrincipal?: Employee | null;
  funcionarioSecundario?: Employee | null;
};

const ITEMS_PER_PAGE = 10;

export default function ListaClientePage() {
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getClientsAction();
        if (!res.ok) throw new Error(res.message || 'Falha ao buscar clientes');
        setAllClients(res.data);
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar clientes.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const normalize = (s?: string) =>
    (s ?? '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  const filtered = useMemo(() => {
    const term = normalize(q.trim());
    if (!term) return allClients;
    
    return allClients.filter((c) => {
      const hay = normalize(
        `${c.razaoSocial} ${c.cidade} ${c.contato ?? ''} ${c.cpf ?? ''} ${c.funcionarioPrincipal?.nome ?? ''} ${c.funcionarioSecundario?.nome ?? ''}`
      );
      return hay.includes(term);
    });
  }, [allClients, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const current = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const openDelete = (id: number) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (toDeleteId == null) return;
    setDeleting(true);
    try {
      const res = await deleteClientAction(toDeleteId);
      if (!res.ok) throw new Error(res.message || 'Não foi possível deletar');
      setAllClients((prev) => prev.filter((c) => c.id !== toDeleteId));
    } catch (e: any) {
      alert(e?.message ?? 'Erro ao deletar.');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setToDeleteId(null);
    }
  };

  const formatPhone = (t?: string) => t ?? '—';

  const handleClear = () => {
    setQ('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />
      
      {/* Conteúdo Principal */}
      <main className="flex-grow mx-4 lg:mx-[20%] py-4 lg:py-8">
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-[#17686f]">Lista de Clientes</h2>
          </div>

          {/* Filtros */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
            {/* Campo de Busca - 50% de largura com ícone no final */}
            <div className="lg:w-1/2 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="border border-[#007cb2] rounded px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#007cb2] w-full"
                />
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            {/* Botões alinhados à direita */}
            <div className="flex gap-2 lg:ml-auto">
              <button
                onClick={handleClear}
                className="bg-gray-100 border border-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition"
              >
                Limpar
              </button>
              <Link 
                href="/client" 
                className="bg-[#007cb2] text-white px-6 py-2 rounded hover:bg-[#00689c] transition"
              >
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
              <span className="ml-3 text-gray-600">Carregando clientes...</span>
            </div>
          )}

          {/* Tabela */}
          {!loading && (
            <div className="overflow-x-auto rounded-md">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-[#1c7d87] text-white">
                  <tr>
                    <th className="px-4 py-3">Cobrador</th>
                    <th className="px-4 py-3">Vendedor</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Cidade</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {error ? (
                    <tr>
                      <td colSpan={6} className="text-center text-red-500 py-4">
                        {error}
                      </td>
                    </tr>
                  ) : current.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-4">
                        {q ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado.'}
                      </td>
                    </tr>
                  ) : (
                    current.map((c) => (
                      <tr key={c.id} className="even:bg-[#c4f9ff]">
                        <td className="px-4 py-3 text-gray-700">{c.funcionarioSecundario?.nome || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{c.funcionarioPrincipal?.nome || '—'}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{c.razaoSocial}</td>
                        <td className="px-4 py-3 text-gray-700">{c.cidade}</td>
                        <td className="px-4 py-3 text-gray-700">{formatPhone(c.contato)}</td>
                        <td className="px-4 py-3 text-center space-x-3">
                          <Link
                            href={`/client/${c.id}`}
                            className="text-[#007cb2] hover:underline"
                          >
                            Exibir
                          </Link>
                          <button
                            onClick={() => openDelete(c.id)}
                            className="text-red-600 hover:underline"
                          >
                            Deletar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {!loading && filtered.length > 0 && (
            <div className="mt-6 flex flex-col xs:flex-row justify-center items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:bg-gray-400"
              >
                Anterior
              </button>
              <span className="text-gray-700">Página {page} de {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:bg-gray-400"
              >
                Próxima
              </button>
            </div>
          )}

          {/* Modal de Confirmação */}
          {confirmOpen && (
            <div className="fixed inset-0 backdrop-blur-sm bg-opacity-30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-2">Confirmar exclusão</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tem certeza que deseja deletar este cliente?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setConfirmOpen(false);
                      setToDeleteId(null);
                    }}
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
      </main>

      <Footer />
    </div>
  );
}
// app/config/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listSetoresAction, upsertSetorAction, deleteSetorAction,
  listPagamentosAction, upsertPagamentoAction, deletePagamentoAction,
  listCategoriasAction, upsertCategoriaAction, deleteCategoriaAction,
} from './action';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

type Tab = 'setor' | 'pagamento' | 'categoria';
type Row = { id: string | number; label: string };

const PER_PAGE = 10;

export default function ConfigPage() {
  const [tab, setTab] = useState<Tab>('setor');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [input, setInput] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    load();
    setPage(1);
    setQ('');
  }, [tab]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      let result;
      
      if (tab === 'setor') {
        result = await listSetoresAction();
      } else if (tab === 'pagamento') {
        result = await listPagamentosAction();
      } else {
        result = await listCategoriasAction();
      }
      
      if (!result.ok) throw new Error(result.message);
      
      // Mapeia os dados corretamente
      if (tab === 'setor') {
        setRows(result.data.map((s: any) => ({ id: s.id, label: s.setor })));
      } else if (tab === 'pagamento') {
        setRows(result.data.map((p: any) => ({ id: p.id, label: p.tipo })));
      } else {
        setRows(result.data.map((c: any) => ({ id: c.id, label: c.categoria })));
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e);
      setError(e?.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setInput('');
    setEditorOpen(true);
  }
  
  function openEdit(r: Row) {
    setEditing(r);
    setInput(r.label);
    setEditorOpen(true);
  }
  
  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    setInput('');
  }

 // Substitua sua função save() no componente ConfigPage
async function save() {
  const val = input.trim();

  if (!val) {
    alert('Campo não pode estar vazio!');
    return;
  }
  
  setWorking(true);
  try {
    let result;
    
    // 🔥 DADOS ESTRUTURADOS CORRETAMENTE
    if (tab === 'setor') {
      const payload = { 
        id: editing?.id ? Number(editing.id) : undefined, 
        setor: val 
      };
      result = await upsertSetorAction(payload);
    } else if (tab === 'pagamento') {
      const payload = { 
        id: editing?.id ? Number(editing.id) : undefined, 
        tipo: val 
      };
      result = await upsertPagamentoAction(payload);
    } else {
      const payload = { 
        id: editing?.id ? Number(editing.id) : undefined, 
        categoria: val 
      };
      result = await upsertCategoriaAction(payload);
    }

    if (!result.ok) {
      alert(result.message || 'Erro ao salvar');
      return;
    }

    // Recarrega a lista para refletir as mudanças
    await load();
    closeEditor();
  } catch (e: any) {
    console.error('❌ [COMPONENT] Erro ao salvar:', e);
    alert(e?.message || 'Erro ao salvar');
  } finally {
    setWorking(false);
  }
}

  async function confirmDelete() {
    if (confirmId == null || Number.isNaN(confirmId)) {
      setConfirmId(null);
      return;
    }
    
    setWorking(true);
    try {
      let result;
      
      if (tab === 'setor') {
        result = await deleteSetorAction(confirmId);
      } else if (tab === 'pagamento') {
        result = await deletePagamentoAction(confirmId);
      } else {
        result = await deleteCategoriaAction(confirmId);
      }
      
      if (!result.ok) {
        alert(result.message || 'Erro ao deletar');
        return;
      }
      
      // Recarrega a lista para refletir as mudanças
      await load();
      setConfirmId(null);
    } catch (e: any) {
      console.error('Erro ao deletar:', e);
      alert(e?.message || 'Erro ao deletar');
    } finally {
      setWorking(false);
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toUpperCase();
    if (!term) return rows;
    return rows.filter(r => r.label.toUpperCase().includes(term));
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  useEffect(() => setPage(1), [q]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />

      <main className="flex-grow mx-4 lg:mx-[15%] py-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-2xl font-bold text-[#17686f] mb-4">Configuração</h2>

          <div className="flex gap-6 border-b mb-5">
            {(['setor','pagamento','categoria'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2 -mb-px ${tab===t ? 'border-b-2 border-[#1c7d87] text-[#1c7d87] font-semibold' : 'text-gray-600 hover:text-[#1c7d87]'}`}
              >
                {t === 'setor' ? 'Setor' : t === 'pagamento' ? 'Pagamentos' : 'Categorias'}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 border border-[#007cb2] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
            />
            <div className="flex gap-2">
              <button onClick={() => { setQ(''); setPage(1); }} className="px-4 py-2 rounded border">Limpar</button>
              <button onClick={openNew} className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c]">Novo</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-[#1c7d87] text-white">
                <tr>
                  <th className="px-4 py-3">
                    {tab === 'setor' ? 'Setor' : tab === 'pagamento' ? 'Tipo de Pagamento' : 'Categoria'}
                  </th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2} className="text-center py-4 text-gray-500">Carregando...</td></tr>
                ) : error ? (
                  <tr><td colSpan={2} className="text-center py-4 text-red-600">{error}</td></tr>
                ) : current.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-4 text-gray-500">Sem registros.</td></tr>
                ) : (
                  current.map(r => (
                    <tr key={String(r.id)} className="even:bg-[#c4f9ff]">
                      <td className="px-4 py-3">{r.label}</td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-[#007cb2] mr-4 hover:underline" onClick={() => openEdit(r)}>Editar</button>
                        <button className="text-red-600 hover:underline"
                                onClick={() => setConfirmId(Number(r.id))}>
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button className="px-3 py-1 rounded bg-[#007cb2] text-white disabled:bg-gray-400"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p-1))}>
                Anterior
              </button>
              <span>página {page} de {totalPages}</span>
              <button className="px-3 py-1 rounded bg-[#007cb2] text-white disabled:bg-gray-400"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p+1))}>
                Próxima
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal Editor */}
      {editorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">
              {editing ? 'Editar' : 'Novo'} {tab === 'setor' ? 'Setor' : tab === 'pagamento' ? 'Pagamento' : 'Categoria'}
            </h3>
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder={tab === 'setor' ? 'Ex.: Financeiro' : tab === 'pagamento' ? 'Ex.: Pix' : 'Ex.: Água'}
            />
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={closeEditor} disabled={working}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-[#007cb2] text-white disabled:opacity-60"
                      onClick={save} disabled={working || !input.trim()}>
                {working ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {confirmId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-4">Deseja deletar este registro?</p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setConfirmId(null)} disabled={working}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
                      onClick={confirmDelete} disabled={working}>
                {working ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

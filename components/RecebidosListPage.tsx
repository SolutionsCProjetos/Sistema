'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaSpinner, FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import { listRecebidos, Recebido } from '../core/receber';
import { listCobradores } from '../core/clients';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ITENS_POR_PAGINA = 30;
const LOGO_BASE64 = process.env.NEXT_PUBLIC_LOGO_BASE64 || '';

function formatBRFromISO(d?: string | null) {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  if (!y || !m || !dd) return d;
  return `${dd}/${m}/${y}`;
}

export default function RecebidosListPage() {
  const [todos, setTodos] = useState<Recebido[]>([]);
  const [lista, setLista] = useState<Recebido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [texto, setTexto] = useState('');
  const [tipoData, setTipoData] = useState<'dia' | 'intervalo'>('dia');
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 🔹 Relatório
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [cobradores, setCobradores] = useState<{ id: number; nome: string }[]>([]);
  const [cobradorId, setCobradorId] = useState('');
  const [cidade, setCidade] = useState('');
  const [dataIniRel, setDataIniRel] = useState('');
  const [dataFimRel, setDataFimRel] = useState('');
  const [marcaDagua, setMarcaDagua] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listRecebidos();
      setTodos(data);
      setLista(data);
      setPagina(1);
      setTimeout(() => inputRef.current?.focus(), 0);

      const cobs = await listCobradores();
      setCobradores(cobs);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar recebidos.');
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
        `${it.cobrador ?? ''} ${it.idReceber ?? ''} ${it.cliente ?? ''} ${it.ficha ?? ''} ${it.valorPago} ${it.recebido}`
          .toUpperCase()
          .includes(term)
      );
    }
    if (tipoData === 'dia') {
      if (dataIni) base = base.filter((it) => it.recebido?.slice(0, 10) === dataIni);
    } else if (dataIni && dataFim) {
      base = base.filter((it) => {
        const d = it.recebido?.slice(0, 10);
        return d >= dataIni && d <= dataFim;
      });
    }
    setLista(base);
    setPagina(1);
  }, [todos, texto, tipoData, dataIni, dataFim]);

  useEffect(() => {
    aplicar();
  }, [aplicar]);

  const totalPag = Math.max(1, Math.ceil(lista.length / ITENS_POR_PAGINA));
  const visiveis = useMemo(() => {
    const start = (pagina - 1) * ITENS_POR_PAGINA;
    return lista.slice(start, start + ITENS_POR_PAGINA);
  }, [lista, pagina]);

  // 🔹 Geração do PDF
  function gerarPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // aplica filtros do modal
    let dados = [...lista];
    if (cobradorId) {
      dados = dados.filter(
        (it) => (it.cobrador ?? '').toLowerCase() === cobradorId.toLowerCase()
      );
    }
    if (cidade) {
      dados = dados.filter(
        (it) => (it.cidade ?? '').toLowerCase().includes(cidade.toLowerCase())
      );
    }
    if (dataIniRel) {
      dados = dados.filter((it) => it.recebido?.slice(0, 10) >= dataIniRel);
    }
    if (dataFimRel) {
      dados = dados.filter((it) => it.recebido?.slice(0, 10) <= dataFimRel);
    }

    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Recebidos', pageWidth / 2, 20, { align: 'center' });

    autoTable(doc, {
      startY: 35,
      head: [['Cobrador', 'Nº C.Receber', 'Cliente', 'Nº Ficha', 'Recebido', 'Valor Pago']],
      body: dados.map((it) => [
        it.cobrador ?? '—',
        it.idReceber ?? '—',
        it.cliente ?? '—',
        it.ficha ?? '—',
        formatBRFromISO(it.recebido),
        `R$ ${it.valorPago.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      ]),
      styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
      headStyles: {
        fillColor: [28, 125, 135],
        textColor: 255,
        fontSize: 11,
        halign: 'center',
      },
      bodyStyles: { halign: 'center', valign: 'middle' },
      didDrawPage: (data) => {
        // Marca d’água
        if (marcaDagua && LOGO_BASE64.startsWith('data:image')) {
          try {
            doc.saveGraphicsState();
            const gState = new (doc as any).GState({ opacity: 0.05 });
            doc.setGState(gState);

            const logoWidth = pageWidth * 1;
            const logoHeight = logoWidth * 1;
            const x = (pageWidth - logoWidth) / 2;
            const y = (pageHeight - logoHeight) / 2;

            doc.addImage(LOGO_BASE64, 'PNG', x, y, logoWidth, logoHeight);
            doc.restoreGraphicsState();
          } catch (error) {
            console.error('Erro marca d’água:', error);
          }
        }

        // Paginação
        const totalPages = (doc as any).internal.getNumberOfPages();
        const currentPage = data.pageNumber;
        const str = `Página ${currentPage} de ${totalPages}`;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(str, pageWidth - 14, pageHeight - 10, { align: 'right' });
      },
    });

    doc.save('relatorio-recebidos.pdf');
    setRelatorioOpen(false);
  }


  return (
    <div className="flex flex-col">
      <main className="flex-grow mx-4">
        <div className="bg-white p-4 rounded-xl">
          <h2 className="text-xl lg:text-2xl font-bold text-[#17686f] mb-6">Recebidos</h2>

          {/* 🔹 Filtros */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <input
                  ref={inputRef}
                  className="w-full h-10 border border-[#007cb2] rounded px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aplicar()}
                  placeholder="cobrador, cliente, ficha…"
                  disabled={loading}
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Tipo de data */}
            <div className="w-full md:w-40">
              <label className="text-sm text-gray-700 mb-1 block">Tipo de data</label>
              <select
                className="w-full h-10 border border-[#007cb2] rounded px-3 py-2"
                value={tipoData}
                onChange={(e) => setTipoData(e.target.value as 'dia' | 'intervalo')}
                disabled={loading}
              >
                <option value="dia">Dia</option>
                <option value="intervalo">Intervalo</option>
              </select>
            </div>

            {tipoData === 'dia' ? (
              <div className="w-full md:w-48">
                <label className="text-sm text-gray-700 mb-1 block">Data</label>
                <input
                  type="date"
                  className="w-full h-10 border border-[#007cb2] rounded px-3 py-2"
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
                    className="w-full h-10 border border-[#007cb2] rounded px-3 py-2"
                    value={dataIni}
                    onChange={(e) => setDataIni(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="w-full md:w-48">
                  <label className="text-sm text-gray-700 mb-1 block">Fim</label>
                  <input
                    type="date"
                    className="w-full h-10 border border-[#007cb2] rounded px-3 py-2"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Botão Relatório */}
            <div className="flex gap-2 lg:ml-auto">
              <button
                onClick={() => setRelatorioOpen(true)}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
              >
                Relatório
              </button>
            </div>
          </div>

          {/* 🔹 Indicador de carregamento */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-[#007cb2]" size={32} />
              <span className="ml-3 text-gray-600">Carregando registros…</span>
            </div>
          )}

          {/* 🔹 Tabela */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm text-left border-collapse">
                <thead className="bg-[#1c7d87] text-white">
                  <tr>
                    <th className="px-4 py-3">Cobrador</th>
                    <th className="px-4 py-3">N° C.Receber</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">N° Ficha</th>
                    <th className="px-4 py-3">Recebido</th>
                    <th className="px-4 py-3">Valor Pago</th>
                    <th className="px-4 py-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-500">
                        Sem registros.
                      </td>
                    </tr>
                  ) : (
                    visiveis.map((cad, index) => (
                      <tr key={`recb-${cad.id ?? cad.idReceber}-${index}`} className="even:bg-[#c4f9ff]">
                        <td className="px-4 py-3">{cad.cobrador ?? '—'}</td>
                        <td className="px-4 py-3">{cad.idReceber ?? '—'}</td>
                        <td className="px-4 py-3">{cad.cliente ?? '—'}</td>
                        <td className="px-4 py-3">{cad.ficha ?? '—'}</td>
                        <td className="px-4 py-3">{formatBRFromISO(cad.recebido)}</td>
                        <td className="px-4 py-3">
                          R{' '}
                          {cad.valorPago.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/receber/${cad.idReceber}`}
                            className="text-[#007cb2] hover:underline"
                          >
                            Exibir
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 🔹 Paginação */}
          {!loading && lista.length > 0 && (
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

      {/* 🔹 Modal Relatório */}
      {relatorioOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Relatório de Recebidos</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">Cobrador</label>
                <select
                  value={cobradorId}
                  onChange={(e) => setCobradorId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Todos</option>
                  {cobradores.map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Digite a cidade"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Data Início</label>
                <input
                  type="date"
                  value={dataIniRel}
                  onChange={(e) => setDataIniRel(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Data Fim</label>
                <input
                  type="date"
                  value={dataFimRel}
                  onChange={(e) => setDataFimRel(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={marcaDagua}
                  onChange={(e) => setMarcaDagua(e.target.checked)}
                />
                <label>Adicionar marca d'água com logo</label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => setRelatorioOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={gerarPDF}
              >
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow z-50 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

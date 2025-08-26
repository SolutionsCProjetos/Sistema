'use client';

import { useEffect, useState } from 'react';
import { getOperacao, Operacao } from '../../../core/agenda';
import { useParams, useRouter } from 'next/navigation';
import OperacaoForm from '../../../components/AgendaForm';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

export default function EditOperacaoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [op, setOp] = useState<Operacao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(params.id);
    if (!id) return;
    (async () => {
      try {
        const data = await getOperacao(id);
        setOp(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header userName="Administrador" />
        <main className="flex-grow mx-4 lg:mx-[10%] py-6">
          <div className="bg-white rounded-xl shadow p-5">Carregando…</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!op) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Header userName="Administrador" />
        <main className="flex-grow mx-4 lg:mx-[10%] py-6">
          <div className="bg-white rounded-xl shadow p-5">Operação não encontrada.</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />
      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <OperacaoForm
          editingId={op.id}
          initial={op}
          onSaved={() => router.push('/agenda')}
          onCancel={() => router.push('/agenda')}
        />
      </main>
      <Footer />
    </div>
  );
}

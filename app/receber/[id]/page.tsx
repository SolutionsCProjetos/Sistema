'use client';

import { useEffect, useState } from 'react';
import { getReceber, Receber } from '../../../core/receber';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ReceberForm from '../../../components/ReceberForm';

export default function EditReceberPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [rec, setRec] = useState<Receber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(params.id);
    if (!id) return;
    (async () => {
      try {
        const data = await getReceber(id);
        setRec(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />
      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        {loading ? (
          <div className="bg-white rounded-xl shadow p-5">Carregando…</div>
        ) : !rec ? (
          <div className="bg-white rounded-xl shadow p-5">Registro não encontrado.</div>
        ) : (
          <ReceberForm
            editingId={rec.id}
            initial={rec}
            onSaved={() => router.push('/receber')}
            onCancel={() => router.push('/receber')}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

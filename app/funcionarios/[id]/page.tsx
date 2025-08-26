'use client';

import { useEffect, useState } from 'react';
import { getFuncionario, Funcionario } from '../../../core/funcionario';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import EmployeeForm from '../../../components/FuncionariosForm';

export default function EditFuncionarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Funcionario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(params.id);
    if (!id) return;
    (async () => {
      try {
        const data = await getFuncionario(id);
        setItem(data);
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
        ) : !item ? (
          <div className="bg-white rounded-xl shadow p-5">Funcionário não encontrado.</div>
        ) : (
          <EmployeeForm
            editingId={item.id}
            initial={item}
            onSaved={() => router.push('/funcionarios')}
            onCancel={() => router.push('/funcionarios')}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

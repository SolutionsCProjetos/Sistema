'use client';

import { useRouter } from 'next/navigation';
import OperacaoForm from '../../../components/AgendaForm';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

export default function NovaOperacaoPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />
      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <OperacaoForm
          onSaved={() => router.push('/agenda')}
          onCancel={() => router.push('/agenda')}
        />
      </main>
      <Footer />
    </div>
  );
}

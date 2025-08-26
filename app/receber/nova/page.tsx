'use client';

import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ReceberForm from '../../../components/ReceberForm';

export default function NovaReceberPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />
      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <ReceberForm onSaved={() => router.push('/receber')} onCancel={() => router.push('/receber')} />
      </main>
      <Footer />
    </div>
  );
}

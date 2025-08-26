'use client';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import UsuarioForm from '../../../components/UsuarioForm';

export default function NovoUsuarioPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />
      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <UsuarioForm onSaved={() => router.push('/usuarios')} onCancel={() => router.push('/usuarios')} />
      </main>
      <Footer />
    </div>
  );
}

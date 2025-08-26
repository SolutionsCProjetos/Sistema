'use client';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import UsuarioForm from '../../../components/UsuarioForm';

export default function EditarUsuarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />
      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <UsuarioForm editingId={id} onSaved={() => router.push('/usuarios')} onCancel={() => router.push('/usuarios')} />
      </main>
      <Footer />
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import EmployeeForm from '../../../components/FuncionariosForm';

export default function NovoFuncionarioPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />
      <main className="flex-grow mx-4 lg:mx-[10%] py-6">
        <EmployeeForm onSaved={() => router.push('/funcionarios')} onCancel={() => router.push('/funcionarios')} />
      </main>
      <Footer />
    </div>
  );
}

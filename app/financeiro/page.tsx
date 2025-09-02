'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import RecebidosListPage from '../../components/RecebidosListPage';
import ReceberListPage from '../../components/ReceberListPage';

type Tab = 'receber' | 'recebidos';

export default function FinanceiroPage() {
  const [tab, setTab] = useState<Tab>('receber');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header userName="Administrador" />

      <main className="flex-grow mx-4 lg:mx-[15%] py-6">
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-2xl font-bold text-[#17686f] mb-4">
            Gerenciamento Financeiro
          </h2>

          {/* Tabs */}
          <div className="flex gap-6 border-b mb-5">
            <button
              onClick={() => setTab('receber')}
              className={`pb-2 -mb-px ${
                tab === 'receber'
                  ? 'border-b-2 border-[#1c7d87] text-[#1c7d87] font-semibold'
                  : 'text-gray-600 hover:text-[#1c7d87]'
              }`}
            >
              Contas a Receber
            </button>
            <button
              onClick={() => setTab('recebidos')}
              className={`pb-2 -mb-px ${
                tab === 'recebidos'
                  ? 'border-b-2 border-[#1c7d87] text-[#1c7d87] font-semibold'
                  : 'text-gray-600 hover:text-[#1c7d87]'
              }`}
            >
              Recebidos
            </button>
          </div>

          {/* Conteúdo da aba */}
          {tab === 'receber' ? <ReceberListPage /> : <RecebidosListPage />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

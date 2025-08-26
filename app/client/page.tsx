// app/client/page.tsx  (ou app/mov/cliente/page.tsx)

import ClientForm from "../../components/ClientForm";
import { loadFormDataAction } from "../home/action";

export default async function NewClientPage() {
  const { vendedores, cobradores } = await loadFormDataAction(); // sem id
  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="bg-white rounded-xl shadow-md p-4 lg:p-6 max-w-4xl mx-auto">
        <ClientForm mode="create" vendedores={vendedores} cobradores={cobradores} />
      </div>
    </div>
  );
}

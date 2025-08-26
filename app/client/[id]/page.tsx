import ClientForm from "../../../components/ClientForm";
import { loadFormDataAction } from "../../home/action";

// app/client/[id]/page.tsx  (ou app/mov/cliente/[id]/page.tsx)
type Props = { params: Promise<{ id: string }> }; // Next 15: params é Promise

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);

  const { vendedores, cobradores, cliente } = await loadFormDataAction(numericId);

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Cliente não encontrado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8">
      <div className="bg-white rounded-xl shadow-md p-4 lg:p-6 max-w-4xl mx-auto">
        <ClientForm
          mode="edit"
          initial={cliente}
          vendedores={vendedores}
          cobradores={cobradores}
        />
      </div>
    </div>
  );
}

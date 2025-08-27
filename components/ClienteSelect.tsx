'use client';

import { useEffect, useMemo, useState } from 'react';
import { getClients, Client } from '../core/clients';
import { FaChevronDown } from 'react-icons/fa';

function maskCPF(cpf?: string | null) {
  const d = (cpf ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length !== 11) return '';
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
function maskCNPJ(cnpj?: string | null) {
  const d = (cnpj ?? '').replace(/\D/g, '').slice(0, 14);
  if (d.length !== 14) return '';
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
function idFiscal(c: Client) {
  // Mostra CPF se tiver; senão CNPJ; senão vazio
  return maskCPF(c.cpf as any) || maskCNPJ(c.cnpj as any) || '';
}

export default function ClienteSelect({
  label = 'Cliente',
  initialId,
  onChange,
  required,
}: {
  label?: string;
  initialId?: number;
  onChange?: (id: number | null, client?: Client) => void;
  required?: boolean;
}) {
  const [all, setAll] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | ''>(initialId ?? '');

  useEffect(() => {
    (async () => {
      try {
        const data = await getClients();
        setAll(data);
        if (initialId) {
          const found = data.find((c) => c.id === initialId);
          if (found) setValue(found.id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [initialId]);

  const filtered = useMemo(() => {
    const term = q.trim().toUpperCase();
    if (!term) return all;
    return all.filter((c) =>
      `${c.razaoSocial} ${c.cidade ?? ''} ${c.cpf ?? ''} ${c.cnpj ?? ''} ${c.ficha ?? ''}`
        .toUpperCase()
        .includes(term)
    );
  }, [all, q]);

  function select(idStr: string) {
    const id = Number(idStr);
    const cli = all.find((c) => c.id === id);
    setValue(id);
    onChange?.(id, cli);
    setOpen(false);
  }

  const selected = typeof value === 'number' ? all.find((c) => c.id === value) : undefined;

  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-700 mb-1 block">
        {label}{required ? ' *' : ''}
      </label>

      <div className="relative">
        <button
          type="button"
          className="w-full border border-[#007cb2] rounded px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-[#007cb2] flex items-center justify-between"
          onClick={() => setOpen((s) => !s)}
        >
          <span className="truncate">
            {loading
              ? 'Carregando...'
              : selected
              ? `${selected.razaoSocial}${idFiscal(selected) ? ' — ' + idFiscal(selected) : ''}`
              : 'Selecionar...'}
          </span>
          <FaChevronDown className={`transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} />
        </button>

        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded border shadow">
            <div className="p-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                placeholder="Buscar cliente (nome, cidade, CPF/CNPJ, ficha)..."
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">Nada encontrado</div>
              ) : (
                filtered.map((c) => {
                  const doc = idFiscal(c);
                  return (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-[#c4f9ff]"
                      onClick={() => select(String(c.id))}
                    >
                      <div className="font-medium">
                        {c.razaoSocial}{doc ? ' — ' + doc : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.cidade ?? '—'}
                        {c.ficha ? ` • Ficha: ${c.ficha}` : ''}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}













































// import { useEffect, useMemo, useState } from 'react';
// import { getClients, Client } from '../core/clients'; // ← usa seu módulo existente
// import { FaChevronDown } from 'react-icons/fa';

// export default function ClienteSelect({
//   label = 'Cliente',
//   initialId,
//   onChange,
//   required,
// }: {
//   label?: string;
//   initialId?: number;
//   onChange?: (id: number | null, client?: Client) => void;
//   required?: boolean;
// }) {
//   const [all, setAll] = useState<Client[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [q, setQ] = useState('');
//   const [open, setOpen] = useState(false);
//   const [value, setValue] = useState<number | ''>(initialId ?? '');

//   useEffect(() => {
//     (async () => {
//       try {
//         const data = await getClients();
//         setAll(data);
//         if (initialId) {
//           const found = data.find((c) => c.id === initialId);
//           if (found) setValue(found.id);
//         }
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [initialId]);

//   const filtered = useMemo(() => {
//     const term = q.trim().toUpperCase();
//     if (!term) return all;
//     return all.filter((c) =>
//       `${c.razaoSocial} ${c.cidade ?? ''} ${c.cpf ?? ''} ${c.cnpj ?? ''}`.toUpperCase().includes(term)
//     );
//   }, [all, q]);

//   function select(idStr: string) {
//     const id = Number(idStr);
//     const cli = all.find((c) => c.id === id);
//     setValue(id);
//     onChange?.(id, cli);
//     setOpen(false);
//   }

//   return (
//     <div className="flex flex-col">
//       <label className="text-sm text-gray-700 mb-1 block">
//         {label}{required ? ' *' : ''}
//       </label>

//       <div className="relative">
//         <button
//           type="button"
//           className="w-full border border-[#007cb2] rounded px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-[#007cb2] flex items-center justify-between"
//           onClick={() => setOpen((s) => !s)}
//         >
//           <span>
//             {loading
//               ? 'Carregando...'
//               : value
//               ? all.find((c) => c.id === value)?.razaoSocial ?? 'Selecionar...'
//               : 'Selecionar...'}
//           </span>
//           <FaChevronDown className={`transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} />
//         </button>

//         {open && (
//           <div className="absolute z-10 mt-1 w-full bg-white rounded border shadow">
//             <div className="p-2">
//               <input
//                 autoFocus
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
//                 placeholder="Buscar cliente..."
//               />
//             </div>
//             <div className="max-h-60 overflow-auto">
//               {filtered.length === 0 ? (
//                 <div className="px-3 py-2 text-sm text-gray-500">Nada encontrado</div>
//               ) : (
//                 filtered.map((c) => (
//                   <button
//                     key={c.id}
//                     className="w-full text-left px-3 py-2 hover:bg-[#c4f9ff]"
//                     onClick={() => select(String(c.id))}
//                   >
//                     <div className="font-medium">{c.razaoSocial}</div>
//                     <div className="text-xs text-gray-500">
//                       {c.cidade ?? '—'}
//                       {c.ficha ? ` • Ficha: ${c.ficha}` : ''}
//                     </div>
//                   </button>
//                 ))
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


'use client';

import { useEffect, useState } from 'react';
import { listUsuarios, Usuario } from '../core/operador';

type Props = {
  titulo?: string;
  /** Pré-seleção (id) — ex.: edição ou usuário logado */
  initialOperadorId?: number;
  /** callback com o id selecionado (ou null) */
  onChange: (id: number | null) => void;
  className?: string;
  required?: boolean;
};

export default function OperadorSelect({
  titulo = 'Operador:',
  initialOperadorId,
  onChange,
  className,
  required,
}: Props) {
  const [operadores, setOperadores] = useState<Usuario[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [open, setOpen] = useState(false); // controla rotação do chevron

  useEffect(() => {
    (async () => {
      try {
        const list = await listUsuarios();
        setOperadores(list);
        // seta seleção inicial, se houver
        if (initialOperadorId && list.some((o) => o.id === initialOperadorId)) {
          setSelectedId(String(initialOperadorId));
          onChange(initialOperadorId);
        }
      } catch (e) {
        console.error('Erro ao buscar operadores:', e);
      }
    })();
  }, [initialOperadorId, onChange]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedId(val);
    onChange(val ? Number(val) : null);
  }

  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      <label className="text-sm font-medium text-slate-700 mb-1">{titulo}</label>
      <div className="relative">
        <select
          value={selectedId}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          required={required}
          className="appearance-none block w-full px-3 py-2 bg-white border border-[#007cb2] rounded-md text-sm shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-[#007cb2] pr-9"
        >
          <option value="">Selecione um operador</option>
          {operadores.map((op) => (
            <option key={op.id} value={op.id}>
              {op.nome}
            </option>
          ))}
        </select>

        {/* Chevron */}
        <div
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 ${
            open ? 'rotate-180' : 'rotate-0'
          } text-gray-500`}
          aria-hidden
        >
          ▼
        </div>
      </div>
    </div>
  );
}

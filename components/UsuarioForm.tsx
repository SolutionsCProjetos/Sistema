'use client';

import { useEffect, useState } from 'react';
import { UpsertUsuarioInput, Usuario, getUsuario, upsertUsuario } from '../core/usuarios';

// Se você já tem um componente para selecionar Setor (tipo o Buscar antigo),
// recomendo criar um SetorSelect nesse padrão de arquitetura.
// Aqui vai uma interface mínima opcional:
type SetorSelectProps = {
  label?: string;
  initialId?: number;
  onChange?: (id: number | null) => void;
};
function SetorSelect({ label = 'Setor', initialId, onChange }: SetorSelectProps) {
  // adapte para buscar seus setores reais
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | ''>(initialId ?? '');
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <select
          className="w-full h-10 px-3 py-2 pr-10 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2] appearance-none"
          value={value}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : '';
            setValue(v);
            onChange?.(v === '' ? null : v);
            setOpen(false);
          }}
          onMouseDown={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <option value="">Selecione…</option>
          {/* Preencha com seus setores reais */}
          <option value="1">Financeiro</option>
          <option value="2">Vendas</option>
          <option value="3">Logística</option>
        </select>
        <span
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
        >
          ▼
        </span>
      </div>
    </div>
  );
}

type Props = {
  editingId?: number;
  initial?: Partial<Usuario>;
  onSaved?: (msg?: string) => void;
  onCancel?: () => void;
};

export default function UsuarioForm({ editingId, initial, onSaved, onCancel }: Props) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [senha, setSenha] = useState(''); // opcional em edição
  const [rule, setRule] = useState<'0' | '1' | '2'>((initial?.rule as any) ?? '0');
  const [setorId, setSetorId] = useState<number | null>(initial?.setor?.id ?? null);

  const [loading, setLoading] = useState<boolean>(!!editingId);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'warn' } | null>(null);

  // chevron control para "rule"
  const [ruleOpen, setRuleOpen] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        const data = await getUsuario(editingId);
        setNome(data.nome);
        setEmail(data.email);
        setRule(data.rule);
        setSetorId(data.setor?.id ?? null);
      } catch (e: any) {
        setToast({ text: e?.message ?? 'Erro ao carregar usuário', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [editingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setToast({ text: 'O nome é obrigatório.', type: 'warn' });
    if (!email.trim()) return setToast({ text: 'O e-mail é obrigatório.', type: 'warn' });

    const payload: UpsertUsuarioInput = {
      id: editingId,
      nome,
      email,
      senha: senha || undefined, // manda só se informou
      rule,
      empresa: null,
      setorId,
    };

    setWorking(true);
    try {
      await upsertUsuario(payload);
      setToast({ text: editingId ? 'Usuário atualizado!' : 'Usuário criado!', type: 'success' });
      onSaved?.(editingId ? 'updated' : 'created');
    } catch (e: any) {
      setToast({ text: e?.message ?? 'Erro ao salvar', type: 'error' });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h2 className="text-xl lg:text-2xl font-bold text-[#17686f] mb-4">
        {editingId ? 'Atualizar Usuário' : 'Novo Usuário'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {loading ? (
          <div className="text-[#007cb2]">Carregando…</div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 sm:grid-cols-1 gap-4">
              {/* Nome */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Nome *</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  placeholder="Nome do usuário"
                />
              </div>

              {/* E-mail */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  placeholder="email@dominio.com"
                />
              </div>

              {/* Senha (opcional no update) */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Senha {editingId ? '(opcional)' : '*'}</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2]"
                  placeholder="*******"
                />
              </div>

              {/* Rule (com chevron animado) */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Tipo de Usuário *</label>
                <div className="relative">
                  <select
                    className="w-full h-10 px-3 py-2 pr-10 border border-[#007cb2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#007cb2] appearance-none"
                    value={rule}
                    onChange={(e) => {
                      setRule(e.target.value as '0' | '1' | '2');
                      setRuleOpen(false);
                    }}
                    onMouseDown={() => setRuleOpen(true)}
                    onBlur={() => setRuleOpen(false)}
                  >
                    <option value="0">Padrão</option>
                    <option value="1">Administrador</option>
                    <option value="2">Recrutador</option>
                  </select>
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${
                      ruleOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Setor (componente select com chevron) */}
              <SetorSelect
                label="Setor"
                initialId={typeof initial?.setor?.id === 'number' ? initial?.setor?.id : undefined}
                onChange={(id) => setSetorId(id)}
              />
            </div>

            <div className="flex justify-end gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                  disabled={working}
                >
                  Voltar
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[#007cb2] text-white hover:bg-[#00689c] disabled:opacity-60"
                disabled={working}
              >
                {working ? 'Gravando…' : 'Gravar'}
              </button>
            </div>
          </>
        )}
      </form>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow z-50 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-yellow-500 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

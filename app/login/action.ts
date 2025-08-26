'use server';

import { loginCore } from "../../core/auth";

export type LoginInput = { email: string; senha: string };
export type LoginResult =
  | { ok: true; token: string }
  | { ok: false; message: string };

export async function loginAction(payload: LoginInput): Promise<LoginResult> {
  try {
    const result = await loginCore(payload);
    return result;
  } catch (e) {
    return { ok: false, message: 'Erro inesperado ao tentar logar.' };
  }
}

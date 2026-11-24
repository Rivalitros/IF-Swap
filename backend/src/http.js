import { z } from 'zod';

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const id = z.coerce.number().int().positive().max(2147483647);
export const text = (max, min = 1) => z.string().trim().min(min).max(max);
export const databaseMessage = 'Não foi possível conectar ao banco de dados. Verifique se o PostgreSQL está iniciado.';

export function publicError(error) {
  if (error instanceof AppError) return { status: error.status, message: error.message };
  if (error instanceof z.ZodError) {
    const path = error.issues[0]?.path.join('.');
    return { status: 400, message: path ? `Verifique o campo ${path}.` : 'Verifique os dados informados.' };
  }
  if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '57P01', '57P03', '3D000', '28P01'].includes(error.code)
      || error.message?.includes('Connection terminated') || error.message?.includes('timeout')) {
    return { status: 503, message: databaseMessage };
  }
  if (error.code === '23505') return { status: 409, message: 'Já existe um registro com esses dados.' };
  if (error.code === 'LIMIT_FILE_SIZE') return { status: 413, message: 'A foto pode ter até 3 MB.' };
  if (error.name === 'MulterError' || [400, 413, 415].includes(error.status)) {
    return { status: error.status || 400, message: 'Formato ou tamanho inválido.' };
  }
  console.error(error);
  return { status: 500, message: 'Ocorreu um erro ao processar a operação.' };
}

export function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return req.headers['sec-fetch-site'] !== 'cross-site';
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

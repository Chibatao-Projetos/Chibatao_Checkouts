/**
 * Serialização de datas compatível com o backend .NET anterior:
 * - INSTANTES (DataSolicitacao, HoraSaida/Retorno, DataAprovacao*, DataCadastro, DataCriacao):
 *   saem em UTC ISO com 'Z' → o frontend converte para o fuso local.
 * - DATAS DE CALENDÁRIO (DataSaida, DataPrevistaRetorno): saem SEM 'Z' (naive),
 *   para não deslocar o dia.
 *
 * Observação: as colunas são `timestamp without time zone`; o Prisma as lê como Date
 * tratando o valor como UTC. Assim, os componentes UTC do Date correspondem ao
 * wall-clock armazenado.
 */
const pad = (n: number) => String(n).padStart(2, '0');

export function toInstant(d?: Date | null): string | undefined {
  if (!d || isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function toNaive(d?: Date | null): string | undefined {
  if (!d || isNaN(d.getTime()) || d.getUTCFullYear() < 1971) return undefined;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/** Interpreta um wall-clock ('YYYY-MM-DD', 'YYYY-MM-DDTHH:mm' ou com segundos) como UTC. */
export function parseNaive(s: string): Date {
  let v = (s ?? '').trim();
  if (v.length === 10) v += 'T00:00:00';
  else if (v.length === 16) v += ':00';
  return new Date(v + 'Z');
}

/** Início/fim do dia (UTC) a partir de 'YYYY-MM-DD', para filtros de período. */
export function startOfDay(s: string): Date {
  return new Date(s.slice(0, 10) + 'T00:00:00Z');
}
export function endOfDay(s: string): Date {
  return new Date(s.slice(0, 10) + 'T23:59:59Z');
}

/**
 * Validação de CPF — algoritmo dos dígitos verificadores.
 * Usado no PaymentDataModal pra rejeitar CPF inválido localmente,
 * sem precisar bater no Asaas pra descobrir.
 *
 * Não confunde com `formatCPF` (visual) — esta função só valida.
 */

export const cleanCPF = (value: string): string => value.replace(/\D/g, "");

export const formatCPF = (value: string): string => {
  const cleaned = cleanCPF(value).slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d+)/, "$1.$2");
  if (cleaned.length <= 9) return cleaned.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
};

export const isValidCPF = (value: string): boolean => {
  const cpf = cleanCPF(value);
  if (cpf.length !== 11) return false;
  // CPFs com todos os dígitos iguais (111.111.111-11 etc) são tecnicamente válidos
  // pelo algoritmo, mas bloqueados pela Receita.
  if (/^(\d)\1+$/.test(cpf)) return false;

  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let check1 = (sum * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== Number(cpf[9])) return false;

  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let check2 = (sum * 10) % 11;
  if (check2 === 10) check2 = 0;
  if (check2 !== Number(cpf[10])) return false;

  return true;
};

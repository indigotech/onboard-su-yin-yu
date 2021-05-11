import { GraphQLError } from 'graphql';

export abstract class BaseError extends Error {
  public readonly base: boolean = true;
  public code: number;
  public detail?: string;
  constructor(message: string, code = 500, detail?: string) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

export class AuthError extends BaseError {
  constructor(message = errorMessage.invalidLogin, detail?: string) {
    super(message, 401, detail);
  }
}

export class InternalError extends BaseError {
  constructor(message = errorMessage.internal, detail?: string) {
    super(message, 500, detail);
  }
}

export class InputError extends BaseError {
  constructor(message = errorMessage.userInput, detail?: string) {
    super(message, 400, detail);
  }
}

export function formatError(error: GraphQLError) {
  const originalError = error.originalError;

  if ((originalError as BaseError)?.base) {
    const baseError = originalError as BaseError;
    return {
      message: baseError.message,
      code: baseError.code,
      detail: baseError.detail,
    };
  } else {
    return {
      message: 'Ocorreu um erro interno. Tente novamente.',
      code: 500,
      detail: error.message,
    };
  }
}

export const errorMessage = {
  email: 'Este e-mail já está cadastrado. Tente outro e-mail.',
  passwordPattern: 'A senha deve conter letras e números.',
  shortPassword: 'A senha deve ter pelo menos 7 caracteres.',
  invalidLogin: 'Credenciais inválidas.',
  internal: 'Ocorreu um erro. Tente novamente.',
  userInput: 'Erro no preenchimento dos dados. Tente novamente.'
};

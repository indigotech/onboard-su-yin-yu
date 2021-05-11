export interface UserInput {
  name: string;
  email: string;
  password: string;
  birthDate: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  birthDate: string;
}

export interface CreateUserMutation {
  data: UserInput;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthPayload {
  db_user: User;
  token: string;
}

export function checkPasswordLength(password: string): boolean {
  const MIN_LENGTH = 7;
  return password.length >= MIN_LENGTH;
}

export function checkPasswordPattern(password: string): boolean {
  const containsLetterAndDigit = new RegExp(/^(?=.*[a-zA-Z])(?=.*[0-9])/);
  return containsLetterAndDigit.test(password);
}

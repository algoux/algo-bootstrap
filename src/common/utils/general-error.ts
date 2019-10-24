export interface GeneralError extends Error {
  code: number;
}

export default function generalError(code: number, e: Error) {
  // @ts-ignore
  const err: GeneralError = e;
  err.code = code;
  return err;
}

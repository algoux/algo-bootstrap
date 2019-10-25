export interface GeneralError extends Error {
  retCode: number;
}

export default function generalError(code: number, e: Error) {
  // @ts-ignore
  const err: GeneralError = e;
  err.retCode = code;
  return err;
}

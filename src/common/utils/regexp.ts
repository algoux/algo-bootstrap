export function matchOne(reg: RegExp, str: string) {
  const regResult = reg.exec(str);
  if (regResult && regResult[1]) {
    return regResult[1].trim();
  }
  return null;
}

export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // $&表示整个被匹配的字符串
}

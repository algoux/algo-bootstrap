export function sleep(time: number) {
  return new Promise((resolve, _reject) => {
    setTimeout(() => resolve(), time || 0);
  });
}

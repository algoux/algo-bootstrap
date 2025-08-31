export default function setStatePromise(state: any): Promise<void> {
  return new Promise((resolve) => {
    // @ts-ignore
    this.setState(state, resolve);
  });
}

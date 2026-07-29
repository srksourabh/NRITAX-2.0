export function mockDelay(milliseconds = 500) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds);
  });
}

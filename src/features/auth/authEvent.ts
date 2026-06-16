export function deferAuthEvent(handler: () => Promise<void>): void {
  setTimeout(() => {
    void handler();
  }, 0);
}

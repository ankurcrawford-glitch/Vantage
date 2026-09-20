/** One in-flight write per editor. A rejected job does not poison later jobs. */
export class EssaySaveQueue {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(job: () => Promise<T>): Promise<T> {
    const result = this.tail.then(job);
    this.tail = result.catch(() => undefined);
    return result;
  }
}
export function countEssayWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

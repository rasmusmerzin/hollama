export interface Subject<T> {
  addEventListener(
    type: "change",
    listener: (event: SubjectChangeEvent<T>) => any,
    options?: AddEventListenerOptions | boolean,
  ): void;
  addEventListener(
    type: string,
    listener: (event: Event) => any,
    options?: AddEventListenerOptions | boolean,
  ): void;
}

export class Subject<T> extends EventTarget {
  constructor(private value: T) {
    super();
  }

  current() {
    return this.value;
  }

  next(value: T) {
    const previous = this.value;
    this.value = value;
    this.dispatchEvent(new SubjectChangeEvent(value, previous));
    return this.value;
  }

  update(predicate: (value: T) => T) {
    return this.next(predicate(this.value));
  }

  subscribe(
    listener: (value: T, previous?: T) => any,
    control: AbortController | null,
  ) {
    this.addEventListener(
      "change",
      (e) => listener(e.current, e.previous),
      control || undefined,
    );
    listener(this.value);
  }
}

export class SubjectChangeEvent<T> extends Event {
  constructor(
    readonly current: T,
    readonly previous: T,
  ) {
    super("change");
  }
}

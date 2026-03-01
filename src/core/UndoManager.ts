export interface UndoState {
  value: string;
  cursorStart: number;
  cursorEnd: number;
}

export class UndoManager {
  private stack: UndoState[] = [];
  private pointer = -1;
  private maxSteps: number;

  constructor(maxSteps = 100) {
    this.maxSteps = maxSteps;
  }

  push(state: UndoState): void {
    // Discard any redo states after current pointer
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(state);

    // Enforce max limit
    if (this.stack.length > this.maxSteps) {
      this.stack.shift();
    }

    this.pointer = this.stack.length - 1;
  }

  undo(): UndoState | null {
    if (this.pointer <= 0) return null;
    this.pointer--;
    return this.stack[this.pointer];
  }

  redo(): UndoState | null {
    if (this.pointer >= this.stack.length - 1) return null;
    this.pointer++;
    return this.stack[this.pointer];
  }

  canUndo(): boolean {
    return this.pointer > 0;
  }

  canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  clear(): void {
    this.stack = [];
    this.pointer = -1;
  }
}

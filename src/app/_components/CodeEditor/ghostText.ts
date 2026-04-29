import { Decoration, DecorationSet, WidgetType, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { StateField, StateEffect, EditorState, Transaction, Facet } from "@codemirror/state";
import { keymap } from "@codemirror/view";

// --- Effects & Fields ---

export const setGhostText = StateEffect.define<string | null>();

export const ghostTextField = StateField.define<string | null>({
  create: () => null,
  update(value, tr) {
    for (let e of tr.effects) if (e.is(setGhostText)) return e.value;
    // Clear ghost text on any document change that isn't from the AI
    if (tr.docChanged && !tr.annotation(Transaction.userEvent.of("ai"))) return null;
    return value;
  }
});

// --- Widget Rendering ---

class GhostWidget extends WidgetType {
  constructor(readonly text: string) { super(); }
  eq(other: GhostWidget) { return other.text === this.text; }
  toDOM() {
    let span = document.createElement("span");
    span.style.color = "#4b5563"; // slate-600 (grey)
    span.style.fontStyle = "italic";
    span.style.pointerEvents = "none";
    span.style.userSelect = "none";
    span.textContent = this.text;
    return span;
  }
}

// --- View Plugin ---

export const ghostTextPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.getDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.selectionSet || update.transactions.some(tr => tr.effects.some(e => e.is(setGhostText)))) {
      this.decorations = this.getDecorations(update.view);
    }
  }

  getDecorations(view: EditorView) {
    let ghost = view.state.field(ghostTextField);
    if (!ghost) return Decoration.none;

    let pos = view.state.selection.main.head;
    return Decoration.set([
      Decoration.widget({
        widget: new GhostWidget(ghost),
        side: 1
      }).range(pos)
    ]);
  }
}, {
  decorations: v => v.decorations
});

// --- Tab Acceptance ---

export const acceptGhostText = (view: EditorView) => {
  let ghost = view.state.field(ghostTextField);
  if (!ghost) return false;

  let pos = view.state.selection.main.head;
  view.dispatch({
    changes: { from: pos, insert: ghost },
    selection: { anchor: pos + ghost.length },
    effects: setGhostText.of(null),
    annotations: Transaction.userEvent.of("ai")
  });
  return true;
};

// --- Combined Extension ---

export const ghostTextExtension = [
  ghostTextField,
  ghostTextPlugin,
  keymap.of([{
    key: "Tab",
    run: acceptGhostText
  }])
];

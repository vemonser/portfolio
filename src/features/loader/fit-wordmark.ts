const BASE_SIZE = 100;

export function fitWordmark(els: {
  word: HTMLElement;
  line: HTMLElement;
  measure: HTMLElement;
  countBox: HTMLElement;
  letters: HTMLElement[];
}): () => void {
  const { word, line, measure, countBox, letters } = els;

  const layout = () => {
    const width = word.clientWidth;
    const nodes = Array.from(measure.children) as HTMLElement[];
    if (!width || nodes.length !== letters.length) return;

    const rects = nodes.map((n) => n.getBoundingClientRect());
    const inkWidth = rects[rects.length - 1].right - rects[0].left;
    if (!inkWidth) return;

    let size = (BASE_SIZE * width) / inkWidth;
    line.style.fontSize = `${size}px`;

    for (let pass = 0; pass < 2; pass += 1) {
      const first = letters[0].getBoundingClientRect();
      const last = letters[letters.length - 1].getBoundingClientRect();
      const ink = last.right - first.left;
      if (!ink || Math.abs(ink - width) < 0.2) break;
      size *= width / ink;
      line.style.fontSize = `${size}px`;
    }

    // Counter sits just above the wordmark's cap line (measured on
    // crz.studio: counter top = word top + ~8.4% of the word height). Lift it
    // by its own height so it clears the letters instead of overlapping them.
    const counterH = countBox.offsetHeight || 16;
    countBox.style.insetBlockStart = `${size * 0.084 - counterH}px`;
  };

  layout();
  document.fonts?.ready.then(layout, layout);
  window.addEventListener("resize", layout);
  return () => window.removeEventListener("resize", layout);
}
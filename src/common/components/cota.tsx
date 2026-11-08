// Cota a lápiz, como en el cuaderno: «├── 120 cm ──┤» (o en vertical, al
// lado). Decorativa: quien la usa dice las medidas también en texto.
export function Cota({ texto, vertical = false }: { texto: string; vertical?: boolean }) {
  const tramo = vertical ? "w-px flex-1 bg-lapiz" : "h-px flex-1 bg-lapiz";
  const tope = vertical ? "h-px w-2 bg-lapiz" : "h-2 w-px bg-lapiz";
  return (
    <span aria-hidden="true" className={`flex items-center gap-1 text-xs text-tinta-suave tabular-nums ${vertical ? "flex-col" : ""}`}>
      <span className={tope} />
      <span className={tramo} />
      <span className={vertical ? "[writing-mode:vertical-rl]" : ""}>{texto}</span>
      <span className={tramo} />
      <span className={tope} />
    </span>
  );
}

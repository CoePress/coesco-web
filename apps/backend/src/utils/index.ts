export function deriveTableNames(modelName: string): string[] {
  const snake = modelName.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

  const plural = snake.replace(/([^_]+)$/, (w) => {
    if (w.endsWith("s"))
      return w;
    if (w.endsWith("y"))
      return `${w.slice(0, -1)}ies`;
    if (w.endsWith("ss"))
      return `${w}es`;
    if (/(?:x|ch|sh)$/.test(w))
      return `${w}es`;
    return `${w}s`;
  });

  return plural === snake ? [snake] : [snake, plural];
}

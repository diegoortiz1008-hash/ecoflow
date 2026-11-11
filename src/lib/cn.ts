/** Une clases condicionales (equivalente mínimo a `clsx`). */
export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

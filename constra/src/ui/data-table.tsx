export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "right";
};

export function DataTable<T extends { id?: string | number }>({
  columns,
  rows,
  empty = "Nothing here yet.",
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="constra-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={c.align === "right" ? "text-right" : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r.id ?? `${c0(i)}`)}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={c.align === "right" ? "text-right" : undefined}
                >
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-sm text-slate-500"
              >
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function c0(i: number): string {
  return `row-${i}`;
}

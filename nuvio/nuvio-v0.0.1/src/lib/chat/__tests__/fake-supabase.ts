/**
 * Fake de Supabase para los tests del módulo de chat.
 *
 * Implementa el subconjunto de la API usado por chat-db y study-context:
 * select/insert/update/delete + eq/order + single/maybeSingle, con estado
 * por tabla. No mockea el módulo real; se inyecta como dependencia.
 */

export type Row = Record<string, unknown>;

export type FakeInit = {
  user?: { id: string } | null;
  tables?: Record<string, Row[]>;
};

type Result = { data: Row[] | Row | null; error: { message: string } | null };

export function createFakeSupabase(initial: FakeInit = {}) {
  const tables = new Map<string, Row[]>();
  for (const [name, rows] of Object.entries(initial.tables ?? {})) {
    tables.set(name, rows.map((r) => ({ ...r })));
  }
  const authUser = initial.user ?? null;
  const calls: string[] = [];

  function from(table: string) {
    calls.push(`from(${table})`);
    const filters: { col: string; val: unknown }[] = [];
    let orderBy: { col: string; asc: boolean } | null = null;
    let pendingOp: "select" | "insert" | "update" | "delete" = "select";
    let payload: Row[] | Row | null = null;

    const getRows = () => tables.get(table) ?? [];
    const matches = (row: Row) => filters.every((f) => row[f.col] === f.val);

    const ordered = (rows: Row[]) => {
      if (!orderBy) return rows;
      const { col, asc } = orderBy;
      return [...rows].sort((a, b) => {
        const av = String(a[col] ?? "");
        const bv = String(b[col] ?? "");
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return asc ? cmp : -cmp;
      });
    };

    // Ejecuta la operación pendiente y devuelve las filas afectadas.
    function execute(): Row[] {
      if (pendingOp === "insert") {
        const list = Array.isArray(payload) ? payload : payload ? [payload] : [];
        const inserted = list.map((r) => ({ ...r }));
        getRows().push(...inserted.map((r) => ({ ...r })));
        return inserted;
      }
      if (pendingOp === "update") {
        const affected = getRows().filter(matches);
        for (const r of affected) Object.assign(r, payload ?? {});
        return affected.map((r) => ({ ...r }));
      }
      if (pendingOp === "delete") {
        const remaining = getRows().filter((r) => !matches(r));
        tables.set(table, remaining);
        return [];
      }
      // select
      return ordered(getRows().filter(matches)).map((r) => ({ ...r }));
    }

    // Track whether single/maybeSingle already executed to prevent
    // then() from running execute() a second time when the builder
    // is awaited (the builder is thenable).
    let resolved: Result | null = null;

    const q = {
      eq(col: string, val: unknown) {
        filters.push({ col, val });
        return q;
      },
      select() {
        return q;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orderBy = { col, asc: opts?.ascending ?? true };
        return q;
      },
      insert(rows: Row | Row[]) {
        pendingOp = "insert";
        payload = rows;
        return q;
      },
      update(obj: Row) {
        pendingOp = "update";
        payload = obj;
        return q;
      },
      delete() {
        pendingOp = "delete";
        return q;
      },
      single() {
        const rows = execute();
        // Real Supabase single() devuelve un único objeto, no un array.
        // Resultado vacío → data null sin error, para que el código decida
        // el error de dominio (not_found) en vez de un genérico db_error.
        resolved = { data: rows[0] ?? null, error: null };
        return resolved;
      },
      maybeSingle() {
        const rows = execute();
        resolved = { data: rows[0] ?? null, error: null };
        return resolved;
      },
      then(onF: (v: unknown) => unknown) {
        if (resolved) return onF(resolved);
        const rows = execute();
        return onF({ data: rows, error: null });
      },
    };
    return q;
  }

  return {
    calls,
    tables,
    auth: {
      getUser: async () => ({ data: { user: authUser } }),
    },
    from,
    storage: {
      from: () => ({
        remove: async () => ({ data: null, error: null }),
      }),
    },
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;

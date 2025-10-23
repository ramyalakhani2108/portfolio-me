// This file is deprecated - please use src/lib/db.ts for database connections
// Kept for backward compatibility during migration

import { db, storage as libStorage } from "../src/lib/db";

// Small chainable query wrapper to mimic Supabase query builder
function fromWrapper(table: string) {
  const state: any = {
    columns: "*",
    filters: {},
    limit: undefined,
    order: undefined,
    singleFlag: false,
  };

  const wrapper: any = {
    select(columns = "*") {
      state.columns = columns;
      return wrapper;
    },
    eq(column: string, value: any) {
      state.filters[column] = value;
      return wrapper;
    },
    order(column: string, opts?: { ascending?: boolean }) {
      state.order = { column, ascending: opts?.ascending ?? true };
      return wrapper;
    },
    limit(n: number) {
      state.limit = n;
      return wrapper;
    },
    single() {
      state.singleFlag = true;
      return wrapper.execute();
    },
    // Terminal execution method used by await
    async execute() {
      // Use db.from to fetch data (server-side handles paging). We'll apply filters client-side.
      // Build the query chain
      let query = db.from(table).select(state.columns);
      
      if (state.order) {
        query = query.order(state.order.column, { ascending: state.order.ascending });
      }
      if (state.limit) {
        query = query.limit(state.limit);
      }
      if (state.singleFlag) {
        query = query.single();
      }

      const res = await query;
      if (res.error) return { data: null, error: res.error };

      let rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];

      // Apply simple equality filters client-side
      if (state.filters && Object.keys(state.filters).length > 0) {
        rows = rows.filter((r: any) => {
          return Object.entries(state.filters).every(([k, v]) => r?.[k] === v);
        });
      }

      if (state.singleFlag) {
        return { data: rows[0] ?? null, error: null };
      }

      return { data: rows, error: null };
    },
    // Mutations delegate to db
    async insert(data: any) {
      return db.from(table).insert(data);
    },
    async upsert(data: any) {
      return db.from(table).upsert(data);
    },
    update(data: any) {
      return db.from(table).update(data);
    },
    delete() {
      return db.from(table).delete();
    },
    // Make wrapper awaitable
    then(resolve: any, reject: any) {
      return wrapper.execute().then(resolve, reject);
    }
  };

  return wrapper;
}

export const supabase = {
  from: (table: string) => fromWrapper(table),
  storage: {
    from: (bucket: string) => ({
      upload: libStorage.from(bucket).upload,
      getPublicUrl: libStorage.from(bucket).getPublicUrl,
      remove: async (paths: string[]) => {
        console.warn('Storage.remove called on compatibility shim - implement real storage if needed');
        return { data: null, error: null };
      }
    })
  },
  // Legacy auth methods - these are now handled in src/lib/auth.ts
  auth: {
    // Flexible legacy methods
    getSession: (..._args: any[]) => {
      console.warn('supabase.auth.getSession is deprecated. Use lib/auth.ts instead');
      return Promise.resolve({ data: { session: null }, error: null });
    },
    refreshSession: (..._args: any[]) => {
      console.warn('supabase.auth.refreshSession is deprecated. Use lib/auth.ts instead');
      return Promise.resolve({ data: { session: null }, error: null });
    },
    getUser: (..._args: any[]) => {
      console.warn('supabase.auth.getUser is deprecated. Use lib/auth.ts instead');
      return Promise.resolve({ data: { user: null }, error: null });
    },
    onAuthStateChange: (_callback?: (...args: any[]) => void) => {
      console.warn('supabase.auth.onAuthStateChange is deprecated. Use lib/auth.ts instead');
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signUp: (..._args: any[]) => {
      console.warn('supabase.auth.signUp is deprecated. Use lib/auth.ts instead');
      return Promise.resolve({ data: null, error: { message: 'Use lib/auth.ts' } });
    },
    signInWithPassword: (..._args: any[]) => {
      console.warn('supabase.auth.signInWithPassword is deprecated. Use lib/auth.ts instead');
      return Promise.resolve({ data: null, error: { message: 'Use lib/auth.ts' } });
    },
    signOut: (..._args: any[]) => {
      console.warn('supabase.auth.signOut is deprecated. Use lib/auth.ts instead');
      return Promise.resolve({ data: null, error: null });
    }
  }
};

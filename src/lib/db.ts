// API endpoint for backend server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fetch helper function
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Request failed' } };
    }

    return data;
  } catch (error: any) {
    console.error('API request error:', error);
    return { data: null, error: { message: error.message } };
  }
};

// Query helper function (for compatibility with existing code)
export const query = async (text: string, params?: any[]): Promise<any> => {
  console.warn('Direct query() calls are not supported in browser. Use db.from() instead.');
  return { rows: [], rowCount: 0 };
};

// Database helper functions to mimic Supabase API with chainable methods
export const db = {
  from: (table: string) => {
    // Query state
    let queryParams: Record<string, any> = {};
    
    const buildQueryString = () => {
      const params = new URLSearchParams();
      
      if (queryParams.limit) {
        params.append('limit', queryParams.limit.toString());
      }
      
      if (queryParams.order_column) {
        params.append('order_by', queryParams.order_column);
        params.append('order_dir', queryParams.order_ascending ? 'ASC' : 'DESC');
      }
      
      if (queryParams.single) {
        params.append('limit', '1');
      }
      
      const queryString = params.toString();
      return queryString ? `?${queryString}` : '';
    };
    
    const executeQuery = async () => {
      try {
        let endpoint = `/db/${table}${buildQueryString()}`;
        
        // Add filter if present
        if (queryParams.filter_column) {
          const separator = endpoint.includes('?') ? '&' : '?';
          endpoint += `${separator}${queryParams.filter_column}=${encodeURIComponent(queryParams.filter_value)}`;
        }

        const result = await apiFetch(endpoint);
        
        if (result.error) {
          return { data: null, error: result.error };
        }
        
        if (queryParams.single) {
          return {
            data: result.data?.[0] || null,
            error: null
          };
        }
        
        return {
          data: result.data || [],
          error: null,
          count: result.data?.length || 0
        };
      } catch (error: any) {
        return {
          data: null,
          error: { message: error.message }
        };
      }
    };
    
    return {
            // SELECT operation
      select: (columns: string = '*') => {
        const promise = Promise.resolve().then(() => executeQuery());
        const chainable: any = {
          order: (column: string, options?: { ascending?: boolean; }) => {
            queryParams.order_column = column;
            queryParams.order_ascending = options?.ascending !== false;
            return chainable;
          },
          limit: (count: number) => {
            queryParams.limit = count;
            return chainable;
          },
          single: () => {
            queryParams.single = true;
            return chainable;
          },
          eq: (column: string, value: any) => {
            queryParams.filter_column = column;
            queryParams.filter_value = value;
            return chainable;
          },
          // Make it a full Promise-like
          then: (resolve: any, reject: any) => promise.then(resolve, reject),
          catch: (reject: any) => promise.catch(reject),
          finally: (onFinally: any) => promise.finally(onFinally),
          [Symbol.toStringTag]: 'Promise',
        };
        return chainable;
      },
      
      // INSERT operation
      insert: (data: any | any[]) => {
        let returnSingle = false;
        
        const chainable: any = {
          select: () => chainable,
          single: () => {
            returnSingle = true;
            return chainable;
          },
          then: async (resolve: any, reject: any) => {
            const records = Array.isArray(data) ? data : [data];
            
            if (records.length === 0) {
              resolve({ data: null, error: { message: 'No data to insert' } });
              return;
            }
            
            try {
              const results = [];
              for (const record of records) {
                const result = await apiFetch(`/db/${table}`, {
                  method: 'POST',
                  body: JSON.stringify(record),
                });
                
                if (result.error) {
                  resolve({ data: null, error: result.error });
                  return;
                }
                
                results.push(result.data?.[0]);
              }
              
              if (returnSingle) {
                resolve({
                  data: results[0] || null,
                  error: null
                });
              } else {
                resolve({
                  data: Array.isArray(data) ? results : results[0],
                  error: null
                });
              }
            } catch (error: any) {
              resolve({
                data: null,
                error: { message: error.message }
              });
            }
          },
          catch: (reject: any) => Promise.resolve().then(() => chainable.then(()=>{})).catch(reject),
          finally: (onFinally: any) => Promise.resolve().then(() => chainable.then(()=>{})).finally(onFinally),
          [Symbol.toStringTag]: 'Promise',
        };
        return chainable;
      },
      
      // UPDATE operation
      update: (data: any) => {
        let updateColumn: string;
        let updateValue: any;
        
        const chainable: any = {
          eq: (column: string, value: any) => {
            updateColumn = column;
            updateValue = value;
            return chainable;
          },
          match: (conditions: Record<string, any>) => {
            updateColumn = 'id';
            updateValue = conditions.id;
            return chainable;
          },
          select: () => chainable,
          then: async (resolve: any, reject: any) => {
            if (!updateColumn) {
              resolve({
                data: null,
                error: { message: 'Column filter required for update (use .eq() or .match())' }
              });
              return;
            }
            
            try {
              const result = await apiFetch(`/db/${table}/${updateValue}`, {
                method: 'PUT',
                body: JSON.stringify(data),
              });
              
              resolve({
                data: result.data || [],
                error: result.error
              });
            } catch (error: any) {
              resolve({
                data: null,
                error: { message: error.message }
              });
            }
          },
          catch: (reject: any) => Promise.resolve().then(() => chainable.then(()=>{})).catch(reject),
          finally: (onFinally: any) => Promise.resolve().then(() => chainable.then(()=>{})).finally(onFinally),
          [Symbol.toStringTag]: 'Promise',
        };
        return chainable;
      },
      
      // UPSERT operation
      upsert: (data: any | any[], options?: { onConflict?: string }) => {
        const chainable: any = {
          select: () => chainable,
          then: async (resolve: any, reject: any) => {
            const records = Array.isArray(data) ? data : [data];
            
            if (records.length === 0) {
              resolve({ data: null, error: { message: 'No data to upsert' } });
              return;
            }
            
            try {
              const results = [];
              for (const record of records) {
                if (record.id) {
                  const updateResult = await apiFetch(`/db/${table}/${record.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(record),
                  });
                  
                  if (updateResult.data) {
                    results.push(updateResult.data[0]);
                    continue;
                  }
                }
                
                const insertResult = await apiFetch(`/db/${table}`, {
                  method: 'POST',
                  body: JSON.stringify(record),
                });
                
                if (insertResult.error) {
                  resolve({ data: null, error: insertResult.error });
                  return;
                }
                
                results.push(insertResult.data?.[0]);
              }
              
              resolve({
                data: Array.isArray(data) ? results : results[0],
                error: null
              });
            } catch (error: any) {
              resolve({
                data: null,
                error: { message: error.message }
              });
            }
          },
          catch: (reject: any) => Promise.resolve().then(() => chainable.then(()=>{})).catch(reject),
          finally: (onFinally: any) => Promise.resolve().then(() => chainable.then(()=>{})).finally(onFinally),
          [Symbol.toStringTag]: 'Promise',
        };
        return chainable;
      },
      
      // DELETE operation
      delete: () => {
        let deleteColumn: string;
        let deleteValue: any;
        
        const chainable: any = {
          eq: (column: string, value: any) => {
            deleteColumn = column;
            deleteValue = value;
            return chainable;
          },
          match: (conditions: Record<string, any>) => {
            deleteColumn = 'id';
            deleteValue = conditions.id;
            return chainable;
          },
          then: async (resolve: any, reject: any) => {
            if (!deleteColumn) {
              resolve({
                data: null,
                error: { message: 'Column filter required for delete (use .eq() or .match())' }
              });
              return;
            }
            
            try {
              const result = await apiFetch(`/db/${table}/${deleteValue}`, {
                method: 'DELETE',
              });
              
              resolve({
                data: result.data || [],
                error: result.error
              });
            } catch (error: any) {
              resolve({
                data: null,
                error: { message: error.message }
              });
            }
          },
          catch: (reject: any) => Promise.resolve().then(() => chainable.then(()=>{})).catch(reject),
          finally: (onFinally: any) => Promise.resolve().then(() => chainable.then(()=>{})).finally(onFinally),
          [Symbol.toStringTag]: 'Promise',
        };
        return chainable;
      }
    };
  }
};

// Storage mock (you'll need to implement file storage separately)
export const storage = {
  from: (bucket: string) => ({
    upload: async (path: string, file: File | Blob, options?: any) => {
      // You'll need to implement file storage (e.g., local filesystem, S3, etc.)
      console.warn('Storage upload not implemented. File storage needs to be configured.');
      return {
        data: { path },
        error: null
      };
    },
    getPublicUrl: (path: string) => {
      // Return a public URL for the file
      return {
        data: { publicUrl: `/uploads/${path}` }
      };
    }
  })
};

export default db;

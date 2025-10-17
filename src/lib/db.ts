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

// Database helper functions to mimic Supabase API
export const db = {
  // SELECT operations
  from: (table: string) => ({
    select: async (columns: string = '*', options?: { single?: boolean; limit?: number; order?: { column: string; ascending?: boolean } }) => {
      try {
        let endpoint = `/db/${table}?`;
        
        if (options?.limit) {
          endpoint += `limit=${options.limit}&`;
        }
        
        if (options?.order) {
          endpoint += `order_by=${options.order.column}&order_dir=${options.order.ascending ? 'ASC' : 'DESC'}`;
        }

        const result = await apiFetch(endpoint);
        
        if (result.error) {
          return { data: null, error: result.error };
        }
        
        if (options?.single) {
          return {
            data: result.data?.[0] || null,
            error: null
          };
        }
        
        return {
          data: result.data || [],
          error: null
        };
      } catch (error: any) {
        return {
          data: null,
          error: { message: error.message }
        };
      }
    },
    
    // INSERT operations
    insert: async (data: any | any[]) => {
      const records = Array.isArray(data) ? data : [data];
      
      if (records.length === 0) {
        return { data: null, error: { message: 'No data to insert' } };
      }
      
      try {
        // Insert each record individually
        const results = [];
        for (const record of records) {
          const result = await apiFetch(`/db/${table}`, {
            method: 'POST',
            body: JSON.stringify(record),
          });
          
          if (result.error) {
            return { data: null, error: result.error };
          }
          
          results.push(result.data?.[0]);
        }
        
        return {
          data: Array.isArray(data) ? results : results[0],
          error: null
        };
      } catch (error: any) {
        return {
          data: null,
          error: { message: error.message }
        };
      }
    },
    
    // UPDATE operations
    update: (data: any) => ({
      eq: async (column: string, value: any) => {
        try {
          const result = await apiFetch(`/db/${table}/${value}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
          
          return {
            data: result.data || [],
            error: result.error
          };
        } catch (error: any) {
          return {
            data: null,
            error: { message: error.message }
          };
        }
      },
      match: async (conditions: Record<string, any>) => {
        // For match, we use the id from conditions if available
        const id = conditions.id;
        if (!id) {
          return {
            data: null,
            error: { message: 'ID required for update' }
          };
        }
        
        try {
          const result = await apiFetch(`/db/${table}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
          
          return {
            data: result.data || [],
            error: result.error
          };
        } catch (error: any) {
          return {
            data: null,
            error: { message: error.message }
          };
        }
      }
    }),
    
    // UPSERT operations  
    upsert: async (data: any | any[], options?: { onConflict?: string }) => {
      const records = Array.isArray(data) ? data : [data];
      
      if (records.length === 0) {
        return { data: null, error: { message: 'No data to upsert' } };
      }
      
      try {
        const results = [];
        for (const record of records) {
          // Try to update first, if it fails, insert
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
          
          // If update failed or no id, insert
          const insertResult = await apiFetch(`/db/${table}`, {
            method: 'POST',
            body: JSON.stringify(record),
          });
          
          if (insertResult.error) {
            return { data: null, error: insertResult.error };
          }
          
          results.push(insertResult.data?.[0]);
        }
        
        return {
          data: Array.isArray(data) ? results : results[0],
          error: null
        };
      } catch (error: any) {
        return {
          data: null,
          error: { message: error.message }
        };
      }
    },
    
    // DELETE operations
    delete: () => ({
      eq: async (column: string, value: any) => {
        try {
          const result = await apiFetch(`/db/${table}/${value}`, {
            method: 'DELETE',
          });
          
          return {
            data: result.data || [],
            error: result.error
          };
        } catch (error: any) {
          return {
            data: null,
            error: { message: error.message }
          };
        }
      },
      match: async (conditions: Record<string, any>) => {
        const id = conditions.id;
        if (!id) {
          return {
            data: null,
            error: { message: 'ID required for delete' }
          };
        }
        
        try {
          const result = await apiFetch(`/db/${table}/${id}`, {
            method: 'DELETE',
          });
          
          return {
            data: result.data || [],
            error: result.error
          };
        } catch (error: any) {
          return {
            data: null,
            error: { message: error.message }
          };
        }
      }
    })
  })
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

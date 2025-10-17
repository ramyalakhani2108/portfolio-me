import { db } from "./db";

export async function testDatabaseConnection() {
  try {
    console.log("Testing PostgreSQL connection...");
    console.log(`Host: ${process.env.VITE_DB_HOST || 'localhost'}`);
    console.log(`Database: ${process.env.VITE_DB_NAME || 'portfolio_db'}`);

    // Test basic connection
    const { data, error } = await db
      .from("hire_sections")
      .select("id", { limit: 1 });

    if (error) {
      console.error("PostgreSQL connection error:", error);
      return { success: false, error: error.message };
    }

    console.log("PostgreSQL connection successful!");
    return { success: true, data };
  } catch (error: any) {
    console.error("Connection test failed:", error);
    return { success: false, error: error.message };
  }
}

// Legacy alias for backward compatibility
export const testSupabaseConnection = testDatabaseConnection;

// Test all required tables
export async function testAllTables() {
  const tables = [
    "hire_sections",
    "hire_skills",
    "hire_experience",
    "hire_contact_fields",
    "contact_submissions",
    "profiles",
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { data, error } = await db.from(table).select("*", { limit: 1 });

      results.push({
        table,
        success: !error,
        error: error?.message,
        hasData: data && Array.isArray(data) && data.length > 0,
      });
    } catch (error: any) {
      results.push({
        table,
        success: false,
        error: error.message,
        hasData: false,
      });
    }
  }

  return results;
}

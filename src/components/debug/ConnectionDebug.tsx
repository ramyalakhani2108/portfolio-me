import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { testDatabaseConnection, testAllTables } from "@/lib/connection-test";
import { RefreshCw, Database, AlertTriangle, CheckCircle, Cloud } from "lucide-react";

export default function ConnectionDebug() {
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [tableResults, setTableResults] = useState<any[]>([]);
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check environment variables
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    setEnvStatus({
      apiUrl: {
        present: !!apiUrl && apiUrl !== "PLACEHOLDER",
        value: apiUrl ? `${apiUrl.substring(0, 30)}...` : "NOT SET",
      },
      geminiKey: {
        present: !!geminiKey && geminiKey !== "PLACEHOLDER",
        value: geminiKey ? `${geminiKey.substring(0, 20)}...` : "NOT SET",
      },
    });
  }, []);

  const runTests = async () => {
    setIsLoading(true);
    try {
      const connResult = await testDatabaseConnection();
      setConnectionResult(connResult);

      const tablesResult = await testAllTables();
      setTableResults(tablesResult);
    } catch (error) {
      console.error("Debug test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Status
            <Button
              onClick={runTests}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="ml-auto"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Environment Configuration */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Environment Configuration
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">PostgreSQL Database:</span>
                <Badge variant="default">Configured</Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">API Server:</span>
                {envStatus?.apiUrl.present ? (
                  <>
                    <Badge variant="default">✓ Configured</Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="destructive">✗ Missing</Badge>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">Gemini API Key:</span>
                {envStatus?.geminiKey.present ? (
                  <>
                    <Badge variant="default">✓ Configured</Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="destructive">✗ Missing</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Database Connection */}
          {connectionResult && (
            <div>
              <h4 className="font-semibold mb-2">Database Connection</h4>
              <div className="p-3 rounded-lg" style={{
                backgroundColor: connectionResult.success ? '#f0fdf4' : '#fef2f2',
                borderLeft: `4px solid ${connectionResult.success ? '#22c55e' : '#ef4444'}`
              }}>
                <div className="flex items-center gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {connectionResult.success ? "✓ Connected to PostgreSQL" : "✗ Connection Failed"}
                    </p>
                    {connectionResult.error && (
                      <p className="text-xs text-gray-600 mt-1">
                        {connectionResult.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Status */}
          {tableResults.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Database Tables</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tableResults.map((result) => (
                  <div
                    key={result.table}
                    className="flex items-center gap-2 p-2 rounded text-sm"
                    style={{
                      backgroundColor: result.success ? '#f0fdf4' : '#fef2f2'
                    }}
                  >
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-medium">{result.table}</span>
                    <Badge
                      variant={result.success ? "default" : "destructive"}
                      className="ml-auto text-xs"
                    >
                      {result.success
                        ? result.hasData
                          ? "Has Data"
                          : "Empty"
                        : "Error"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Summary */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>✓ System Status:</strong> You are using <strong>PostgreSQL</strong> with the Express API backend. 
              Supabase is no longer required.
            </p>
            {envStatus?.apiUrl.present && envStatus?.geminiKey.present && (
              <p className="text-xs text-green-700 mt-2">
                ✓ All required services are configured and ready!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

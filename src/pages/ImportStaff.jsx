import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Database } from 'lucide-react';

export default function ImportStaff() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          base44.auth.redirectToLogin();
          return;
        }
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    console.log('File selected:', selectedFile.name, selectedFile.type, selectedFile.size);
    
    setFile(selectedFile);
    setError(null);
    setResult(null);
    setCsvData(null);
    await analyzeCSV(selectedFile);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Parse CSV properly handling quoted values
    const parseCSVLine = (line) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };
    
    const headers = parseCSVLine(lines[0]).map(h => 
      h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    );
    
    if (headers.length === 0) {
      throw new Error('No columns found in CSV');
    }
    
    const records = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = parseCSVLine(line);
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      return record;
    });
    
    return { headers, records };
  };

  const analyzeCSV = async (file) => {
    setAnalyzing(true);
    setError(null);

    try {
      console.log('Reading file...');
      const text = await file.text();
      console.log('File content length:', text.length);
      console.log('First 500 chars:', text.substring(0, 500));

      console.log('Parsing CSV...');
      const { headers, records } = parseCSV(text);
      console.log('Headers found:', headers);
      console.log('Records count:', records.length);
      console.log('First record keys:', Object.keys(records[0]));
      console.log('First record values:', Object.values(records[0]));
      console.log('Full first record:', JSON.stringify(records[0], null, 2));

      setCsvData({ headers, records, sample: records[0] });
    } catch (err) {
      console.error('Error analyzing CSV:', err);
      setError(err.message);
      setFile(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!csvData) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting import with', csvData.records.length, 'records');
      console.log('First record to import:', csvData.records[0]);

      // Import records in batches of 50 to avoid timeouts
      const batchSize = 50;
      let totalImported = 0;

      for (let i = 0; i < csvData.records.length; i += batchSize) {
        const batch = csvData.records.slice(i, i + batchSize);
        console.log(`Importing batch ${Math.floor(i / batchSize) + 1}...`);
        await base44.entities.Staff.bulkCreate(batch);
        totalImported += batch.length;
      }

      console.log('Import completed:', totalImported, 'records');

      // Get a sample of imported data
      const sample = await base44.entities.Staff.list('-created_date', 1);

      setResult({
        success: true,
        count: totalImported,
        message: `Successfully imported ${totalImported} staff records`,
        sample: sample[0]
      });
    } catch (err) {
      console.error('Import error:', err);
      setError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Import Staff from CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-stone-700 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button variant="outline" className="border-stone-700 text-white hover:bg-stone-800" asChild>
                  <span>Choose CSV File</span>
                </Button>
              </label>
              {file && !analyzing && (
                <p className="text-green-400 mt-4">Selected: {file.name}</p>
              )}
              {analyzing && (
                <p className="text-yellow-400 mt-4">Analyzing CSV structure...</p>
              )}
            </div>

            {csvData && (
              <div className="bg-stone-800 rounded-lg p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-5 h-5 text-green-400" />
                    <h3 className="text-white font-semibold">Detected Columns:</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {csvData.headers.map(header => (
                      <span key={header} className="px-3 py-1 bg-stone-700 text-gray-300 rounded-full text-sm">
                        {header}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Sample Data (First Row):</h4>
                  <div className="bg-stone-900 rounded p-3 max-h-48 overflow-auto">
                    <pre className="text-gray-300 text-xs">
                      {JSON.stringify(csvData.sample, null, 2)}
                    </pre>
                  </div>
                </div>

                <p className="text-gray-400 text-sm">
                  {csvData.records.length} records ready to import
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-950 border border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-950 border border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-200 font-semibold">{result.message}</p>
                    <p className="text-green-300 text-sm mt-1">{result.count} records added to database</p>
                  </div>
                </div>
                {result.sample && (
                  <div className="mt-3 bg-green-900 rounded p-3">
                    <h4 className="text-green-200 text-sm font-semibold mb-2">Sample Record:</h4>
                    <pre className="text-green-300 text-xs overflow-auto max-h-32">
                      {JSON.stringify(result.sample, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleImport}
                disabled={!csvData || importing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {importing ? 'Importing...' : 'Import Data'}
              </Button>

              {result && (
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link to={createPageUrl('StaffList')}>View Staff Directory</Link>
                </Button>
              )}
            </div>

            <div className="bg-stone-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Instructions:</h3>
              <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
                <li>Upload your CSV file with staff data</li>
                <li>System will detect column structure automatically</li>
                <li>Staff table will be created based on your CSV columns</li>
                <li>All data will be imported into the new table</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
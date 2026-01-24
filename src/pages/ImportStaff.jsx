import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportStaff() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Please select a valid CSV file');
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      return record;
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const records = parseCSV(text);

      if (records.length === 0) {
        throw new Error('No records found in CSV');
      }

      const imported = await base44.entities.Staff.bulkCreate(records);

      setResult({
        success: true,
        count: imported.length,
        message: `Successfully imported ${imported.length} staff records`
      });
    } catch (err) {
      setError(err.message);
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
              {file && (
                <p className="text-green-400 mt-4">Selected: {file.name}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-950 border border-green-800 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-200 font-semibold">{result.message}</p>
                  <p className="text-green-300 text-sm mt-1">{result.count} records added to database</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {importing ? 'Importing...' : 'Import Staff Data'}
            </Button>

            <div className="bg-stone-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">CSV Format:</h3>
              <p className="text-gray-400 text-sm mb-2">Your CSV should have headers in the first row:</p>
              <code className="text-xs text-gray-300 block bg-stone-950 p-3 rounded">
                first_name,last_name,email,phone,role,department,hire_date,status
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
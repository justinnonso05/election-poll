'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Define a type for voter data
type VoterUploadRow = {
  first_name: string;
  last_name: string;
  email: string;
  level: string;
  studentId: string;
  [key: string]: string;
};

type UploadResults = {
  success: VoterUploadRow[];
  failed: Array<{ row: VoterUploadRow; error: string }>;
  total: number;
};

export default function VoterUpload() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<VoterUploadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResults | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const requiredFields = ['first_name', 'last_name', 'email', 'level', 'studentId'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      // Validate required fields
      if (jsonData.length === 0) {
        setValidationErrors(['File is empty']);
        return;
      }

      const firstRow = jsonData[0];
      const fileFields = Object.keys(firstRow).map((key) => key.toLowerCase().replace(/\s+/g, '_'));
      const missingFields = requiredFields.filter(
        (field) =>
          !fileFields.some(
            (fileField) =>
              fileField.includes(field.toLowerCase()) ||
              (field === 'studentId' &&
                (fileField.includes('matric') || fileField.includes('student_id')))
          )
      );

      if (missingFields.length > 0) {
        setValidationErrors([`Missing required columns: ${missingFields.join(', ')}`]);
        return;
      }

      // Map data to expected format
      const mappedData: VoterUploadRow[] = jsonData.map((row) => {
        const mapped: VoterUploadRow = {
          first_name: '',
          last_name: '',
          email: '',
          level: '',
          studentId: '',
        };
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
          if (normalizedKey.includes('first') && normalizedKey.includes('name')) {
            mapped.first_name = String(row[key] ?? '').trim();
          } else if (normalizedKey.includes('last') && normalizedKey.includes('name')) {
            mapped.last_name = String(row[key] ?? '').trim();
          } else if (normalizedKey.includes('email')) {
            mapped.email = String(row[key] ?? '')
              .trim()
              .toLowerCase();
          } else if (normalizedKey.includes('level')) {
            mapped.level = String(row[key] ?? '').trim();
          } else if (normalizedKey.includes('matric') || normalizedKey.includes('student_id')) {
            mapped.studentId = String(row[key] ?? '').trim();
          }
        });
        return mapped;
      });

      setPreviewData(mappedData.slice(0, 5));
      setValidationErrors([]);
    } catch {
      setValidationErrors(["Error reading file. Please ensure it's a valid CSV or Excel file."]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      // Map all data
      const mappedData: VoterUploadRow[] = jsonData.map((row) => {
        const mapped: VoterUploadRow = {
          first_name: '',
          last_name: '',
          email: '',
          level: '',
          studentId: '',
        };
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
          if (normalizedKey.includes('first') && normalizedKey.includes('name')) {
            mapped.first_name = String(row[key] ?? '').trim();
          } else if (normalizedKey.includes('last') && normalizedKey.includes('name')) {
            mapped.last_name = String(row[key] ?? '').trim();
          } else if (normalizedKey.includes('email')) {
            mapped.email = String(row[key] ?? '')
              .trim()
              .toLowerCase();
          } else if (normalizedKey.includes('level')) {
            mapped.level = String(row[key] ?? '').trim();
          } else if (normalizedKey.includes('matric') || normalizedKey.includes('student_id')) {
            mapped.studentId = String(row[key] ?? '').trim();
          }
        });
        return mapped;
      });

      const response = await fetch('/api/voters/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voters: mappedData }),
      });

      const apiResponse = await response.json();

      // Extract the actual results from the standardized response format
      const results: UploadResults = apiResponse.data || apiResponse;
      setUploadResults(results);

      if (results.success?.length > 0) {
        toast.success(`Successfully added ${results.success.length} voters`);
      }
      if (results.failed?.length > 0) {
        toast.warning(`${results.failed.length} voters failed to upload`);
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreviewData([]);
    setUploadResults(null);
    setValidationErrors([]);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetUpload, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Voters</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Results */}
          {uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Success: {uploadResults.success?.length || 0}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      Failed: {uploadResults.failed?.length || 0}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline">Total: {uploadResults.total || 0}</Badge>
                  </div>
                </div>

                {uploadResults.failed?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Failed Uploads:</h4>
                    <div className="max-h-48 overflow-y-auto">
                      {uploadResults.failed.map((failure, index) => (
                        <Alert key={index} className="mb-2">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Row:</strong> {failure.row?.first_name} {failure.row?.last_name}{' '}
                            -<strong> Error:</strong> {failure.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button onClick={() => window.location.reload()}>Refresh Page</Button>
                  <Button variant="outline" onClick={resetUpload}>
                    Upload More
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Upload */}
          {!uploadResults && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Select CSV or Excel File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to select CSV or Excel file</p>
                      {file && <p className="text-sm font-medium mt-2">{file.name}</p>}
                    </label>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Required Columns:</h4>
                    <div className="flex flex-wrap gap-2">
                      {requiredFields.map((field) => (
                        <Badge key={field} variant="outline">
                          {field === 'studentId' ? 'Matric Number' : field.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {validationErrors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview */}
              {previewData.length > 0 && validationErrors.length === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview (First 5 rows)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>First Name</TableHead>
                          <TableHead>Last Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Student ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.first_name}</TableCell>
                            <TableCell>{row.last_name}</TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.level}</TableCell>
                            <TableCell>{row.studentId}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={loading}>
                        {loading ? 'Uploading...' : 'Upload All Voters'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

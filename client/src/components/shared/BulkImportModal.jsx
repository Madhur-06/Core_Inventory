import { useState, useRef } from 'react';
import { Upload, FileUp, Check, AlertCircle, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../ui/Button';

export default function BulkImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const mutation = useMutation({
    mutationFn: (formData) => api.post('/bulk/import-products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
    onSuccess: (data) => {
      onSuccess?.(data);
    },
  });

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) setFile(f);
  };

  const handleSubmit = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Import Products</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* CSV Format Guide */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">CSV Format</p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Headers: name, sku, category, unit, cost price, reorder point, reorder qty, description
            </p>
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-200'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <FileUp className="h-6 w-6" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Drop CSV file here or click to browse</p>
              </>
            )}
          </div>

          {/* Results */}
          {mutation.isSuccess && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                <Check className="h-4 w-4" /> Import Complete
              </div>
              <p className="text-xs text-green-600">
                Created: {mutation.data.created} · Updated: {mutation.data.updated}
                {mutation.data.errors?.length > 0 && ` · Errors: ${mutation.data.errors.length}`}
              </p>
              {mutation.data.errors?.length > 0 && (
                <div className="mt-2 max-h-24 overflow-y-auto text-xs text-red-600 space-y-0.5">
                  {mutation.data.errors.map((e, i) => (
                    <p key={i}>Row {e.row}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {mutation.isError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle className="h-4 w-4" />
              {mutation.error?.response?.data?.error || 'Import failed'}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-gray-100 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || mutation.isPending}
            className="gap-1.5"
          >
            {mutation.isPending ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </div>
    </div>
  );
}

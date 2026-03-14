import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/Button';

export default function ExportButtons({ endpoint, label = 'Export', params = {} }) {
  const baseUrl = `http://localhost:5000/api/export/${endpoint}`;

  const handleExport = (format) => {
    const token = sessionStorage.getItem('accessToken');
    const queryParams = new URLSearchParams({ format, ...params });
    const url = `${baseUrl}?${queryParams}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${endpoint}.${format === 'pdf' ? 'pdf' : 'csv'}`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        className="gap-1.5 text-xs"
        title="Export as CSV"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        className="gap-1.5 text-xs"
        title="Export as PDF"
      >
        <FileText className="h-3.5 w-3.5" />
        PDF
      </Button>
    </div>
  );
}

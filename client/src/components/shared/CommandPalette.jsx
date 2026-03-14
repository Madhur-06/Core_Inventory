import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, ArrowRight, Command, X } from 'lucide-react';
import api from '../../lib/api';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef();
  const navigate = useNavigate();

  const { data: products } = useQuery({
    queryKey: ['product-search', query],
    queryFn: () => api.get('/products', { params: { search: query, limit: 5 } }).then((r) => r.data),
    enabled: open && query.length >= 2,
  });

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const quickLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Products', path: '/products' },
    { label: 'New Product', path: '/products/new' },
    { label: 'Receipts', path: '/operations/receipts' },
    { label: 'Deliveries', path: '/operations/deliveries' },
    { label: 'Transfers', path: '/operations/transfers' },
    { label: 'Adjustments', path: '/operations/adjustments' },
    { label: 'Move History', path: '/move-history' },
    { label: 'Warehouse Stock', path: '/warehouse-stock' },
    { label: 'Activity Log', path: '/activity-log' },
    { label: 'Settings', path: '/settings' },
  ];

  const filteredLinks = query
    ? quickLinks.filter((l) => l.label.toLowerCase().includes(query.toLowerCase()))
    : quickLinks;

  const productResults = products?.products || [];
  const allResults = [
    ...filteredLinks.map((l) => ({ type: 'page', ...l })),
    ...productResults.map((p) => ({ type: 'product', label: `${p.name} (${p.sku})`, path: `/products/${p.id}` })),
  ];

  const handleSelect = useCallback((item) => {
    navigate(item.path);
    setOpen(false);
  }, [navigate]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      handleSelect(allResults[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-scale-in border border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent text-gray-900 dark:text-gray-100"
            placeholder="Search products, pages, SKU..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {allResults.length > 0 ? (
            allResults.map((item, i) => (
              <button
                key={`${item.type}-${item.path}`}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors ${
                  i === selectedIndex ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                {item.type === 'product' ? (
                  <Package className="h-4 w-4 flex-shrink-0 text-gray-400" />
                ) : (
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.type === 'product' && (
                  <span className="text-xs text-gray-400">Product</span>
                )}
              </button>
            ))
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No results found</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">↵</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}

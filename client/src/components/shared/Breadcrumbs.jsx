import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;

        return (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
            {isLast || !item.href ? (
              <span className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white truncate">
                {isFirst && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors truncate"
              >
                {isFirst && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

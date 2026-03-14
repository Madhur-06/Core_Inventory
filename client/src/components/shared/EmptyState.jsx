import { Package } from 'lucide-react';
import { Button } from '../ui/Button';

export default function EmptyState({ icon: Icon = Package, title, description, action, actionLabel, onAction }) {
  const buttonLabel = actionLabel || action;

  return (
    <div className="flex flex-col items-center justify-center p-16 text-center animate-fade-in">
      <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-5">
        <Icon className="h-10 w-10 text-gray-300 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      {description && <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 max-w-sm">{description}</p>}
      {buttonLabel && onAction && (
        <Button onClick={onAction} className="mt-5 rounded-xl gradient-primary text-white shadow-lg shadow-primary/20">{buttonLabel}</Button>
      )}
    </div>
  );
}

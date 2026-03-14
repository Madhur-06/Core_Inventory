import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  WAITING: 'bg-yellow-100 text-yellow-800',
  READY: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const operationTypeLabels = {
  RECEIPT: 'Receipt',
  DELIVERY: 'Delivery',
  ADJUSTMENT: 'Adjustment',
  TRANSFER: 'Transfer',
};

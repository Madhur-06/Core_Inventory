export default function KPICard({ title, value, icon: Icon, trend, gradient = 'gradient-primary', iconBg = 'bg-primary/10', iconColor = 'text-primary' }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover-lift shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-white">{value}</p>
          {trend && <p className="text-xs text-gray-400 mt-2 font-medium">{trend}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

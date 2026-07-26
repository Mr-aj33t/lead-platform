export default function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4 text-gray-300">-</div>
      <h3 className="text-lg font-medium text-gray-900">{title || 'No data found'}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

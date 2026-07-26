export default function ErrorState({ message, onRetry }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4 text-red-300">!</div>
      <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
      <p className="mt-1 text-sm text-gray-500">{message || 'An error occurred while loading data.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}

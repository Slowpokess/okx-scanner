export function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-green-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  )
}

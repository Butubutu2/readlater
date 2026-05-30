'use client'

interface SyncOption {
  id: string
  label: string
  desc: string
}

interface Props {
  title: string
  message: string
  options: SyncOption[]
  onSelect: (id: string) => void
}

export function SyncDialog({ title, message, options, onSelect }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-2 font-medium text-gray-900">{title}</h3>
        <p className="mb-4 text-sm text-gray-500">{message}</p>
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`flex w-full flex-col items-start rounded-lg border px-4 py-3 text-left transition ${
                opt.id === 'cancel'
                  ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  : 'border-gray-300 text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.desc && <span className="mt-0.5 text-xs text-gray-400">{opt.desc}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

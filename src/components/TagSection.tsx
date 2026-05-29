import type { Item } from '@/lib/types'
import { ItemCard } from './ItemCard'

interface Props {
  tag: string
  items: Item[]
  showActions?: boolean
  onDelete?: (id: string) => void
}

export function TagSection({ tag, items, showActions, onDelete }: Props) {
  if (items.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {tag} · {items.length}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            showActions={showActions}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  )
}

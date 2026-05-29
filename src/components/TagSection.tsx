import type { Item } from '@/lib/types'
import { ItemCard } from './ItemCard'

interface Props {
  tag: string
  items: Item[]
}

export function TagSection({ tag, items }: Props) {
  if (items.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {tag} · {items.length}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

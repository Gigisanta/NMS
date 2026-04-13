'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn, adjustColor } from '@/lib/utils'

interface Group {
  id: string
  name: string
  color?: string
}

interface GroupTabsProps {
  groups: Group[]
  selectedId: string | null
  onChange: (id: string | null) => void
  className?: string
  isAdmin?: boolean
}

export function GroupTabs({ groups, selectedId, onChange, className, isAdmin = true }: GroupTabsProps) {
  return (
    <div className={cn("w-full mb-6", className)}>
      <Tabs
        value={selectedId || 'all'}
        onValueChange={(val) => onChange(val === 'all' ? null : val)}
        className="w-full"
      >
        <ScrollArea className="w-full">
          <TabsList
            className="inline-flex h-11 items-center justify-start px-1 w-auto min-w-full bg-secondary/20"
          >
            {isAdmin && (
              <TabsTrigger
                value="all"
                className="px-5 py-2 text-sm font-medium transition-all"
                style={{
                  color: selectedId === null ? 'var(--foreground)' : 'var(--muted-foreground)',
                  background: selectedId === null ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'transparent',
                }}
              >
                Todos los grupos
              </TabsTrigger>
            )}
            {groups.map((group) => (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className="px-5 py-2 text-sm font-medium transition-all relative overflow-hidden"
                style={{
                  color: selectedId === group.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                  background: selectedId === group.id
                    ? `linear-gradient(135deg, ${group.color || 'var(--primary)'} 0%, ${group.color ? adjustColor(group.color, 30) : 'var(--secondary)'} 100%)`
                    : 'transparent',
                }}
              >
                <span
                  className="absolute bottom-0 left-0 h-0.5 w-full transition-opacity duration-200"
                  style={{
                    backgroundColor: group.color || 'var(--secondary)',
                    opacity: selectedId === group.id ? 1 : 0.25,
                  }}
                />
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Tabs>
    </div>
  )
}

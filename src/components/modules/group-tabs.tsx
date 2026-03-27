'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

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
}

export function GroupTabs({ groups, selectedId, onChange, className }: GroupTabsProps) {
  return (
    <div className={cn("w-full mb-6", className)}>
      <Tabs
        value={selectedId || 'all'}
        onValueChange={(val) => onChange(val === 'all' ? null : val)}
        className="w-full"
      >
        <ScrollArea className="w-full">
          <TabsList 
            className="inline-flex h-11 items-center justify-start px-1 w-auto min-w-full"
            style={{ background: 'rgba(0, 168, 232, 0.08)' }}
          >
            <TabsTrigger
              value="all"
              className="px-5 py-2 text-sm font-medium transition-all"
              style={{ 
                color: selectedId === null ? '#FFFFFF' : '#4A5568',
                background: selectedId === null ? 'linear-gradient(135deg, #005691 0%, #00A8E8 100%)' : 'transparent',
              }}
            >
              Todos los grupos
            </TabsTrigger>
            {groups.map((group) => (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className="px-5 py-2 text-sm font-medium transition-all relative overflow-hidden"
                style={{ 
                  color: selectedId === group.id ? '#FFFFFF' : '#4A5568',
                  background: selectedId === group.id 
                    ? `linear-gradient(135deg, ${group.color || '#005691'} 0%, ${group.color ? adjustColor(group.color, 30) : '#00A8E8'} 100%)`
                    : 'transparent',
                }}
              >
                <span
                  className="absolute bottom-0 left-0 h-0.5 w-full"
                  style={{ backgroundColor: group.color || '#00A8E8' }}
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

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return color // Invalid format, return as-is
  const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount))
  const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount))
  const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

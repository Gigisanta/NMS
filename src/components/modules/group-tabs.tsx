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
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-auto min-w-full">
            <TabsTrigger
              value="all"
              className="px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Todos los grupos
            </TabsTrigger>
            {groups.map((group) => (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className="px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm relative overflow-hidden"
              >
                <span
                  className="absolute bottom-0 left-0 h-0.5 w-full"
                  style={{ backgroundColor: group.color || '#06b6d4' }}
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

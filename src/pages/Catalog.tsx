import { useState, useMemo } from 'react'
import { useIdeas } from '@/context/IdeaContext'
import { IdeaModal } from '@/components/IdeaModal'
import { StatusBadge } from '@/components/StatusBadge'
import { PriorityDisplay } from '@/components/PriorityDisplay'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Loader2,
  Search,
  Filter,
  SortDesc,
  SlidersHorizontal,
} from 'lucide-react'
import {
  IdeaStatus,
  IdeaCategory,
  STATUS_LABELS,
  CATEGORY_LABELS,
} from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'

type SortOption = 'relevance' | 'recent' | 'updated'

const Catalog = () => {
  const { ideas, tags, isLoading } = useIdeas()
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<IdeaStatus[]>([])
  const [selectedCategory, setSelectedCategory] = useState<IdeaCategory[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Modal State
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter((idea) => {
        // Search
        const searchLower = search.toLowerCase()
        const matchesSearch =
          idea.title.toLowerCase().includes(searchLower) ||
          idea.summary?.toLowerCase().includes(searchLower) ||
          idea.description?.toLowerCase().includes(searchLower) ||
          idea.tags.some((tag) => tag.name.toLowerCase().includes(searchLower))

        // Filters
        const matchesStatus =
          selectedStatus.length === 0 || selectedStatus.includes(idea.status)
        const matchesCategory =
          selectedCategory.length === 0 ||
          selectedCategory.includes(idea.category)

        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.every((tagId) => idea.tags.some((t) => t.id === tagId))

        return matchesSearch && matchesStatus && matchesCategory && matchesTags
      })
      .sort((a, b) => {
        if (sortOption === 'relevance') return b.priorityScore - a.priorityScore
        if (sortOption === 'recent')
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        if (sortOption === 'updated')
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        return 0
      })
  }, [
    ideas,
    search,
    selectedStatus,
    selectedCategory,
    selectedTags,
    sortOption,
  ])

  const toggleStatus = (status: IdeaStatus) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    )
  }

  const toggleCategory = (category: IdeaCategory) => {
    setSelectedCategory((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    )
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    )
  }

  const clearFilters = () => {
    setSelectedStatus([])
    setSelectedCategory([])
    setSelectedTags([])
    setSearch('')
    setSortOption('recent')
  }

  const openIdea = (id: string) => {
    setSelectedIdeaId(id)
    setIsModalOpen(true)
  }

  const closeIdea = () => {
    setIsModalOpen(false)
    setSelectedIdeaId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por título, resumo ou tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={sortOption}
            onValueChange={(val) => setSortOption(val as SortOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SortDesc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Mais Relevante</SelectItem>
              <SelectItem value="recent">Mais Recente</SelectItem>
              <SelectItem value="updated">Última Atualização</SelectItem>
            </SelectContent>
          </Select>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
                {(selectedStatus.length > 0 ||
                  selectedCategory.length > 0 ||
                  selectedTags.length > 0) && (
                  <Badge variant="secondary" className="ml-1 px-1 h-5">
                    {selectedStatus.length +
                      selectedCategory.length +
                      selectedTags.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>Filtrar Ideias</SheetTitle>
                <SheetDescription>
                  Refine sua busca por status, categoria e tags.
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 -mx-6 px-6 py-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Status</h4>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${key}`}
                          checked={selectedStatus.includes(key as IdeaStatus)}
                          onCheckedChange={() =>
                            toggleStatus(key as IdeaStatus)
                          }
                        />
                        <Label htmlFor={`status-${key}`}>{label}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Categoria</h4>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${key}`}
                          checked={selectedCategory.includes(
                            key as IdeaCategory,
                          )}
                          onCheckedChange={() =>
                            toggleCategory(key as IdeaCategory)
                          }
                        />
                        <Label htmlFor={`cat-${key}`}>{label}</Label>
                      </div>
                    ))}
                  </div>

                  {tags.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant={
                              selectedTags.includes(tag.id)
                                ? 'default'
                                : 'outline'
                            }
                            className="cursor-pointer"
                            onClick={() => toggleTag(tag.id)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <SheetFooter>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar
                </Button>
                <Button onClick={() => setIsFilterOpen(false)}>
                  Ver Resultados
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <SlidersHorizontal className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
          <p className="text-muted-foreground mt-2">
            Tente ajustar seus filtros ou termos de pesquisa.
          </p>
          <Button variant="link" onClick={clearFilters} className="mt-4">
            Limpar todos os filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => openIdea(idea.id)}
              className="group flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                    {idea.title}
                  </h3>
                  <StatusBadge
                    status={idea.status}
                    className="scale-90 origin-left"
                  />
                </div>
                {idea.summary && (
                  <p className="text-muted-foreground line-clamp-2 mb-2">
                    {idea.summary}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    {CATEGORY_LABELS[idea.category]}
                  </Badge>
                  {idea.tags.map((t) => (
                    <Badge
                      key={t.id}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      #{t.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                <PriorityDisplay
                  impact={idea.impact}
                  effort={idea.effort}
                  showLabel
                  className="flex-row-reverse md:flex-row"
                />
                <span className="text-xs text-muted-foreground">
                  Atualizado em {new Date(idea.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <IdeaModal
        isOpen={isModalOpen}
        onClose={closeIdea}
        ideaId={selectedIdeaId}
      />
    </div>
  )
}

export default Catalog

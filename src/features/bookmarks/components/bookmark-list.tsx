
"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Grid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BookmarkCard } from "./bookmark-card"
import { BookmarkEmptyState } from "./bookmark-empty-state"
import { BookmarkFilters } from "./bookmark-filters"
import { useBookmarks } from "../hooks/use-bookmarks"
import type { BookmarkCategory, BookmarkAgeGroup } from "../types/bookmark-types"
import { useAuthStore } from "@/shared/stores/auth-store"

export function BookmarkList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<BookmarkCategory[]>([])
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<BookmarkAgeGroup[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  const { user } = useAuthStore();
  const { bookmarks, isLoading, error } = useBookmarks(user?.id);

  // 사용자가 로그인하지 않은 경우 처리
  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    )
  }

  // 필터링된 북마크를 useMemo로 최적화
  const filteredBookmarks = useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) return [];

    return bookmarks.filter((bookmark) => {
      const searchableContent = [
        bookmark.post?.title || '',
        bookmark.post?.content || '',
        bookmark.post?.author?.nickname || ''
      ].join(' ').toLowerCase();

      const matchesSearch = searchQuery === '' || searchableContent.includes(searchQuery.toLowerCase());
      
      // 카테고리 필터링 (다중 선택)
      let matchesCategory = true;
      if (selectedCategories.length > 0) {
        const postCategory = bookmark.post?.category;
        matchesCategory = postCategory ? selectedCategories.includes(postCategory as BookmarkCategory) : false;
      }

      // 연령대 필터링 (다중 선택)
      let matchesAgeGroup = true;
      if (selectedAgeGroups.length > 0) {
        const postAgeGroup = bookmark.post?.ageGroup;
        matchesAgeGroup = postAgeGroup ? selectedAgeGroups.includes(postAgeGroup as BookmarkAgeGroup) : false;
      }

      return matchesSearch && matchesCategory && matchesAgeGroup;
    });
  }, [bookmarks, searchQuery, selectedCategories, selectedAgeGroups]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">북마크를 불러오는데 실패했습니다.</p>
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">북마크</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              필터
              {(selectedCategories.length > 0 || selectedAgeGroups.length > 0) && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {selectedCategories.length + selectedAgeGroups.length}
                </span>
              )}
            </Button>
            <div className="flex items-center border rounded-lg">
              <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="북마크 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <BookmarkFilters 
            selectedCategories={selectedCategories} 
            selectedAgeGroups={selectedAgeGroups}
            onCategoriesChange={setSelectedCategories}
            onAgeGroupsChange={setSelectedAgeGroups}
          />
        )}
      </div>

      {/* Content */}
      <div className="mt-6">
        {filteredBookmarks.length === 0 ? (
          <BookmarkEmptyState hasSearch={searchQuery.length > 0} searchQuery={searchQuery} />
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredBookmarks.map((bookmark, index) => (
              <BookmarkCard 
                key={bookmark.id} 
                bookmark={bookmark} 
                viewMode={viewMode} 
                index={index} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {filteredBookmarks.length > 0 && (
        <div className="text-sm text-gray-500 text-center">총 {filteredBookmarks.length}개의 북마크</div>
      )}
    </div>
  )
}

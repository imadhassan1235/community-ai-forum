"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search, Filter, Plus } from "lucide-react"
import api from "../utils/api"
import PostCard from "../components/PostCard"
import LoadingSpinner from "../components/LoadingSpinner"
import { useAuth } from "../contexts/AuthContext"

const HomePage = () => {
  const { isAuthenticated } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [popularTags, setPopularTags] = useState([])
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchPosts()
    fetchPopularTags()
  }, [currentPage, searchTerm, selectedTag, sortBy, sortOrder])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
      }

      if (searchTerm) params.search = searchTerm
      if (selectedTag) params.tag = selectedTag

      const response = await api.get("/posts", { params })
      setPosts(response.data.data.posts)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPopularTags = async () => {
    try {
      const response = await api.get("/posts/tags/popular?limit=10")
      setPopularTags(response.data.data)
    } catch (error) {
      console.error("Error fetching popular tags:", error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPosts()
  }

  const handleTagClick = (tag) => {
    setSelectedTag(tag === selectedTag ? "" : tag)
    setCurrentPage(1)
  }

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("desc")
    }
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Forum</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Share knowledge, ask questions, and connect with the community
          </p>
        </div>

        {isAuthenticated && (
          <Link to="/create-post" className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Post</span>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <button
            onClick={() => handleSortChange("createdAt")}
            className={`btn text-sm ${sortBy === "createdAt" ? "btn-primary" : "btn-outline"}`}
          >
            Date {sortBy === "createdAt" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSortChange("votes")}
            className={`btn text-sm ${sortBy === "votes" ? "btn-primary" : "btn-outline"}`}
          >
            Votes {sortBy === "votes" && (sortOrder === "desc" ? "↓" : "↑")}
          </button>
        </div>

        {/* Popular Tags */}
        {popularTags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Popular Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tagData) => (
                <button
                  key={tagData.tag}
                  onClick={() => handleTagClick(tagData.tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTag === tagData.tag
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  #{tagData.tag} ({tagData.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(selectedTag || searchTerm) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Active filters:</span>
              {searchTerm && (
                <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded dark:bg-primary-900 dark:text-primary-200">
                  Search: "{searchTerm}"
                </span>
              )}
              {selectedTag && (
                <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded dark:bg-primary-900 dark:text-primary-200">
                  Tag: #{selectedTag}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedTag("")
                  setCurrentPage(1)
                }}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {searchTerm || selectedTag ? "No posts found matching your criteria." : "No posts yet."}
          </p>
          {isAuthenticated && (
            <Link to="/create-post" className="btn btn-primary mt-4">
              Create the first post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`btn ${currentPage === page ? "btn-primary" : "btn-outline"}`}
                >
                  {page}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.pages}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage

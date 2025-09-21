"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { User, Edit, Trash2 } from "lucide-react"
import api from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import VoteButton from "./VoteButton"
import LoadingSpinner from "./LoadingSpinner"
import toast from "react-hot-toast"

const CommentSection = ({ postId }) => {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [editContent, setEditContent] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("asc")

  useEffect(() => {
    fetchComments()
  }, [postId, sortBy, sortOrder])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/comments/post/${postId}`, {
        params: { sortBy, sortOrder, limit: 50 },
      })
      setComments(response.data.data.comments)
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await api.post("/comments", {
        postId,
        content: newComment.trim(),
      })

      setComments([...comments, response.data.data])
      setNewComment("")
      toast.success("Comment added!")
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return

    try {
      const response = await api.put(`/comments/${commentId}`, {
        content: editContent.trim(),
      })

      setComments(comments.map((comment) => (comment._id === commentId ? response.data.data : comment)))
      setEditingComment(null)
      setEditContent("")
      toast.success("Comment updated!")
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update comment")
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return

    try {
      await api.delete(`/comments/${commentId}`)
      setComments(comments.filter((comment) => comment._id !== commentId))
      toast.success("Comment deleted!")
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete comment")
    }
  }

  const startEditing = (comment) => {
    setEditingComment(comment._id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditContent("")
  }

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc")
    } else {
      setSortBy(newSortBy)
      setSortOrder(newSortBy === "createdAt" ? "asc" : "desc")
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Comments ({comments.length})</h2>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
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
      </div>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={4}
              className="input resize-none"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting || !newComment.trim()} className="btn btn-primary">
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Posting...
                </>
              ) : (
                "Post Comment"
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please{" "}
            <a href="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
              login
            </a>{" "}
            to post a comment.
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => {
            const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
            const isOwner = isAuthenticated && user._id === comment.userId._id

            return (
              <div key={comment._id} className="flex space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {/* Vote Section */}
                <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                  <VoteButton type="comment" itemId={comment._id} votes={comment.votes} voteCount={comment.voteCount} />
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  {/* Author Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {comment.userId.avatarUrl ? (
                        <img
                          src={comment.userId.avatarUrl || "/placeholder.svg"}
                          alt={comment.userId.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{comment.userId.username}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Score: {comment.userId.score}</span>
                      <span className="text-gray-400 text-sm">•</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">{timeAgo}</span>
                    </div>

                    {/* Actions */}
                    {isOwner && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditing(comment)}
                          className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comment Content */}
                  {editingComment === comment._id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="input resize-none"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditComment(comment._id)}
                          className="btn btn-primary text-sm"
                          disabled={!editContent.trim()}
                        >
                          Save
                        </button>
                        <button onClick={cancelEditing} className="btn btn-outline text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CommentSection

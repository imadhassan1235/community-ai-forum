"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { Edit, Trash2, User, MessageCircle, Sparkles } from "lucide-react"
import api from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import VoteButton from "../components/VoteButton"
import CommentSection from "../components/CommentSection"
import LoadingSpinner from "../components/LoadingSpinner"
import toast from "react-hot-toast"

const PostPage = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/posts/${id}`)
      setPost(response.data.data)
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Post not found")
      navigate("/")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return

    try {
      await api.delete(`/posts/${id}`)
      toast.success("Post deleted successfully")
      navigate("/")
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete post")
    }
  }

  const generateAISummary = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to use AI features")
      return
    }

    setIsGeneratingSummary(true)
    try {
      const response = await api.post("/ai/summarize", { postId: id })
      setAiSummary(response.data.data.summary)
      toast.success("AI summary generated!")
    } catch (error) {
      const message = error.response?.data?.error || "Failed to generate summary"
      toast.error(message)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Post not found</p>
        <Link to="/" className="btn btn-primary mt-4">
          Back to Home
        </Link>
      </div>
    )
  }

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
  const isOwner = isAuthenticated && user._id === post.userId._id

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Post Content */}
      <div className="card p-8">
        <div className="flex space-x-6">
          {/* Vote Section */}
          <div className="flex flex-col items-center space-y-2 flex-shrink-0">
            <VoteButton type="post" itemId={post._id} votes={post.votes} voteCount={post.voteCount} />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{post.title}</h1>

              {/* Actions */}
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <Link to={`/edit-post/${post._id}`} className="btn btn-outline text-sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Link>
                  <button onClick={handleDelete} className="btn btn-outline text-red-600 hover:bg-red-50 text-sm">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            {/* AI Summary Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  <span>AI Summary</span>
                </h3>
                <button
                  onClick={generateAISummary}
                  disabled={isGeneratingSummary || !isAuthenticated}
                  className="btn btn-primary text-sm disabled:opacity-50"
                >
                  {isGeneratingSummary ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Summarize Thread
                    </>
                  )}
                </button>
              </div>

              {aiSummary ? (
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiSummary}</p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  {isAuthenticated
                    ? "Click 'Summarize Thread' to generate an AI summary of this post and its comments."
                    : "Login to generate AI summaries."}
                </p>
              )}
            </div>

            {/* Author Info */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center space-x-3">
                {post.userId.avatarUrl ? (
                  <img
                    src={post.userId.avatarUrl || "/placeholder.svg"}
                    alt={post.userId.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <Link
                    to={`/profile/${post.userId._id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {post.userId.username}
                  </Link>
                  <div className="flex items-center space-x-2 text-xs">
                    <span>Score: {post.userId.score}</span>
                    <span>•</span>
                    <span>Posted {timeAgo}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>Comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <CommentSection postId={post._id} />
    </div>
  )
}

export default PostPage

"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { User, Edit, Calendar, MessageCircle, FileText, Camera } from "lucide-react"
import api from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import PostCard from "../components/PostCard"
import toast from "react-hot-toast"

const ProfilePage = () => {
  const { id } = useParams()
  const { user: currentUser, isAuthenticated, updateUser } = useAuth()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("posts")
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ bio: "", avatarUrl: "" })
  const [isUpdating, setIsUpdating] = useState(false)

  const isOwnProfile = isAuthenticated && currentUser._id === id

  useEffect(() => {
    fetchUserData()
  }, [id])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [userResponse, postsResponse, commentsResponse] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/posts?limit=10`),
        api.get(`/users/${id}/comments?limit=10`),
      ])

      setUser(userResponse.data.data)
      setPosts(postsResponse.data.data.posts)
      setComments(commentsResponse.data.data.comments)
      setEditForm({
        bio: userResponse.data.data.bio || "",
        avatarUrl: userResponse.data.data.avatarUrl || "",
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast.error("User not found")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const response = await api.put("/users/profile", editForm)
      setUser(response.data.data)
      updateUser(response.data.data)
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile")
    } finally {
      setIsUpdating(false)
    }
  }

  const getRankBadge = (score) => {
    if (score >= 500) return { text: "🏆 Legend", color: "text-yellow-600" }
    if (score >= 200) return { text: "⭐ Expert", color: "text-purple-600" }
    if (score >= 100) return { text: "🌟 Contributor", color: "text-blue-600" }
    if (score >= 50) return { text: "📈 Rising", color: "text-green-600" }
    return { text: "👤 Member", color: "text-gray-600" }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 text-lg">User not found</p>
        <Link to="/" className="btn btn-primary mt-4">
          Back to Home
        </Link>
      </div>
    )
  }

  const memberSince = formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
  const rankBadge = getRankBadge(user.score)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="relative">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl || "/placeholder.svg"}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center border-4 border-primary-100 dark:border-primary-900">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.username}</h1>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`text-sm font-medium ${rankBadge.color}`}>{rankBadge.text}</span>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Joined {memberSince}</span>
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn btn-outline mt-4 sm:mt-0 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{user.score}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{comments.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
              </div>
            </div>

            {/* Bio */}
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Avatar URL (optional)
                  </label>
                  <div className="relative">
                    <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="url"
                      value={editForm.avatarUrl}
                      onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                      className="input pl-10"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio (optional)
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    maxLength={500}
                    className="input resize-none"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{editForm.bio.length}/500</p>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" disabled={isUpdating} className="btn btn-primary">
                    {isUpdating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              user.bio && (
                <div className="mt-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{user.bio}</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("posts")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "posts"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Posts ({posts.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "comments"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Comments ({comments.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "posts" ? (
            posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {isOwnProfile ? "You haven't created any posts yet." : `${user.username} hasn't posted anything yet.`}
                </p>
                {isOwnProfile && (
                  <Link to="/create-post" className="btn btn-primary mt-4">
                    Create Your First Post
                  </Link>
                )}
              </div>
            )
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      to={`/posts/${comment.postId._id}`}
                      className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Re: {comment.postId.title}
                    </Link>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>Votes: {comment.voteCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {isOwnProfile
                  ? "You haven't commented on any posts yet."
                  : `${user.username} hasn't commented on anything yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

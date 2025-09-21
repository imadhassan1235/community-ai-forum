import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { MessageCircle, User } from "lucide-react"
import VoteButton from "./VoteButton"

const PostCard = ({ post }) => {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex space-x-4">
        {/* Vote Section */}
        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
          <VoteButton type="post" itemId={post._id} votes={post.votes} voteCount={post.voteCount} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link to={`/posts/${post._id}`} className="block group">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {post.title}
                </h2>
              </Link>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Content Preview */}
              <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
              </p>
            </div>
          </div>

          {/* Meta Information */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {post.userId.avatarUrl ? (
                  <img
                    src={post.userId.avatarUrl || "/placeholder.svg"}
                    alt={post.userId.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                )}
                <Link
                  to={`/profile/${post.userId._id}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {post.userId.username}
                </Link>
                <span className="text-gray-400">•</span>
                <span>{timeAgo}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to={`/posts/${post._id}`}
                className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Comments</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostCard

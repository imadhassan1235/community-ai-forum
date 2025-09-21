"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../utils/api"
import toast from "react-hot-toast"

const VoteButton = ({ type, itemId, votes = [], voteCount = 0 }) => {
  const { user, isAuthenticated } = useAuth()
  const [currentVotes, setCurrentVotes] = useState(votes)
  const [currentVoteCount, setCurrentVoteCount] = useState(voteCount)
  const [isVoting, setIsVoting] = useState(false)

  // Find user's current vote
  const userVote = isAuthenticated ? currentVotes.find((vote) => vote.userId === user._id) : null

  const handleVote = async (value) => {
    if (!isAuthenticated) {
      toast.error("Please login to vote")
      return
    }

    if (isVoting) return

    setIsVoting(true)

    try {
      const endpoint = type === "post" ? `/posts/${itemId}/vote` : `/comments/${itemId}/vote`
      const response = await api.post(endpoint, { value })

      const updatedItem = response.data.data
      setCurrentVotes(updatedItem.votes)
      setCurrentVoteCount(updatedItem.voteCount)

      toast.success("Vote recorded!")
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to vote")
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <button
        onClick={() => handleVote(1)}
        disabled={isVoting || !isAuthenticated}
        className={`p-1 rounded transition-colors ${
          userVote?.value === 1
            ? "text-green-600 bg-green-50 dark:bg-green-900/20"
            : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
        } ${!isAuthenticated ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      <span
        className={`text-sm font-medium ${
          currentVoteCount > 0
            ? "text-green-600"
            : currentVoteCount < 0
              ? "text-red-600"
              : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {currentVoteCount}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={isVoting || !isAuthenticated}
        className={`p-1 rounded transition-colors ${
          userVote?.value === -1
            ? "text-red-600 bg-red-50 dark:bg-red-900/20"
            : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        } ${!isAuthenticated ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  )
}

export default VoteButton

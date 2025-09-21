"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Trophy, Medal, Award, User, TrendingUp } from "lucide-react"
import api from "../utils/api"
import LoadingSpinner from "../components/LoadingSpinner"

const LeaderboardPage = () => {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchLeaderboard()
    fetchStats()
  }, [currentPage])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await api.get("/leaderboard", {
        params: { page: currentPage, limit: 20 },
      })
      setUsers(response.data.data.users)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get("/leaderboard/stats")
      setStats(response.data.data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">#{rank}</span>
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return "🏆 Champion"
    if (rank === 2) return "🥈 Expert"
    if (rank === 3) return "🥉 Contributor"
    if (rank <= 10) return "⭐ Top 10"
    if (rank <= 50) return "🌟 Top 50"
    return "👤 Member"
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community Leaderboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Top contributors ranked by their community engagement score</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers || 0}</h3>
          <p className="text-gray-600 dark:text-gray-400">Total Members</p>
        </div>

        <div className="card p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.topUser?.username || "N/A"}</h3>
          <p className="text-gray-600 dark:text-gray-400">Top Contributor</p>
          {stats.topUser && (
            <p className="text-sm text-primary-600 dark:text-primary-400">{stats.topUser.score} points</p>
          )}
        </div>

        <div className="card p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Award className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.averageScore || 0)}</h3>
          <p className="text-gray-600 dark:text-gray-400">Average Score</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Top Contributors</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user._id}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                  user.rank <= 3
                    ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800"
                    : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-12">{getRankIcon(user.rank)}</div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl || "/placeholder.svg"}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/profile/${user._id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {user.username}
                    </Link>
                    <span className="text-sm px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full">
                      {getRankBadge(user.rank)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{user.score}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">points</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
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

      {/* Gamification Rules */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How Points Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Post receives upvote</span>
              <span className="text-green-600 font-medium">+10 points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Comment receives upvote</span>
              <span className="text-green-600 font-medium">+5 points</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Give an upvote</span>
              <span className="text-green-600 font-medium">+2 points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Receive downvote</span>
              <span className="text-red-600 font-medium">-2 points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage

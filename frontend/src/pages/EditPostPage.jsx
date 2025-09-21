"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Plus, X } from "lucide-react"
import api from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import toast from "react-hot-toast"

const EditPostPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm()

  const watchedTitle = watch("title")
  const watchedContent = watch("content")

  useEffect(() => {
    fetchPost()
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/posts/${id}`)
      const postData = response.data.data

      // Check if user owns the post
      if (postData.userId._id !== user._id) {
        toast.error("You can only edit your own posts")
        navigate("/")
        return
      }

      setPost(postData)
      setValue("title", postData.title)
      setValue("content", postData.content)
      setTags(postData.tags || [])
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Post not found")
      navigate("/")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await api.put(`/posts/${id}`, {
        ...data,
        tags,
      })

      toast.success("Post updated successfully!")
      navigate(`/posts/${response.data.data._id}`)
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = (e) => {
    e.preventDefault()
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(e)
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
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Post</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Update your post content</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              {...register("title", {
                required: "Title is required",
                maxLength: {
                  value: 200,
                  message: "Title must be 200 characters or less",
                },
              })}
              type="text"
              className="input"
              placeholder="Enter a descriptive title for your post"
            />
            <div className="flex justify-between mt-1">
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{watchedTitle?.length || 0}/200</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              {...register("content", {
                required: "Content is required",
                maxLength: {
                  value: 10000,
                  message: "Content must be 10,000 characters or less",
                },
              })}
              rows={12}
              className="input resize-none"
              placeholder="Write your post content here. You can use markdown formatting."
            />
            <div className="flex justify-between mt-1">
              {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{watchedContent?.length || 0}/10,000</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (optional)</label>
            <div className="space-y-3">
              {/* Tag Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="input flex-1"
                  placeholder="Add a tag (press Enter)"
                  maxLength={30}
                  disabled={tags.length >= 5}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 5}
                  className="btn btn-outline disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Current Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full text-sm"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add up to 5 tags to help others find your post. Tags should be relevant keywords.
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate(`/posts/${id}`)}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating Post...
                </>
              ) : (
                "Update Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPostPage

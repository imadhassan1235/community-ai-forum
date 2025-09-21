import { clsx } from "clsx"

const LoadingSpinner = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary-600",
        sizeClasses[size],
        className,
      )}
    />
  )
}

export default LoadingSpinner

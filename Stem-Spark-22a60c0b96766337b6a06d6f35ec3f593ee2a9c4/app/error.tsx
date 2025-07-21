"use client"

import { BrandedError } from "@/components/branded-error"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <BrandedError
      title="Something went wrong!"
      message="We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists."
      showHomeButton={true}
      showRetryButton={true}
      onRetry={reset}
    />
  )
}
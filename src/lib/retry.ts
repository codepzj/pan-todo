/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Base delay in milliseconds (will be multiplied by 2^attempt)
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Log the error for debugging
      console.error(`Attempt ${attempt + 1} failed:`, error)
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate exponential backoff delay: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt)
      
      console.log(`Retrying in ${delay}ms...`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError
}

import { Component, ErrorInfo, ReactNode } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component to catch and display React errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                出现错误
              </h2>
              <p className="text-sm text-gray-600">
                应用遇到了一个意外错误。您可以尝试重新加载应用。
              </p>
            </div>
            
            {this.state.error && (
              <div className="bg-gray-100 p-3 rounded text-xs text-gray-700 font-mono overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={this.handleReset}
                className="flex-1"
              >
                重试
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                重新加载
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

import { Settings } from './Settings'
import { About } from './About'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Pan Todo</h1>
          <span className="text-xs text-gray-500 hidden sm:inline">待办</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <About />
          <Settings />
        </div>
      </div>
    </header>
  )
}

// Type definitions for the application
// Will be used across components

export interface TodoItem {
  id: string
  title: string
  description?: string
  quadrant: QuadrantType
  order: number
  createdAt: number
  updatedAt: number
}

export type QuadrantType =
  | 'urgent-important'
  | 'not-urgent-important'
  | 'urgent-not-important'
  | 'not-urgent-not-important'

export interface StorageData {
  todos: TodoItem[]
  version: string
}

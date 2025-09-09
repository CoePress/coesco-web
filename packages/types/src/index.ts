export interface User {
  id: string
  name: string
  email: string
}

export interface ApiResponse<T> {
  data: T
  success: boolean
}

export type Status = 'active' | 'inactive'
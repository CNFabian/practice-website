import { api } from '../utils/api'

export interface Course {
  id: string
  title: string
  description: string
  videoUrl: string
  duration: number
  createdAt: string
}

export interface Progress {
  courseId: string
  userId: string
  completionPercentage: number
  lastWatchedAt: string
}

export const courseService = {
  async getAllCourses(): Promise<Course[]> {
    const response = await api.get<Course[]>('/courses')
    return response.data
  },

  async getCourse(id: string): Promise<Course> {
    const response = await api.get<Course>(`/courses/${id}`)
    return response.data
  },

  async getUserProgress(userId: string): Promise<Progress[]> {
    const response = await api.get<Progress[]>(`/progress/${userId}`)
    return response.data
  },

  async updateProgress(courseId: string, progress: number): Promise<void> {
    await api.post(`/progress/${courseId}`, { progress })
  }
}

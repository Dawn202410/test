import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json"
  }
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error("API请求错误:", error)
    return Promise.reject(error)
  }
)

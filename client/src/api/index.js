// src/api/index.js
import fetchWrapper from '@/utils/fetchWrapper.js'

export const request = async (url, options = {}) => {
  return await fetchWrapper(url, options)
}
import { useState, useCallback } from 'react'

export type UploadCategory = 'image' | 'video' | 'audio' | 'font' | 'file'

export interface UploadResult {
  key: string
  publicUrl: string
}

export interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
}

export function useMediaUpload(courseId: string) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  })

  const upload = useCallback(async (
    file: File,
    category: UploadCategory = 'image'
  ): Promise<UploadResult | null> => {
    setState({ uploading: true, progress: 0, error: null })

    try {
      // 1. Get presigned PUT URL from our API
      const signRes = await fetch('/api/media/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
          courseId,
          category,
        }),
      })

      if (!signRes.ok) {
        const { error } = await signRes.json()
        throw new Error(error || 'Failed to get upload URL')
      }

      const { uploadUrl, key } = await signRes.json()

      // 2. Upload directly to R2 via XMLHttpRequest so we get progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setState((prev) => ({
              ...prev,
              progress: Math.round((e.loaded / e.total) * 100),
            }))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.send(file)
      })

      // 3. Build the public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}/${key}`

      setState({ uploading: false, progress: 100, error: null })
      return { key, publicUrl }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setState({ uploading: false, progress: 0, error: message })
      return null
    }
  }, [courseId])

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null })
  }, [])

  return { ...state, upload, reset }
}

import { useRef, useState } from 'react'
import { isSupabaseConfigured } from '../../lib/supabase'
import './ProductImageField.css'

interface ImageUploadFieldProps {
  label: string
  imageUrl: string
  onImageUrlChange: (url: string) => void
  onUpload: (file: File) => Promise<string>
  disabled?: boolean
  /** When false, only file upload is shown (no manual URL field). */
  allowUrlInput?: boolean
}

export default function ImageUploadField({
  label,
  imageUrl,
  onImageUrlChange,
  onUpload,
  disabled = false,
  allowUrlInput = true,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const url = await onUpload(file)
      onImageUrlChange(url)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="product-image-field">
      <span className="field-label">{label}</span>

      {imageUrl ? (
        <div className="product-image-preview">
          <img src={imageUrl} alt="" />
          <button
            type="button"
            className="btn-link danger"
            disabled={disabled || uploading}
            onClick={() => onImageUrlChange('')}
          >
            Remove image
          </button>
        </div>
      ) : (
        <p className="product-image-hint">
          {allowUrlInput
            ? 'No image yet — upload or paste a URL below.'
            : 'No image yet — upload a file below.'}
        </p>
      )}

      <div className="product-image-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="product-image-file-input"
          disabled={disabled || uploading}
          onChange={(e) => void handleFileChange(e.target.files?.[0])}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
        {!isSupabaseConfigured && (
          <span className="product-image-demo-note">
            Demo: saved locally in browser
          </span>
        )}
      </div>

      {allowUrlInput && (
        <label className="product-image-url-label">
          Or image URL
          <input
            type="url"
            value={imageUrl}
            disabled={disabled || uploading}
            placeholder="https://…"
            onChange={(e) => onImageUrlChange(e.target.value)}
          />
        </label>
      )}

      {uploadError && <p className="product-image-error">{uploadError}</p>}
    </div>
  )
}

import { useRef, useState } from 'react'
import { uploadProductImage } from '../../services/adminApi'
import type { ProductImageFormData } from '../../types'
import './ProductImagesField.css'

interface ProductImagesFieldProps {
  images: ProductImageFormData[]
  onChange: (images: ProductImageFormData[]) => void
  disabled?: boolean
}

export default function ProductImagesField({
  images,
  onChange,
  disabled = false,
}: ProductImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function removeRow(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  function moveRow(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= images.length) return
    const copy = [...images]
    const [item] = copy.splice(index, 1)
    copy.splice(next, 0, item)
    onChange(copy)
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setUploadError(null)
    try {
      const uploaded: ProductImageFormData[] = []
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file)
        uploaded.push({ image_url: url })
      }
      onChange([...images, ...uploaded])
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="product-images-field">
      <span className="field-label">Product images</span>
      <p className="field-hint product-images-field-intro">
        First image is the shop cover. Add more for a gallery slider on the
        product page.
      </p>

      {images.length > 0 && (
        <ul className="product-images-admin-list">
          {images.map((row, index) => (
            <li key={row.id ?? `img-${index}-${row.image_url}`} className="product-images-admin-item">
              <div className="product-images-admin-thumb">
                <img src={row.image_url} alt="" />
                {index === 0 && (
                  <span className="product-images-admin-cover">Cover</span>
                )}
              </div>
              <div className="product-images-admin-actions">
                <button
                  type="button"
                  className="btn-link"
                  disabled={disabled || index === 0}
                  onClick={() => moveRow(index, -1)}
                  aria-label="Move image up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-link"
                  disabled={disabled || index === images.length - 1}
                  onClick={() => moveRow(index, 1)}
                  aria-label="Move image down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-link danger"
                  disabled={disabled}
                  onClick={() => removeRow(index)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="product-images-admin-upload">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="product-image-file-input"
          disabled={disabled || uploading}
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : '+ Add images'}
        </button>
      </div>

      {uploadError && <p className="product-image-error">{uploadError}</p>}
    </div>
  )
}

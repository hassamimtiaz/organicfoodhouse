import { uploadProductImage } from '../../services/adminApi'
import ImageUploadField from './ImageUploadField'

interface ProductImageFieldProps {
  imageUrl: string
  onImageUrlChange: (url: string) => void
  disabled?: boolean
}

export default function ProductImageField({
  imageUrl,
  onImageUrlChange,
  disabled = false,
}: ProductImageFieldProps) {
  return (
    <ImageUploadField
      label="Product image"
      imageUrl={imageUrl}
      onImageUrlChange={onImageUrlChange}
      onUpload={uploadProductImage}
      disabled={disabled}
      allowUrlInput={false}
    />
  )
}

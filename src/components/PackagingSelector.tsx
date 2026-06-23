import { formatPricePKR } from '../config/site'
import {
  formatPackagingLabel,
  getPackagingUnitPrice,
  hasPackagings,
} from '../config/packaging'
import type { Product, ProductPackaging } from '../types'
import './PackagingSelector.css'

interface PackagingSelectorProps {
  product: Pick<Product, 'id' | 'packagings' | 'discount_percent'>
  value: string | null
  onChange: (packagingId: string) => void
  size?: 'default' | 'large'
}

export default function PackagingSelector({
  product,
  value,
  onChange,
  size = 'default',
}: PackagingSelectorProps) {
  const options = product.packagings ?? []
  if (!hasPackagings(product) || options.length === 0) return null

  return (
    <fieldset
      className={`packaging-selector packaging-selector--${size}`}
      aria-label="Choose your box"
    >
      <legend>Box options</legend>
      <div className="packaging-options">
        {options.map((packaging) => (
          <PackagingOption
            key={packaging.id}
            product={product}
            packaging={packaging}
            checked={value === packaging.id}
            onSelect={() => onChange(packaging.id)}
          />
        ))}
      </div>
    </fieldset>
  )
}

function PackagingOption({
  product,
  packaging,
  checked,
  onSelect,
}: {
  product: Pick<Product, 'id' | 'packagings' | 'discount_percent'>
  packaging: ProductPackaging
  checked: boolean
  onSelect: () => void
}) {
  const disabled = !packaging.in_stock
  const price = getPackagingUnitPrice(product, packaging)

  return (
    <label
      className={`packaging-option${checked ? ' is-selected' : ''}${
        disabled ? ' is-disabled' : ''
      }`}
    >
      <input
        type="radio"
        name={`packaging-${product.id}`}
        value={packaging.id}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      <span className="packaging-option-body">
        <span className="packaging-option-label">
          {formatPackagingLabel(packaging)}
        </span>
        <span className="packaging-option-price">{formatPricePKR(price)}</span>
        {disabled && (
          <span className="packaging-option-unavailable">Unavailable</span>
        )}
      </span>
    </label>
  )
}

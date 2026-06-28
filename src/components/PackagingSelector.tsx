import { formatPricePKR } from '../config/site'
import {
  formatPackagingLabel,
  getPackagingUnitPrice,
  hasPackagings,
} from '../config/packaging'
import { getAdvanceOrderLabel, allowsAdvanceOrderWhenOutOfStock } from '../config/preorder'
import {
  formatPackagingStockHint,
  getPackagingRemaining,
  isPackagingOrderable,
  isPackagingSelectable,
  shouldShowLowStock,
} from '../lib/packagingStock'
import type { Product, ProductPackaging } from '../types'
import './PackagingSelector.css'

interface PackagingSelectorProps {
  product: Pick<Product, 'id' | 'packagings' | 'discount_percent' | 'in_stock' | 'sold_out_mode'>
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
  product: Pick<Product, 'id' | 'packagings' | 'discount_percent' | 'in_stock' | 'sold_out_mode'>
  packaging: ProductPackaging
  checked: boolean
  onSelect: () => void
}) {
  const selectable = isPackagingSelectable(product, packaging)
  const physicallyOut = !isPackagingOrderable(packaging)
  const advance = allowsAdvanceOrderWhenOutOfStock(product as Product)
  const disabled = !selectable
  const price = getPackagingUnitPrice(product, packaging)
  const remaining = getPackagingRemaining(packaging)
  const showLowStock =
    remaining != null && shouldShowLowStock(remaining) && physicallyOut === false

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
        {showLowStock && (
          <span className="packaging-option-low-stock">
            {formatPackagingStockHint(remaining)}
          </span>
        )}
        {disabled && (
          <span className="packaging-option-unavailable">Sold out</span>
        )}
        {!disabled && advance && physicallyOut && (
          <span className="packaging-option-advance">
            {getAdvanceOrderLabel(product as Product)}
          </span>
        )}
      </span>
    </label>
  )
}

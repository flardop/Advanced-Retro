-- =============================================================================
-- eBay product-level overrides (optional)
-- =============================================================================
-- Add fields to let each product store:
-- - ebay_query: custom query text sent to eBay Browse API
-- - ebay_marketplace_id: preferred marketplace per product (EBAY_ES, EBAY_GB, etc.)
--
-- Safe to run multiple times.
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ebay_query TEXT;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ebay_marketplace_id TEXT;

CREATE INDEX IF NOT EXISTS idx_products_ebay_marketplace_id
  ON products (ebay_marketplace_id);

COMMENT ON COLUMN products.ebay_query IS
  'Optional custom query override used by eBay market comparison.';

COMMENT ON COLUMN products.ebay_marketplace_id IS
  'Optional eBay marketplace override (e.g. EBAY_ES, EBAY_GB, EBAY_US).';

-- Optional examples:
-- UPDATE products
--   SET ebay_query = 'pokemon yellow game boy color pal',
--       ebay_marketplace_id = 'EBAY_ES'
-- WHERE name = 'Pokémon Amarillo';


# Product data

The Excel workbook is the editing source. Export it to `data/products.json` before deploying the static site.

```bash
python tools/excel-to-products-json.py swedsnus_product_data.xlsx --out data/products.json --pretty
```

The website reads `data/products.json` and uses the rows as sellable variants. Rows with the same `product_id` are grouped into one product, and the variant fields become dropdown options on the product page.

Important fields:

- `product_id`: groups variants into one product
- `variant_id`: identifies the specific variant row
- `product_family`: Portionssnus, Lössnus, Aromer or Tillbehör
- `site_section`: controls listing placement, for example Portionssnus, Lössnus, Gör eget or Vitt snus
- `tobacco_type`: Tobak, Tobaksfri or Ej tillämpligt
- `taste_display`: detailed product-page taste text
- `taste_variables`: shorter filter values used by the sidebar
- `visible_on_site`: set to No to exclude a row from the website

Images are intentionally rendered as placeholders for now.

# Frontend architecture

Interactive pages load `app.js` as the single application entry point.

Dependency order:

1. `commerce.css`
2. `layout.js`
3. `product-data.js`
4. `product-experience.js`
5. Catalog-only scripts when needed
6. `main.js`

Responsibilities:

- `layout.js`: shared layout and navigation.
- `product-data.js`: product data and rendering.
- `product-experience.js`: product visuals and carousels.
- `catalog-filters.js`: catalog filters and mobile filter drawer.
- `catalog-filter-modal-stack.js`: catalog sorting and stacking safeguard.
- `main.js`: cart, bookmarks, authentication and account behavior.

New fixes should be made in the existing owner rather than added as one-off patch files.

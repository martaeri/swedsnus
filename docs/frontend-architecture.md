# Frontend architecture

All pages load `app.js` as the single application entry point.

Dependency order:

1. `commerce.css`
2. `layout.js`
3. `product-data.js`
4. `product-experience.js`
5. `catalog-filters.js` on catalog pages
6. `main.js`

Responsibilities:

- `app.js`: shared dependency selection and load order.
- `layout.js`: shared layout and navigation.
- `product-data.js`: product data and rendering.
- `product-experience.js`: product visuals and carousels.
- `catalog-filters.js`: catalog pills, sidebar filters, sorting and the mobile filter modal.
- `main.js`: cart, bookmarks, authentication and account behavior.

New fixes should be made in the existing owner rather than added as one-off patch files.

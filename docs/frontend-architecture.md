# Frontend architecture

All pages load `app.js` as the single application entry point.

Dependency order:

1. `commerce.css`
2. `ui-popovers.js`
3. `layout.js`
4. `product-data.js`
5. `product-experience.js`
6. `catalog-filters.js` on catalog pages
7. `main.js`

Responsibilities:

- `app.js`: shared dependency selection and load order.
- `ui-popovers.js`: shared outside-click, click-suppression and Escape handling for blocking popup menus.
- `layout.js`: shared layout and navigation, including hamburger menu rendering.
- `product-data.js`: product data and rendering.
- `product-experience.js`: product visuals and carousels.
- `catalog-filters.js`: catalog pills, sidebar filters, sorting and the mobile filter modal.
- `main.js`: cart, bookmarks, authentication and account behavior.

New fixes should be made in the existing owner rather than added as one-off patch files.
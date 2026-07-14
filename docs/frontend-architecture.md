# Frontend architecture

All pages load `app.js` as the single application entry point.

Dependency order:

1. `commerce.css`
2. `commerce-core.js`
3. `ui-popovers.js`
4. `layout.js`
5. `product-data.js`
6. `product-experience.js`
7. `catalog-filters.js` on catalog pages
8. `cart.js`
9. `main.js`

Responsibilities:

- `app.js`: shared dependency selection and load order.
- `commerce-core.js`: shared storage keys, local/session storage access, selectors and common formatting utilities.
- `ui-popovers.js`: shared outside-click, click-suppression and Escape handling for blocking popup menus.
- `layout.js`: shared layout and navigation, including hamburger menu rendering.
- `product-data.js`: product data and rendering.
- `product-experience.js`: product visuals and carousels.
- `catalog-filters.js`: catalog pills, sidebar filters, sorting and the mobile filter modal.
- `cart.js`: sole live owner of cart additions, quantity changes, removals, storage, totals and cart rendering.
- `main.js`: temporary coordinator for product cards, bookmarks, authentication and account behavior. Its legacy cart functions are dormant and remain only until the final physical cleanup pass.

Migration order for `main.js`:

1. Shared helpers in `commerce-core.js`.
2. Live cart behavior in `cart.js`.
3. Bookmark behavior in a focused module.
4. Authentication and account behavior in focused modules.
5. Remove dormant cart code and keep `main.js` only for remaining coordination.

New fixes should be made in the existing owner rather than added as one-off patch files.

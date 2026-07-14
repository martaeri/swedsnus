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
8. `main.js`

Responsibilities:

- `app.js`: shared dependency selection and load order.
- `commerce-core.js`: shared storage keys, local/session storage access, selectors and common formatting utilities.
- `ui-popovers.js`: shared outside-click, click-suppression and Escape handling for blocking popup menus.
- `layout.js`: shared layout and navigation, including hamburger menu rendering.
- `product-data.js`: product data and rendering.
- `product-experience.js`: product visuals and carousels.
- `catalog-filters.js`: catalog pills, sidebar filters, sorting and the mobile filter modal.
- `main.js`: temporary coordinator for cart, bookmarks, authentication and account behavior while those areas are extracted into focused modules.

Migration order for `main.js`:

1. Move shared helpers to `commerce-core.js`.
2. Extract cart behavior.
3. Extract bookmarks behavior.
4. Extract authentication and account behavior.
5. Reduce `main.js` to application coordination, then remove it if no coordination remains.

New fixes should be made in the existing owner rather than added as one-off patch files.

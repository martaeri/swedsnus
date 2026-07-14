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
9. `auth.js`
10. `bookmarks.js`
11. `account.js`
12. `main.js`

Responsibilities:

- `app.js`: shared dependency selection and load order.
- `commerce-core.js`: shared storage keys, local/session storage access, selectors and common formatting utilities.
- `ui-popovers.js`: shared outside-click, click-suppression and Escape handling for blocking popup menus.
- `layout.js`: shared layout and navigation, including hamburger menu rendering.
- `product-data.js`: product data and rendering.
- `product-experience.js`: product visuals and carousels.
- `catalog-filters.js`: catalog pills, sidebar filters, sorting and the mobile filter modal.
- `cart.js`: cart additions, quantity changes, removals, storage, totals and cart rendering.
- `auth.js`: authentication session state, login modal, auth tabs, login/logout actions and protected-route gating.
- `bookmarks.js`: saved-product storage, bookmark button state, bookmark-page rendering and bookmark actions.
- `account.js`: login-page, account-page and order-page rendering plus account tabs.
- `main.js`: shared product-card normalization/navigation, homepage carousel and showcase setup, product-page quantity/pack controls, support forms and prototype-only actions.

The feature extraction from `main.js` is complete. New work should modify the existing owner above instead of adding one-off patch files or duplicate listeners.

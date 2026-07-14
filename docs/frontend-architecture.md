# Frontend architecture

All pages load `app.js` as the single application entry point.

Dependency order:

1. `commerce.css`, `themes.css` and `product-components.css`
2. `commerce-core.js`
3. `ui-feedback.js`
4. `ui-popovers.js`
5. `layout.js`
6. `product-data.js`
7. `product-records.js`
8. `product-experience.js`
9. `catalog-filters.js` on catalog pages
10. `cart.js`
11. `auth.js`
12. `bookmarks.js`
13. `account.js`
14. `main.js`

Responsibilities:

- `app.js`: shared stylesheet selection, script dependency selection and load order.
- `commerce-core.js`: shared storage keys, local/session storage access, selectors and common formatting utilities.
- `ui-feedback.js`: shared toast creation, timing and display behavior.
- `ui-popovers.js`: shared outside-click, click-suppression and Escape handling for blocking popup menus.
- `layout.js`: header, footer, theme switcher, counters, shared navigation and hamburger menu rendering. It consumes `commerce-core.js` rather than defining storage or formatting helpers.
- `product-data.js`: product data and rendering.
- `product-records.js`: product URL normalization, selected pack/price lookup, metadata extraction and shared product-record creation from cards or product pages.
- `product-experience.js`: product visuals and carousels.
- `catalog-filters.js`: catalog pills, sidebar filters, sorting and the mobile filter modal.
- `cart.js`: cart additions, quantity changes, removals, storage, totals and cart rendering.
- `auth.js`: authentication session state, login modal, auth tabs, login/logout actions and protected-route gating.
- `bookmarks.js`: saved-product storage, bookmark button state, bookmark-page rendering and bookmark actions.
- `account.js`: login-page, account-page and order-page rendering plus account tabs.
- `main.js`: shared product-card normalization/navigation, homepage carousel and showcase setup, product-page quantity/pack controls, support forms and prototype-only actions.

The major frontend ownership areas are centralized. New work should modify the existing owner above instead of adding one-off patch files, duplicate product extraction, duplicate storage helpers or duplicate listeners.

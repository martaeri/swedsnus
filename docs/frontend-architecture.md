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
- `styles.css`: base design tokens, global layout primitives, header, navigation, footer and general component foundations.
- `themes.css`: theme-specific visual overrides. It should change colors, typography, borders, radii and decorative presentation without owning structural page layout.
- `commerce.css`: shared commerce-component structure and responsive behavior used across product cards, cart, bookmarks, account and product pages.
- `product-components.css`: reusable product-component presentation that is not tied to one page type.
- `catalog.css`: assortment-page structure, category pills, catalog filters, filter-sidebar positioning, catalog product-grid behavior and catalog-specific responsive rules.
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

CSS ownership rules:

1. A structural measurement must have one owner. Shared widths, sticky offsets, viewport gaps and column sizes should be declared as named custom properties in the stylesheet that owns the component.
2. Base selectors define the default component. Responsive blocks may override only behavior required at that breakpoint.
3. Theme selectors may change appearance but should not repeat structural measurements already owned by the base or page stylesheet.
4. The same property for the same selector and breakpoint should not be declared twice. If a later rule intentionally replaces an earlier one, the selectors must describe different scopes clearly.
5. Page HTML must not contain inline style patches for shared components.
6. New fixes should update the existing owner instead of adding a patch stylesheet, page-specific override or duplicate selector.

Catalog layout tokens are owned by `catalog.css` on `.catalog-page-with-external-sidebar`. The sidebar width, centered content width, layout gap, sticky offset and viewport height calculation must be changed through those tokens rather than repeated numeric values inside component rules.

The major frontend ownership areas are centralized. New work should modify the existing owner above instead of adding one-off patch files, duplicate product extraction, duplicate storage helpers or duplicate listeners.
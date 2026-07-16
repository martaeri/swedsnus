# Frontend architecture

All pages load `app.js` as the single application entry point.

Dependency order:

1. `commerce.css`, `themes.css`, `product-components.css` and `seo-content.css`
2. `commerce-core.js`
3. `ui-feedback.js`
4. `ui-popovers.js`
5. `layout.js`
6. `product-data.js`
7. `product-records.js`
8. `product-experience.js`
9. `product-content.js` on product pages
10. `catalog-filters.js` on catalog pages
11. `cart.js`
12. `auth.js`
13. `bookmarks.js`
14. `account.js`
15. `main.js`
16. `seo-content.js`
17. `legal-content.js`

Responsibilities:

- `app.js`: shared stylesheet selection, script dependency selection and load order.
- `styles.css`: base design tokens, global layout primitives, header, navigation, footer and general component foundations.
- `themes.css`: theme-specific visual overrides. It should change colors, typography, borders, radii and decorative presentation without owning structural page layout.
- `commerce.css`: shared commerce-component structure and responsive behavior used across product cards, cart, bookmarks, account and product pages.
- `product-components.css`: reusable product-component presentation that is not tied to one page type, including the single shared visual definition for product-related legal notices and the shared product-information cards.
- `seo-content.css`: shared presentation for visible knowledge sections, category information, guide resources and FAQ content.
- `catalog.css`: assortment-page structure, category pills, catalog filters, external filter-sidebar placement, catalog product-grid behavior and catalog-specific responsive rules.
- `commerce-core.js`: shared storage keys, local/session storage access, selectors and common formatting utilities.
- `ui-feedback.js`: shared toast creation, timing and display behavior.
- `ui-popovers.js`: shared outside-click, click-suppression and Escape handling for blocking popup menus.
- `layout.js`: header, footer, theme switcher, counters, shared navigation and hamburger menu rendering. It consumes `commerce-core.js` rather than defining storage or formatting helpers.
- `product-data.js`: product data and rendering.
- `product-records.js`: product URL normalization, selected pack/price lookup, metadata extraction and shared product-record creation from cards or product pages.
- `product-experience.js`: product visuals and carousels.
- `product-content.js`: shared long-form product-page sections, category-specific placeholder copy and the ingredients panel for portionssnus, lössnus, Gör Eget and vitt snus.
- `catalog-filters.js`: catalog pills, sidebar filters, sorting and the mobile filter modal.
- `cart.js`: cart additions, quantity changes, removals, storage, totals and cart rendering.
- `auth.js`: authentication session state, login modal, auth tabs, login/logout actions and protected-route gating.
- `bookmarks.js`: saved-product storage, bookmark button state, bookmark-page rendering and bookmark actions.
- `account.js`: login-page, account-page and order-page rendering plus account tabs.
- `main.js`: shared product-card normalization/navigation, homepage carousel and showcase setup, product-page quantity/pack controls, support forms and prototype-only actions.
- `seo-content.js`: guide resource enhancement, FAQ navigation and guide metadata. Main SEO copy remains visible in the relevant HTML templates.
- `legal-content.js`: shared age messaging, footer regulation copy, creation of the centralized nicotine-warning component and placement of that component wherever tobacco-free nicotine products are presented.

CSS ownership rules:

1. A structural measurement must have one owner. Shared widths, viewport gaps and column sizes should be declared as named custom properties in the stylesheet that owns the component.
2. Base selectors define the default component. Responsive blocks may override only behavior required at that breakpoint.
3. Theme selectors may change appearance but should not repeat structural measurements already owned by the base or page stylesheet.
4. The same property for the same selector and breakpoint should not be declared twice. If a later rule intentionally replaces an earlier one, the selectors must describe different scopes clearly.
5. Page HTML must not contain inline style patches for shared components.
6. New fixes should update the existing owner instead of adding a patch stylesheet, page-specific override or duplicate selector.

Catalog layout tokens are owned by `catalog.css` on `.catalog-page-with-external-sidebar`. The sidebar width, centered content width and layout gap must be changed through those tokens rather than repeated numeric values inside component rules.

Long-form product-page content must be created through `product-content.js`. Product templates and product-data rendering must not duplicate the section markup or category-specific placeholder copy. The shared visual treatment is owned by `product-components.css`.

SEO and informational content intended for indexing should be written visibly in the relevant page HTML whenever practical. `seo-content.js` may enhance navigation or add secondary guide resources, but must not hide keyword blocks, duplicate visible copy or create content solely for crawlers.

Legal notices and wording shared across pages must be handled by `legal-content.js`. The nicotine warning must always be created through its shared component factory and use the single `.nicotine-health-warning` presentation in `product-components.css`. Page layouts may control where the component is placed, but must not change its typography, padding, border or other visual treatment. Page-specific factual company information remains in the relevant HTML page, while required warnings and global age or regulation copy must not be duplicated in individual templates.

The major frontend ownership areas are centralized. New work should modify the existing owner above instead of adding one-off patch files, duplicate product extraction, duplicate storage helpers or duplicate listeners.

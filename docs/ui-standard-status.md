# UI standards status

## Official template adopted (v1.7.4)

- `frontend/src/csmju/`, `frontend/src/app/globals.css` and `frontend/public/csmju-logo.png` are unchanged copies from `standards/templates/csmju-subsystem-web` v1.7.4.
- Root layout uses CsmjuAppShell with activity navigation, conditional Head creation and ADMIN management links, verified session initials/role and the CORE_HUB_WEB_URL return link.
- Noto Sans Thai for body text; Plus Jakarta Sans with Thai fallback for headings, loaded via next/font.
- Shared buttons, cards, badges, form inputs, catalogue, account navigation and loading state.
- Inputs use 16px text; errors expose aria-invalid and aria-describedby; visible keyboard focus.
- Previous custom CSS classes have been migrated to Tailwind utilities in local components; no local sidebar/header or nested main landmarks remain.
- Shared button/card/input wrappers consume classes from `@/csmju/ui`; activity badges consume StatusBadge. Root loading/error/not-found use official template examples, including retry() on Next.js 16.
- Full signed-in email is shown in the content account line: the immutable template user API currently supports initials and roleLabel only.

## Required before declaring full compliance

The template's header search, notification/user buttons and footer links are placeholders without application callbacks. Request upstream functionality through PM/Core rather than modifying src/csmju. The template also always renders POST logout, including the signed-out view.

Local components remain registered in subsystem.yaml for team review. Registering does not imply PM approval. This adoption does not certify every form validation or API error-mapping rule.

Browser verification at 360px, keyboard navigation, real mobile checks and PL design review are still required. Passing TypeScript/build does not certify visual or accessibility compliance.

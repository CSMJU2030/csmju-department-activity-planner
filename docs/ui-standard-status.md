# UI standards status

## Implemented locally

- Standards v1.7.0 semantic colour tokens; shared spacing and radius use Tailwind utilities.
- Noto Sans Thai for body text; Plus Jakarta Sans with Thai fallback for headings, loaded via next/font.
- Shared buttons, cards, badges, form inputs, catalogue, account navigation and loading state.
- Inputs use 16px text; errors expose aria-invalid and aria-describedby; visible keyboard focus.
- Responsive grids and wrapping navigation; reduced-motion support.

## Required before declaring full compliance

The Core Hub revision a1df242e96545cf7941d976a3bbeeff673cd153e does not contain templates/csmju-subsystem-web, which standards/docs/ui-design-system.md section 17.0 requires. Request the official template from PM/Core and adopt its CsmjuAppShell, CsmjuLogo, csmju components and unchanged globals.css. The current header is still a local shell and the text brand is not the official logo.

The current CSS is a local migration of the former custom CSS, not a copy or fork of the unpublished template. It must be replaced when that template is provided. Register remaining local components in subsystem.yaml following the team review process.

Browser verification at 360px, keyboard navigation, real mobile checks and PL design review are still required. Passing TypeScript/build does not certify visual or accessibility compliance.

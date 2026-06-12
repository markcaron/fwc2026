import { html } from 'lit';

/** Down-chevron reused in select chips across components */
export const CARET = html`
  <svg class="chip-caret" viewBox="0 0 10 6" fill="none" aria-hidden="true" focusable="false">
    <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

export const ICON_CLOSE = `<svg viewBox="0 -960 960 960"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`;

export const ICON_DOCK_TO_RIGHT = `<svg viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm120-80v-560H200v560h120Zm80 0h360v-560H400v560Zm-80 0H200h120Z"/></svg>`;

export const ICON_MENU = `<svg viewBox="0 -960 960 960"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>`;

export const ICON_SEARCH = `<svg viewBox="0 -960 960 960"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>`;

export const ICON_ADD_CHAT = `<svg viewBox="0 -960 960 960"><path d="m40-40 78-268q-19-41-28.5-84T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80q-45 0-88-9.5T308-118L40-40Zm118-118 128-38q14-4 28.5-3t27.5 7q32 16 67 24t71 8q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 36 8 71t24 67q7 13 7.5 27.5T196-286l-38 128Zm282-162h80v-120h120v-80H520v-120h-80v120H320v80h120v120Zm39-159Z"/></svg>`;

export const ICON_CHEVRON_LEFT = `<svg viewBox="0 -960 960 960"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>`;

export const ICON_DELETE = `<svg viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;

export const ICON_DOWNLOAD = `<svg viewBox="0 -960 960 960"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;

export const ICON_SPINNER = `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke-width="24" stroke-dasharray="566" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="1s" repeatCount="indefinite"/><animate attributeName="stroke-dashoffset" dur="2s" values="200;500;200" repeatCount="indefinite"/></circle></svg>`;

export const iconProgress = (progress: number) =>
  `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke-width="24" opacity="0.2"></circle><circle cx="100" cy="100" r="88" fill="none" stroke-width="24" stroke-dasharray="566" stroke-dashoffset="${(1 - progress * 0.95) * 566}" transform="rotate(-90 100 100)" stroke-linecap="round"></circle></svg>`;

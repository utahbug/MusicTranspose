import {uiIcon} from './ui-icons.js';
// Exact MusicTranspose destination paths from 3f0fb00, using Batch 6 optical styling.
const destinationIcon=(name,paths)=>`<svg class="ui-icon icon-mt-${name}" data-icon="mt-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
// Shared decorative artwork; accessible names remain on the existing buttons.
export const lyricsIcon=destinationIcon('lyrics','<path d="M5 3h14v18H5zM8 7h8M8 10h6M8 14h8M8 17h6"/>');

// Single melodic line; same stroke weight and footprint as the Lyrics artwork.
export const leadIcon = `<svg class="lead-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path d="M3 9h22M3 14h22M3 19h22" opacity=".45"/><path d="M11 19V6l10-2v12M11 9l10-2"/><ellipse cx="8.5" cy="19.5" rx="2.5" ry="1.8" transform="rotate(-20 8.5 19.5)" fill="currentColor" stroke="none"/><ellipse cx="18.5" cy="16.5" rx="2.5" ry="1.8" transform="rotate(-20 18.5 16.5)" fill="currentColor" stroke="none"/></svg>`;

// Bravura engraved G clef (SMuFL U+E050), Steinberg Media Technologies, SIL OFL 1.1.
// Static outline: https://github.com/steinbergmedia/bravura/blob/master/redist/otf/Bravura.otf
// See vendor/Bravura-LICENSE.txt. No runtime font needed.
export const leadSheetIcon = `<svg class="lead-sheet-icon" viewBox="-180 -1143 1031 1846" aria-hidden="true" focusable="false"><path fill="currentColor" stroke="none" transform="scale(1 -1)" d="M376 415C374 427 376 428 382 434C398 449 419 470 438 491C522 583 572 702 572 815C572 902 548 988 507 1048C492 1070 466 1098 455 1098C441 1098 410 1072 390 1050C316 968 292 843 292 739C292 681 299 616 306 575C308 563 309 561 297 551C233 498 164 437 112 373C43 287 0 194 0 87C0 -87 119 -252 364 -252C387 -252 413 -250 433 -246C444 -244 446 -243 448 -255C460 -322 475 -409 475 -456C475 -604 375 -622 316 -622C262 -622 236 -606 236 -593C236 -586 245 -583 268 -576C299 -567 335 -540 335 -482C335 -427 300 -380 239 -380C172 -380 132 -433 132 -495C132 -560 171 -658 322 -658C389 -658 519 -628 519 -458C519 -401 501 -306 490 -244C488 -232 489 -233 503 -227C604 -187 671 -102 671 11C671 139 577 252 430 252C404 252 404 252 401 270ZM470 943C503 943 530 916 530 861C530 792 497 728 419 650C403 634 379 611 356 591C349 585 345 586 343 599C339 625 337 659 337 691C337 847 409 943 470 943ZM361 262C364 243 364 244 346 238C258 208 201 129 201 44C201 -46 248 -110 316 -133C324 -136 336 -139 343 -139C351 -139 355 -134 355 -128C355 -121 347 -118 340 -115C298 -97 268 -54 268 -8C268 49 307 92 368 109C384 113 386 112 388 101L438 -197C440 -208 439 -208 424 -211C408 -214 388 -216 368 -216C193 -216 80 -119 80 20C80 79 90 158 173 252C233 319 279 356 326 394C336 402 338 401 340 390ZM430 103C428 115 429 118 441 117C522 110 589 42 589 -46C589 -109 551 -160 495 -188C483 -194 481 -194 479 -182Z"/></svg>`;

// Corner controls share a 24px outline family; accessible names live on buttons.
export const scoreIcon=destinationIcon('score','<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 7h10M7 10h5M7 13h3M16 17V10"/><ellipse cx="14" cy="17" rx="2" ry="1.5" fill="currentColor"/>');
export const themeIcon=uiIcon('sun-moon');
export const fontSizeIcon=uiIcon('type');
// Primary app Tap Zones artwork, reused with the existing guide.
export const tapZonesIcon=destinationIcon('tap-zones','<path d="M12 2v3M5.7 4.7l2.1 2.1M18.3 4.7l-2.1 2.1M10.2 13V8.8a1.8 1.8 0 0 1 3.6 0v4.1l1.1-.8a1.7 1.7 0 0 1 2.4.4l1.2 1.8a3 3 0 0 1 .3 2.7l-1.1 3H10l-3.3-4.1a1.6 1.6 0 0 1 2.3-2.2l1.2.9V13Z"/>');

// Lyrics return-to-score control: compact notation, without a document outline.
export const musicIcon=uiIcon('music');

// List editing and ordering share the toolbar outline weight.
export const editIcon=uiIcon('pencil');
export const orderIcon=uiIcon('grip-vertical');
// Quiet outline/filled favorite, using the shared 24px outline family.
export const favoriteIcon=uiIcon('star');

// Saved collections and added files: distinct silhouettes in the 24px outline family.
export const listsIcon=destinationIcon('lists','<path d="M3 17V3h14"/><rect x="6" y="6" width="15" height="15" rx="2"/><path d="M13 11h4M13 16h4M10 11h.01M10 16h.01"/>');
export const filesIcon=destinationIcon('files','<path d="M3 19V5a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM15 16v-6l3 1"/><ellipse cx="13" cy="16" rx="2" ry="1.5"/>');

// Spiral notepad in the shared outline family; internal export name is retained.
export const textIcon=destinationIcon('notes','<rect x="5" y="4" width="15" height="17" rx="2"/><path d="M9 2v4M16 2v4M3 9h4M3 14h4M3 19h4M10 10h6M10 14h6M10 18h4"/>');

// Paired eighth notes for the List Type column only.
export const musicItemIcon=uiIcon('music');

// Tabler piano, MIT; source/license in vendor/tabler. Original paths, filled black keys.
export const keyboardIcon=destinationIcon('keyboard-front','<path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" /> <path d="M9 19v-6" /> <path d="M8 5v8h2v-8" fill="currentColor" /> <path d="M15 19v-6" /> <path d="M14 5v8h2v-8" fill="currentColor" />');

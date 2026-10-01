// Shared decorative artwork; accessible names remain on the existing buttons.
export const lyricsIcon = `<svg class="lyrics-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18M3 9h18M3 13h9M3 17h7M18 19v-6l3-1"/><ellipse cx="16" cy="19" rx="2" ry="1.5"/></svg>`;

// Single melodic line; same stroke weight and footprint as the Lyrics artwork.
export const leadIcon = `<svg class="lead-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path d="M3 9h22M3 14h22M3 19h22" opacity=".45"/><path d="M11 19V6l10-2v12M11 9l10-2"/><ellipse cx="8.5" cy="19.5" rx="2.5" ry="1.8" transform="rotate(-20 8.5 19.5)" fill="currentColor" stroke="none"/><ellipse cx="18.5" cy="16.5" rx="2.5" ry="1.8" transform="rotate(-20 18.5 16.5)" fill="currentColor" stroke="none"/></svg>`;

// Bravura engraved G clef (SMuFL U+E050), Steinberg Media Technologies, SIL OFL 1.1.
// Static outline: https://github.com/steinbergmedia/bravura/blob/master/redist/otf/Bravura.otf
// See vendor/Bravura-LICENSE.txt. No runtime font needed.
export const leadSheetIcon = `<svg class="lead-sheet-icon" viewBox="-180 -1143 1031 1846" aria-hidden="true" focusable="false"><path fill="currentColor" stroke="none" transform="scale(1 -1)" d="M376 415C374 427 376 428 382 434C398 449 419 470 438 491C522 583 572 702 572 815C572 902 548 988 507 1048C492 1070 466 1098 455 1098C441 1098 410 1072 390 1050C316 968 292 843 292 739C292 681 299 616 306 575C308 563 309 561 297 551C233 498 164 437 112 373C43 287 0 194 0 87C0 -87 119 -252 364 -252C387 -252 413 -250 433 -246C444 -244 446 -243 448 -255C460 -322 475 -409 475 -456C475 -604 375 -622 316 -622C262 -622 236 -606 236 -593C236 -586 245 -583 268 -576C299 -567 335 -540 335 -482C335 -427 300 -380 239 -380C172 -380 132 -433 132 -495C132 -560 171 -658 322 -658C389 -658 519 -628 519 -458C519 -401 501 -306 490 -244C488 -232 489 -233 503 -227C604 -187 671 -102 671 11C671 139 577 252 430 252C404 252 404 252 401 270ZM470 943C503 943 530 916 530 861C530 792 497 728 419 650C403 634 379 611 356 591C349 585 345 586 343 599C339 625 337 659 337 691C337 847 409 943 470 943ZM361 262C364 243 364 244 346 238C258 208 201 129 201 44C201 -46 248 -110 316 -133C324 -136 336 -139 343 -139C351 -139 355 -134 355 -128C355 -121 347 -118 340 -115C298 -97 268 -54 268 -8C268 49 307 92 368 109C384 113 386 112 388 101L438 -197C440 -208 439 -208 424 -211C408 -214 388 -216 368 -216C193 -216 80 -119 80 20C80 79 90 158 173 252C233 319 279 356 326 394C336 402 338 401 340 390ZM430 103C428 115 429 118 441 117C522 110 589 42 589 -46C589 -109 551 -160 495 -188C483 -194 481 -194 479 -182Z"/></svg>`;

// Corner controls share a 24px outline family; accessible names live on buttons.
const outline=paths=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
export const scoreIcon=outline('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 7h10M7 10h5M7 13h3M16 17V10"/><ellipse cx="14" cy="17" rx="2" ry="1.5" fill="currentColor"/>');
export const themeIcon=outline('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>');
export const fontSizeIcon=outline('<path d="M3 5h10M8 5v14M5 19h6M18 5v14m-3-11 3-3 3 3m-6 8 3 3 3-3"/>');
// Primary app Tap Zones artwork, reused with the existing guide.
export const tapZonesIcon=outline('<path d="M12 2v3M5.7 4.7l2.1 2.1M18.3 4.7l-2.1 2.1M10.2 13V8.8a1.8 1.8 0 0 1 3.6 0v4.1l1.1-.8a1.7 1.7 0 0 1 2.4.4l1.2 1.8a3 3 0 0 1 .3 2.7l-1.1 3H10l-3.3-4.1a1.6 1.6 0 0 1 2.3-2.2l1.2.9V13Z"/>');

// Lyrics return-to-score control: compact notation, without a document outline.
export const musicIcon=outline('<path d="M9 18V6l10-2v12M9 9l10-2"/><ellipse cx="7" cy="18" rx="2" ry="1.5"/><ellipse cx="17" cy="16" rx="2" ry="1.5"/>');

// Quiet outline/filled favorite, using the shared 24px outline family.
export const favoriteIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3 2.78 5.63L21 9.54l-4.5 4.38 1.06 6.19L12 17.19l-5.56 2.92 1.06-6.19L3 9.54l6.22-.91Z"/></svg>`;

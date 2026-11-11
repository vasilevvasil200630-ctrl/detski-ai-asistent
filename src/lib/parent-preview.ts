/**
 * „Виж като родител“: влезлият учител вижда сайта точно както родителите и гостите — публичната
 * част, без менюто на облака. Само изглед: бисквитката не дава и не отнема права, сървърът по нея
 * избира единствено коя начална страница да покаже. Изчезва при затваряне на браузъра.
 */
export const PARENT_PREVIEW_COOKIE = "parentPreview";

export function readParentPreview(): boolean {
  try {
    return document.cookie.split("; ").some((c) => c === `${PARENT_PREVIEW_COOKIE}=1`);
  } catch {
    return false;
  }
}

/** Включва прегледа и отваря началната страница за родителите (цяло зареждане — сървърът да я покаже). */
export function startParentPreview(): void {
  document.cookie = `${PARENT_PREVIEW_COOKIE}=1; path=/; SameSite=Lax`;
  window.location.assign("/");
}

/** Връща учителя в облака. */
export function stopParentPreview(): void {
  document.cookie = `${PARENT_PREVIEW_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
  window.location.assign("/");
}

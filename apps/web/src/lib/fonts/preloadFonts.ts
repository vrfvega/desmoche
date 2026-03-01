const APP_FONT_FAMILY = "Minecraft";
const FONT_LOAD_SPEC = `16px "${APP_FONT_FAMILY}"`;

export async function preloadFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return;
  }

  await document.fonts.load(FONT_LOAD_SPEC);
  await document.fonts.ready;
}

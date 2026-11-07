() => {
  // Ejecútala justo después de cada pulsación de Tab (browser_press_key "Tab").
  // Dice qué elemento tiene el foco y si se ve: outline o sombra (ring-*)
  // distintos de "nada". Un foco con "visible: false" es un fallo (guía §4: foco visible).
  const el = document.activeElement;
  if (!el || el === document.body) return { foco: "body (nada enfocado)" };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
  const sombra = cs.boxShadow && cs.boxShadow !== "none";
  let nombre = el.tagName.toLowerCase();
  if (el.id) nombre += "#" + el.id;
  return {
    foco: nombre,
    texto: (el.getAttribute("aria-label") || el.innerText || el.value || "").replace(/\s+/g, " ").trim().slice(0, 40),
    focusVisible: el.matches(":focus-visible"),
    visible: Boolean(outline || sombra),
    outline: outline ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : "ninguno",
    sombra: sombra ? cs.boxShadow.slice(0, 60) : "ninguna",
    enPantalla: r.bottom > 0 && r.top < window.innerHeight && r.width > 0,
  };
}

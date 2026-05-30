export function loadGoogleFont(fontFamily: string) {
  const name = fontFamily.split(",")[0].trim();
  const id = `gf-${name.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

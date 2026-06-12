// Prerender de /vendas e /planos.
// Roda DEPOIS do `vite build` (gatilho `postbuild`). Sobe um `vite preview` do
// dist, abre cada rota num Chromium headless, espera a animacao do hero assentar
// e salva o HTML ja renderizado em dist/<rota>/index.html.
// Objetivo: o celular pinta o conteudo na 1a resposta, sem esperar todo o JS.
// Nao mexe em provider nenhum: o Chromium tem window/localStorage de verdade.
//
// IMPORTANTE: prerenderiza SO /vendas e /planos. NUNCA / (raiz), porque
// dist/index.html e o shell que toda rota SPA usa no fallback.

import { spawn } from "node:child_process";
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");

const ROUTES = ["/vendas", "/planos"];
const PORT = 4178;
const BASE = `http://localhost:${PORT}`;
// Tempo pra animacao de entrada (framer-motion) terminar antes do snapshot.
// O hero da Vendas tem delays ate ~1.15s; 2000ms da folga.
const SETTLE_MS = 2000;

function waitForServer(url, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolveReady, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolveReady();
      } catch {
        // server ainda subindo
      }
      if (Date.now() - started > timeoutMs) return reject(new Error("preview nao subiu a tempo"));
      setTimeout(tick, 300);
    };
    tick();
  });
}

async function main() {
  // garante que o build existe
  try {
    await access(resolve(distDir, "index.html"));
  } catch {
    console.error("[prerender] dist/index.html nao encontrado. Rode `vite build` antes.");
    process.exit(1);
  }

  // import dinamico: se puppeteer nao estiver instalado, avisa e NAO quebra o build
  let puppeteer;
  try {
    puppeteer = (await import("puppeteer")).default;
  } catch {
    console.warn("[prerender] puppeteer ausente — pulando prerender (build segue normal).");
    return;
  }

  // sobe o preview do dist
  // shell:true e obrigatorio no Windows: o Node novo recusa spawn de .cmd
  // (vite/npx sao .cmd la) sem shell — gera EINVAL.
  const preview = spawn(
    "npx vite preview --port " + PORT + " --strictPort",
    { cwd: resolve(__dirname, ".."), stdio: "ignore", shell: true }
  );

  const cleanup = () => {
    try { preview.kill(); } catch { /* noop */ }
  };

  try {
    await waitForServer(`${BASE}/vendas`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle0", timeout: 30000 });
      // deixa o framer-motion terminar a entrada (hero visivel no snapshot)
      await new Promise((r) => setTimeout(r, SETTLE_MS));

      const html = await page.evaluate(
        () => "<!DOCTYPE html>\n" + document.documentElement.outerHTML
      );

      const outPath = resolve(distDir, `.${route}`, "index.html");
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, html, "utf8");
      console.log(`[prerender] ok: ${route} -> dist${route}/index.html (${html.length} bytes)`);
      await page.close();
    }

    await browser.close();
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error("[prerender] falhou:", err);
  process.exit(1);
});

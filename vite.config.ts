import { defineConfig, type Plugin } from 'vite';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Subdomínio próprio (examples.carlosdj.com.br): tudo na raiz. Os arquivos usam import.meta.env.BASE_URL.
const BASE = '/';

// Cada pasta com um index.html é um exemplo. Pasta nova = página nova, sem mexer aqui.
const FORA = new Set(['node_modules', 'dist', 'public', 'comum', 'videos']);
const paginas: Record<string, string> = { index: resolve(__dirname, 'index.html') };
for (const pasta of readdirSync(__dirname, { withFileTypes: true })) {
  if (!pasta.isDirectory() || FORA.has(pasta.name) || pasta.name.startsWith('.')) continue;
  const html = resolve(__dirname, pasta.name, 'index.html');
  if (existsSync(html)) paginas[pasta.name] = html;
}

// Em dev: "/testeinicial" (sem a barra no fim) vai para "/testeinicial/". Em prod quem faz isso é o nginx.
function barraNoFim(): Plugin {
  return {
    name: 'barra-no-fim',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const caminho = (req.url ?? '').split('?')[0];
        const nome = caminho.slice(BASE.length);
        if (nome === 'index' || !(nome in paginas)) return next();
        res.statusCode = 302;
        res.setHeader('Location', `${caminho}/`);
        res.end();
      });
    },
  };
}

export default defineConfig({
  base: BASE,
  appType: 'mpa',
  plugins: [barraNoFim()],
  server: { port: 3005, strictPort: true, host: true },
  build: { rollupOptions: { input: paginas } },
});

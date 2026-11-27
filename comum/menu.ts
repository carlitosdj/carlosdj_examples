// Menu superior, igual em todos os exemplos.
// Cada página passa os próprios itens: um link (href) ou uma ação (aoClicar).

export type ItemMenu = {
  rotulo: string;
  href?: string;
  aoClicar?: () => void;
};

export type Menu = {
  /** Marca um item como ativo (pílula azul). -1 desmarca todos. */
  ativar(indice: number): void;
};

export function montarMenu(itens: ItemMenu[]): Menu {
  const raiz = import.meta.env.BASE_URL; // "/"

  const topo = document.createElement('header');
  topo.className = 'topo';
  topo.innerHTML = `
    <div class="topo-miolo">
      <a class="topo-marca" href="${raiz}">carlosdj<span> / examples</span></a>
      <button class="topo-abrir" type="button" aria-expanded="false" aria-controls="topo-itens">Menu</button>
      <nav class="topo-itens" id="topo-itens" aria-label="Menu do exemplo"></nav>
    </div>`;

  const nav = topo.querySelector<HTMLElement>('.topo-itens')!;
  const abrir = topo.querySelector<HTMLButtonElement>('.topo-abrir')!;

  const fechar = () => {
    topo.classList.remove('aberto');
    abrir.setAttribute('aria-expanded', 'false');
  };

  const elementos = itens.map((item) => {
    const el = document.createElement(item.href ? 'a' : 'button');
    el.textContent = item.rotulo;
    if (el instanceof HTMLAnchorElement) el.href = item.href!;
    else el.type = 'button';
    el.addEventListener('click', () => {
      fechar();
      item.aoClicar?.();
    });
    nav.append(el);
    return el;
  });

  abrir.addEventListener('click', () => {
    const aberto = topo.classList.toggle('aberto');
    abrir.setAttribute('aria-expanded', String(aberto));
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && fechar());

  // Transparente no alto da página; ganha fundo depois que a rolagem começa.
  const aoRolar = () => topo.classList.toggle('rolou', window.scrollY > 20);
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  document.body.prepend(topo);

  return {
    ativar(indice) {
      elementos.forEach((el, i) => el.classList.toggle('ativo', i === indice));
    },
  };
}

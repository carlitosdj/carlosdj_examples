// Sequência de quadros num <canvas>.
//
// A ideia toda desses sites cabe aqui: o vídeo já foi fatiado em imagens (./quadros.sh),
// a página baixa todas antes de começar, e a cada passo da rolagem alguém chama
// desenhar(numero-do-quadro). Quem decide o número é o GSAP, lá no main.ts do exemplo.

export type Sequencia = {
  /** Quantos quadros existem. */
  total: number;
  /** "d" (deitado) ou "c" (em pé, celular). */
  versao: 'd' | 'c';
  /** Baixa todos os quadros. Avisa o andamento de 0 a 1. */
  carregar(aoAndar?: (parte: number) => void): Promise<void>;
  /** Desenha o quadro (0 = primeiro). Aceita número quebrado: arredonda. */
  desenhar(indice: number): void;
  /** Refaz o tamanho do canvas (chamar quando a janela mudar). */
  ajustar(): void;
};

const AO_MESMO_TEMPO = 6; // quantas imagens baixam juntas

export async function criarSequencia(canvas: HTMLCanvasElement, pasta: string): Promise<Sequencia> {
  const base = `${import.meta.env.BASE_URL}${pasta}/quadros/`;
  const { total } = (await (await fetch(`${base}info.json`)).json()) as { total: number };

  // Tela em pé usa o recorte em pé: mais leve e mais nítido, porque a altura é o que manda.
  const versao = window.innerWidth < window.innerHeight ? 'c' : 'd';

  const tela = canvas.getContext('2d')!;
  const quadros: (HTMLImageElement | undefined)[] = new Array(total);
  let atual = -1;

  const endereco = (i: number) => `${base}${versao}/${String(i + 1).padStart(4, '0')}.webp`;

  function baixar(i: number): Promise<void> {
    return new Promise((pronto) => {
      const img = new Image();
      img.onload = () => {
        quadros[i] = img;
        pronto();
      };
      img.onerror = () => pronto(); // quadro que falhou é pulado (desenha o anterior)
      img.src = endereco(i);
    });
  }

  async function carregar(aoAndar?: (parte: number) => void) {
    // O primeiro vem sozinho, para a tela já mostrar alguma coisa.
    await baixar(0);
    ajustar();
    let feitos = 1;
    aoAndar?.(feitos / total);

    let proximo = 1;
    const fila = async () => {
      while (proximo < total) {
        await baixar(proximo++);
        aoAndar?.(++feitos / total);
      }
    };
    await Promise.all(Array.from({ length: AO_MESMO_TEMPO }, fila));
  }

  function pintar(i: number) {
    // Se o quadro pedido não existe, usa o mais próximo antes dele.
    let img = quadros[i];
    for (let j = i - 1; !img && j >= 0; j--) img = quadros[j];
    if (!img) return;

    // Recorte "cover": a imagem cobre o canvas inteiro, sem deformar, e sobra é cortada.
    const { width: lc, height: ac } = canvas;
    const escala = Math.max(lc / img.naturalWidth, ac / img.naturalHeight);
    const l = img.naturalWidth * escala;
    const a = img.naturalHeight * escala;
    tela.drawImage(img, (lc - l) / 2, (ac - a) / 2, l, a);
  }

  function desenhar(indice: number) {
    const i = Math.min(total - 1, Math.max(0, Math.round(indice)));
    if (i === atual) return; // a rolagem dispara muitas vezes no mesmo quadro
    atual = i;
    pintar(i);
  }

  function ajustar() {
    // Tela de alta densidade: o canvas precisa de mais pontos que o tamanho em CSS (até 2x).
    const densidade = Math.min(window.devicePixelRatio || 1, 2);
    const l = Math.round(canvas.clientWidth * densidade);
    const a = Math.round(canvas.clientHeight * densidade);
    if (canvas.width === l && canvas.height === a) return;
    canvas.width = l;
    canvas.height = a;
    if (atual >= 0) pintar(atual);
  }

  return { total, versao, carregar, desenhar, ajustar };
}

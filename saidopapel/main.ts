// ========================================
// Teste 2: "Sai do papel".
//
// O vídeo continua sendo quadros num canvas (igual ao teste inicial). A novidade é o que
// mais entra na MESMA linha do tempo:
//   a) o texto troca de lado quando o celular ocupa o meio da imagem (os véus trocam junto)
//   b) as letras de uma frase voam até o celular, junto com a tinta do vídeo
//   c) dois contadores (papel e app) e a cor de destaque mudam com a rolagem
//   d) a lista conferida aparece item por item
// Todas as posições são frações da rolagem: 0 = começo, 1 = fim.
// ========================================
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../comum/base.css';
import './estilo.css';
import { montarMenu } from '../comum/menu';
import { criarSequencia } from '../comum/sequencia';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const TELAS_DE_ROLAGEM = 5;
const SUAVIDADE = 0.6;

// Tamanho dos quadros deitados e onde está o celular neles (fração da imagem) quando as letras chegam.
const VIDEO = { largura: 1280, altura: 720 };
const CELULAR = { x: 0.76, y: 0.47 };
/** Em que ponto da rolagem o texto passa da esquerda para a direita. */
const TROCA_DE_LADO = 0.68;

// Quantas linhas "saem do papel" nos contadores.
const LINHAS = 48;

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const palco = el('palco');
const quadro = el('quadro');
const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tela em pé tem outro desenho (vídeo no alto, texto embaixo). Decidido uma vez, junto com
// a versão dos quadros; se o aparelho girar, a página recarrega no outro formato.
const emPe = window.innerWidth < window.innerHeight;
document.documentElement.classList.toggle('em-pe', emPe);
window.addEventListener('resize', () => {
  if (window.innerWidth < window.innerHeight !== emPe) location.reload();
});

let trecho: ScrollTrigger | undefined;

function irPara(parte: number) {
  const topo = trecho ? trecho.start + (trecho.end - trecho.start) * parte : 0;
  window.scrollTo({ top: topo, behavior: semMovimento ? 'auto' : 'smooth' });
}

const menu = montarMenu([
  { rotulo: 'Caderno', aoClicar: () => irPara(0.24) },
  { rotulo: 'Tinta', aoClicar: () => irPara(0.46) },
  { rotulo: 'Celular', aoClicar: () => irPara(0.94) },
  { rotulo: 'O que tem de novo', aoClicar: () => el('como').scrollIntoView({ behavior: semMovimento ? 'auto' : 'smooth' }) },
  { rotulo: 'Exemplos', href: import.meta.env.BASE_URL },
]);

el('voltar').addEventListener('click', (e) => {
  e.preventDefault();
  irPara(0);
});

async function iniciar() {
  const sequencia = await criarSequencia(el<HTMLCanvasElement>('tela'), 'saidopapel');
  const inicio = performance.now();

  await sequencia.carregar((parte) => {
    el('carga-numero').textContent = String(Math.round(parte * 100));
    el('carga-barra').style.transform = `scaleX(${parte})`;
  });

  mostrarNumeros(sequencia.total, sequencia.versao, performance.now() - inicio);
  window.addEventListener('resize', () => sequencia.ajustar());

  if (semMovimento) {
    // Sem animação: o último quadro (celular conferido) e as frases como texto comum.
    document.documentElement.classList.add('sem-movimento');
    sequencia.ajustar();
    sequencia.desenhar(sequencia.total - 1);
  } else {
    sequencia.desenhar(0);
    animar(sequencia.total, (n) => sequencia.desenhar(n));
  }

  document.documentElement.classList.remove('carregando');
  el('carga').classList.add('pronta');
  ScrollTrigger.refresh();
}

function animar(total: number, desenhar: (quadro: number) => void) {
  const linha = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: palco,
      start: 'top top',
      end: `+=${TELAS_DE_ROLAGEM * 100}%`,
      pin: true,
      scrub: SUAVIDADE,
      invalidateOnRefresh: true, // se a janela mudar, as distâncias das letras são refeitas
      onUpdate: (st) => aoAndar(st.progress),
    },
  });
  trecho = linha.scrollTrigger!;

  // ---------- O vídeo (igual ao teste inicial) ----------
  const estado = { quadro: 0 };
  linha.to(estado, { quadro: total - 1, duration: 1, onUpdate: () => desenhar(estado.quadro) }, 0);

  // ---------- a) O texto troca de lado ----------
  // Só na tela deitada. O véu da esquerda sai e o da direita entra; a última frase já mora à direita (CSS).
  if (!emPe) {
    linha.to('#veu-esq', { autoAlpha: 0, duration: 0.06 }, TROCA_DE_LADO);
    linha.fromTo('#veu-dir', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, TROCA_DE_LADO);
  }

  // ---------- As frases ----------
  const ENTRADA = 0.045;
  document.querySelectorAll<HTMLElement>('.frase').forEach((frase) => {
    const de = Number(frase.dataset.de);
    const ate = Number(frase.dataset.ate);

    if (de === 0) gsap.set(frase, { autoAlpha: 1 });
    else linha.fromTo(frase, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: ENTRADA, ease: 'power2.out' }, de);

    if (frase.dataset.voa) {
      // b) esta não some: as letras vão embora, e a etiqueta de cima apaga junto
      voar(linha, frase, Number(frase.dataset.voa), ate);
      linha.to(frase.querySelector('.sobre'), { autoAlpha: 0, duration: ENTRADA }, ate - 0.1);
      linha.set(frase, { autoAlpha: 0 }, ate);
    } else if (ate < 1) {
      linha.to(frase, { autoAlpha: 0, y: -40, duration: ENTRADA, ease: 'power2.in' }, ate - ENTRADA);
    }
  });

  // ---------- c) Contadores e cor de destaque ----------
  const conta = { papel: LINHAS, app: 0 };
  const escrever = () => {
    el('n-papel').textContent = String(Math.round(conta.papel));
    el('n-app').textContent = String(Math.round(conta.app));
  };
  linha.fromTo('#travessia', { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.17);
  // a tinta sai do caderno entre 0,25 e 0,62 do vídeo; o celular enche entre 0,5 e 0,9
  linha.to(conta, { papel: 0, duration: 0.37, onUpdate: escrever }, 0.25);
  linha.to(conta, { app: LINHAS, duration: 0.4, onUpdate: escrever }, 0.5);
  linha.to('#fio-ponto', { left: '100%', duration: 0.65 }, 0.25);
  linha.to('#fio-cheio', { scaleX: 1, duration: 0.65 }, 0.25);
  // do tom do papel para o azul do site (variável CSS, usada pelas etiquetas e barras)
  linha.fromTo(palco, { '--acento': 'rgb(233, 207, 155)' }, { '--acento': 'rgb(169, 205, 236)', duration: 0.4 }, 0.3);

  // ---------- d) Lista conferida ----------
  document.querySelectorAll<HTMLElement>('.conferidos li').forEach((item) => {
    const em = Number(item.dataset.em);
    linha.fromTo(item, { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: 0.03, ease: 'power2.out' }, em);
    linha.fromTo(item.querySelector('i'), { scale: 0 }, { scale: 1, duration: 0.035, ease: 'back.out(2.5)' }, em + 0.012);
  });

  const faixas = [0.17, 0.36, 0.68]; // onde começam Caderno, Tinta e Celular no menu
  function aoAndar(parte: number) {
    el('andamento').style.transform = `scaleX(${parte})`;
    menu.ativar(faixas.filter((f) => parte >= f).length - 1);
  }
  aoAndar(0);

  ScrollTrigger.create({ trigger: '#como', start: 'top 60%', onEnter: () => menu.ativar(3), onLeaveBack: () => menu.ativar(2) });
}

/**
 * b) As letras seguem a tinta.
 * Cada letra faz um arco da posição dela até o celular do vídeo, uma depois da outra,
 * encolhendo e sumindo no caminho. Volta tudo ao rolar para cima, como o resto.
 */
function voar(linha: gsap.core.Timeline, frase: HTMLElement, de: number, ate: number) {
  const titulo = frase.querySelector<HTMLElement>('[data-letras]')!;
  const letras = quebrarEmLetras(titulo);

  const voo = (ate - de) * 0.55; // quanto dura o voo de uma letra
  const passo = ((ate - de) * 0.45) / letras.length; // intervalo entre uma letra e a seguinte

  letras.forEach((letra, i) => {
    const quando = de + i * passo;
    const arco = gsap.utils.random(50, 150);
    const giro = gsap.utils.random(-50, 50);
    const espalha = gsap.utils.random(-30, 30);

    // Quanto falta, em x e y, da letra até o alvo (medido sem contar as animações em andamento).
    const falta = () => {
      const a = alvo();
      const p = posicao(letra);
      return { x: a.x - p.x + espalha, y: a.y - p.y + espalha * 0.5 };
    };

    // x anda direto; y sobe primeiro e depois desce: os dois juntos desenham o arco.
    linha.to(letra, { x: () => falta().x, duration: voo, ease: 'power1.in' }, quando);
    linha.to(letra, { y: () => Math.min(0, falta().y) - arco, duration: voo * 0.45, ease: 'power2.out' }, quando);
    linha.to(letra, { y: () => falta().y, duration: voo * 0.55, ease: 'power2.in' }, quando + voo * 0.45);
    linha.to(
      letra,
      { scale: 0.25, rotation: giro, opacity: 0, filter: emPe ? 'none' : 'blur(4px)', duration: voo * 0.6, ease: 'power1.in' },
      quando + voo * 0.4,
    );
  });
}

/** Troca o texto por um <span> por letra (palavras ficam inteiras na quebra de linha). */
function quebrarEmLetras(titulo: HTMLElement): HTMLElement[] {
  const texto = titulo.textContent ?? '';
  titulo.setAttribute('aria-label', texto); // leitor de tela continua lendo a frase inteira
  titulo.textContent = '';
  const letras: HTMLElement[] = [];

  texto.split(' ').forEach((palavra, i, todas) => {
    const bloco = document.createElement('span');
    bloco.className = 'palavra';
    bloco.setAttribute('aria-hidden', 'true');
    for (const caractere of palavra) {
      const letra = document.createElement('span');
      letra.className = 'letra';
      letra.textContent = caractere;
      bloco.append(letra);
      letras.push(letra);
    }
    titulo.append(bloco);
    if (i < todas.length - 1) titulo.append(' ');
  });
  return letras;
}

/** Centro de um elemento dentro do palco, ignorando transform (offset não enxerga animação). */
function posicao(elemento: HTMLElement) {
  let x = elemento.offsetWidth / 2;
  let y = elemento.offsetHeight / 2;
  for (let no: HTMLElement | null = elemento; no && no !== palco; no = no.offsetParent as HTMLElement | null) {
    x += no.offsetLeft;
    y += no.offsetTop;
  }
  return { x, y };
}

/** Onde está o celular do vídeo, em pontos do palco, na hora em que as letras chegam. */
function alvo() {
  if (emPe) {
    return { x: quadro.offsetWidth * 0.66, y: quadro.offsetTop + quadro.offsetHeight * 0.5 };
  }
  // Tela deitada: a imagem cobre a tela ("cover"), então parte dela fica para fora.
  // É a mesma conta do desenho no canvas (comum/sequencia.ts), para achar o celular na tela.
  const l = palco.offsetWidth;
  const a = palco.offsetHeight;
  const escala = Math.max(l / VIDEO.largura, a / VIDEO.altura);
  return {
    x: (l - VIDEO.largura * escala) / 2 + CELULAR.x * VIDEO.largura * escala,
    y: (a - VIDEO.altura * escala) / 2 + CELULAR.y * VIDEO.altura * escala,
  };
}

function mostrarNumeros(total: number, versao: 'd' | 'c', ms: number) {
  el('m-total').textContent = String(total);
  el('m-versao').textContent = versao === 'c' ? 'Quadrada' : 'Deitada';
  el('m-tempo').textContent = `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
  const bytes = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
    .filter((r) => r.name.includes('/saidopapel/quadros/') && r.name.endsWith('.webp'))
    .reduce((soma, r) => soma + (r.encodedBodySize || r.decodedBodySize), 0);
  if (bytes) el('m-peso').textContent = `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;
}

iniciar().catch((erro) => {
  console.error(erro);
  el('carga').querySelector('.carga-texto')!.textContent = 'Não foi possível carregar os quadros.';
});

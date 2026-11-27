// ========================================
// Teste inicial: vídeo que anda com a rolagem.
//
// Leia de cima para baixo, é a ordem em que as coisas acontecem:
//   1. monta o menu
//   2. baixa os quadros (comum/sequencia.ts)
//   3. cria UMA linha do tempo do GSAP, presa à rolagem pelo ScrollTrigger
//   4. pendura nela o vídeo e as frases
// ========================================
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../comum/base.css';
import './estilo.css';
import { montarMenu } from '../comum/menu';
import { criarSequencia } from '../comum/sequencia';

gsap.registerPlugin(ScrollTrigger);
// No celular a barra do navegador some e volta: sem isto, cada vez recalcula tudo e dá tranco.
ScrollTrigger.config({ ignoreMobileResize: true });

/** Quantas telas de rolagem o vídeo dura. Maior = mais devagar. Experimente 2 ou 8. */
const TELAS_DE_ROLAGEM = 4;
/** Quanto a imagem "atrasa" para alcançar a rolagem, em segundos. 0 = colado no dedo. */
const SUAVIDADE = 0.5;

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const palco = el('palco');
const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// O trecho da rolagem em que o palco fica preso (preenchido no passo 3).
let trecho: ScrollTrigger | undefined;

/** Leva a página até um ponto do vídeo: 0 = começo, 1 = fim. */
function irPara(parte: number) {
  const topo = trecho ? trecho.start + (trecho.end - trecho.start) * parte : 0;
  window.scrollTo({ top: topo, behavior: semMovimento ? 'auto' : 'smooth' });
}

// ---------- 1. Menu ----------
const bastidores = el('bastidores');
const menu = montarMenu([
  { rotulo: 'Dia', aoClicar: () => irPara(0.28) },
  { rotulo: 'Entardecer', aoClicar: () => irPara(0.6) },
  { rotulo: 'Noite', aoClicar: () => irPara(0.92) },
  { rotulo: 'Como funciona', aoClicar: () => el('como').scrollIntoView({ behavior: semMovimento ? 'auto' : 'smooth' }) },
  { rotulo: 'Bastidores', aoClicar: () => bastidores.classList.toggle('escondido') },
]);

el('voltar').addEventListener('click', (e) => {
  e.preventDefault();
  irPara(0);
});

async function iniciar() {
  // ---------- 2. Quadros ----------
  const sequencia = await criarSequencia(el<HTMLCanvasElement>('tela'), 'testeinicial');
  const inicio = performance.now();

  await sequencia.carregar((parte) => {
    el('carga-numero').textContent = String(Math.round(parte * 100));
    el('carga-barra').style.transform = `scaleX(${parte})`;
  });

  mostrarNumeros(sequencia.total, sequencia.versao, performance.now() - inicio);
  window.addEventListener('resize', () => sequencia.ajustar());

  if (semMovimento) {
    // Sem animação: um quadro do entardecer, parado. O CSS (.sem-movimento) empilha as frases.
    document.documentElement.classList.add('sem-movimento');
    sequencia.ajustar();
    sequencia.desenhar(Math.round(sequencia.total * 0.7));
  } else {
    sequencia.desenhar(0);
    animar(sequencia.total, (quadro) => sequencia.desenhar(quadro));
  }

  // Libera a rolagem e tira a tela de carregamento.
  document.documentElement.classList.remove('carregando');
  el('carga').classList.add('pronta');
  ScrollTrigger.refresh();
}

function animar(total: number, desenhar: (quadro: number) => void) {
  // ---------- 3. A linha do tempo ----------
  // Ela não "toca" sozinha: o scrub entrega o controle para a rolagem.
  // A duração total é 1, então toda posição abaixo é uma fração: 0.5 = meio do vídeo.
  const linha = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: palco,
      start: 'top top', // começa quando o topo do palco encosta no topo da tela
      end: `+=${TELAS_DE_ROLAGEM * 100}%`, // e dura N telas de rolagem
      pin: true, // o palco fica parado enquanto isso
      scrub: SUAVIDADE,
      onUpdate: (st) => aoAndar(st.progress),
    },
  });
  trecho = linha.scrollTrigger!;

  // ---------- 4a. O vídeo ----------
  // O GSAP anima um número comum (estado.quadro) de 0 até o último quadro.
  // A cada mudança, o canvas desenha o quadro correspondente. É só isso.
  const estado = { quadro: 0 };
  linha.to(
    estado,
    {
      quadro: total - 1,
      duration: 1,
      onUpdate: () => {
        desenhar(estado.quadro);
        el('b-quadro').textContent = `quadro ${String(Math.round(estado.quadro) + 1).padStart(3, '0')}/${total}`;
      },
    },
    0,
  );

  // ---------- 4b. As frases ----------
  // Cada .frase traz no HTML o trecho em que fica visível (data-de e data-ate).
  const ENTRADA = 0.05; // quanto da linha do tempo dura o aparecer/sumir
  document.querySelectorAll<HTMLElement>('.frase').forEach((frase) => {
    const de = Number(frase.dataset.de);
    const ate = Number(frase.dataset.ate);

    if (de === 0) gsap.set(frase, { autoAlpha: 1 }); // a primeira já começa na tela
    else linha.fromTo(frase, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: ENTRADA, ease: 'power2.out' }, de);

    // A última fica até o fim: o palco sai da tela com ela.
    if (ate < 1) linha.to(frase, { autoAlpha: 0, y: -48, duration: ENTRADA, ease: 'power2.in' }, ate - ENTRADA);
  });

  linha.to('#dica', { autoAlpha: 0, duration: 0.04 }, 0.02);

  // Porcentagem da rolagem, barra de andamento e item ativo do menu.
  // (O número do quadro é atualizado acima: com SUAVIDADE ele chega um pouco depois da rolagem.)
  const faixas = [0.2, 0.48, 0.78]; // onde começam Dia, Entardecer e Noite
  function aoAndar(parte: number) {
    el('b-parte').textContent = `${Math.round(parte * 100)}%`;
    el('andamento').style.transform = `scaleX(${parte})`;
    menu.ativar(parte >= 1 ? -1 : faixas.filter((f) => parte >= f).length - 1);
  }
  aoAndar(0);

  // Passou do palco: nenhum item do menu fica marcado.
  ScrollTrigger.create({ trigger: '#como', start: 'top 60%', onEnter: () => menu.ativar(3), onLeaveBack: () => menu.ativar(2) });
}

/** Preenche os números da seção "Como funciona" com o que foi medido nesta visita. */
function mostrarNumeros(total: number, versao: 'd' | 'c', ms: number) {
  el('b-versao').textContent = versao === 'c' ? 'em pé' : 'deitado';
  el('n-total').textContent = el('n-quadros').textContent = String(total);
  el('n-versao').textContent = versao === 'c' ? 'Em pé' : 'Deitado';
  el('n-tempo').textContent = `${(ms / 1000).toFixed(1).replace('.', ',')} s`;

  // O navegador sabe o tamanho de cada arquivo que baixou.
  const bytes = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
    .filter((r) => r.name.includes('/quadros/') && r.name.endsWith('.webp'))
    .reduce((soma, r) => soma + (r.encodedBodySize || r.decodedBodySize), 0);
  if (bytes) el('n-peso').textContent = `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;
}

iniciar().catch((erro) => {
  console.error(erro);
  el('carga').querySelector('.carga-texto')!.textContent = 'Não foi possível carregar os quadros.';
});

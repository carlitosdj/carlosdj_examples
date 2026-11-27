// Página inicial: os cartões saem de comum/exemplos.ts.
import './base.css';
import './inicio.css';
import { montarMenu } from './menu';
import { EXEMPLOS } from './exemplos';

const raiz = import.meta.env.BASE_URL;

montarMenu([
  ...EXEMPLOS.map((e) => ({ rotulo: e.titulo, href: `${raiz}${e.pasta}/` })),
  { rotulo: 'carlosdj.com.br', href: 'https://carlosdj.com.br' },
]);

const lista = document.getElementById('lista')!;
for (const exemplo of EXEMPLOS) {
  const cartao = document.createElement('a');
  cartao.className = 'exemplo';
  cartao.href = `${raiz}${exemplo.pasta}/`;

  const capa = document.createElement('img');
  capa.src = `${raiz}${exemplo.capa}`;
  capa.alt = '';
  capa.loading = 'lazy';

  const corpo = document.createElement('div');
  const titulo = document.createElement('h2');
  titulo.textContent = exemplo.titulo;
  const texto = document.createElement('p');
  texto.textContent = exemplo.texto;
  const etiquetas = document.createElement('ul');
  for (const nome of exemplo.etiquetas) {
    const li = document.createElement('li');
    li.textContent = nome;
    etiquetas.append(li);
  }

  corpo.append(titulo, texto, etiquetas);
  cartao.append(capa, corpo);
  lista.append(cartao);
}

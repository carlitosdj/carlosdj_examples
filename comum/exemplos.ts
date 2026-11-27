// Lista da página inicial. Exemplo novo = uma linha nova aqui.
export type Exemplo = {
  pasta: string;
  titulo: string;
  texto: string;
  /** Imagem do cartão, a partir da raiz do site */
  capa: string;
  etiquetas: string[];
};

export const EXEMPLOS: Exemplo[] = [
  {
    pasta: 'testeinicial',
    titulo: 'Teste inicial',
    texto: 'Uma casa que vai do dia à noite conforme você rola. Vídeo de 5 s fatiado em 121 quadros.',
    capa: 'testeinicial/quadros/d/0085.webp',
    etiquetas: ['GSAP', 'ScrollTrigger', 'Canvas'],
  },
];

# examples

examples.carlosdj.com.br. Laboratório do carlosdj: ideias de página testadas antes de virarem site. Hoje, vídeo que anda com a rolagem (GSAP + ScrollTrigger + canvas).

Vite sem framework, uma pasta por exemplo. Sem banco e sem API.

## Rodar

```
cd ../bin_carlosdj && ./deploy.sh dev up examples
```

Abre em http://localhost:3715/ (o teste: `/testeinicial/`).

## Pastas

| Pasta | O que é |
|---|---|
| `comum/` | O que todo exemplo usa: `menu.ts` (menu superior), `sequencia.ts` (quadros no canvas), `base.css` (cores e fonte do site), `exemplos.ts` (lista da página inicial) |
| `testeinicial/` | O exemplo: `index.html` (frases e trechos), `main.ts` (GSAP), `estilo.css` |
| `saidopapel/` | Teste 2: vídeo em tela cheia, o texto troca de lado quando o celular ocupa o meio, as letras de uma frase voam até o celular, contadores e lista conferida na mesma linha do tempo. No celular o recorte é quadrado (`PROPORCAO=1 ./quadros.sh videos/saidopapel.mp4 saidopapel 0.46`) |
| `public/<exemplo>/quadros/` | Os quadros gerados: `d/` deitado, `c/` em pé, `info.json` |
| `videos/` | Vídeos originais. Não vão para o git, nem para o build, nem para o servidor: guarde uma cópia |

## Exemplo novo com outro vídeo

1. Coloque o vídeo em `videos/` e gere os quadros: `./quadros.sh videos/novo.mp4 novo`
   (3º argumento opcional: o foco do recorte em pé, de 0 a 1).
2. Copie a pasta `testeinicial/` para `novo/` e troque `'testeinicial'` por `'novo'` no `main.ts`.
3. Acrescente uma linha em `comum/exemplos.ts`.
4. Reinicie o container (`./deploy.sh dev restart examples`): a página nova é achada pela pasta.

## O que mexer para entender

- `TELAS_DE_ROLAGEM` e `SUAVIDADE`, no alto do `testeinicial/main.ts`.
- `data-de` e `data-ate` de cada `.frase` no `index.html`: o trecho (0 a 1) em que ela aparece.
- `QUALIDADE=45 ./quadros.sh ...` para ver quanto o peso cai e até onde a imagem aguenta.

## Publicar

Push na `main` de `carlitosdj/carlosdj_examples`. O `.github/workflows/ci.yaml` confere os tipos e o build, faz o rsync para `/www/wwwroot/nodeapps/examples_carlosdj` e sobe o container com o `docker-compose.prod.yml` daqui.

O container atende em `127.0.0.1:4904`. O subdomínio chega por proxy reverso no painel do servidor: `examples.carlosdj.com.br` → `http://127.0.0.1:4904`.

Os quadros (`public/*/quadros/`) vão no git: são o que a página mostra. Fica fora do Google (`noindex` no HTML, no cabeçalho e no `robots.txt`).

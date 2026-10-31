# Hydro Addon

Overhaul vanilla para Minecraft Bedrock (1.26.60): classes de armadura, progressão em oito tiers e uma fórmula de defesa nova.
O design completo está no documento de design do projeto.

## Pastas

```
Hydro_BP/                      pacote de comportamento
  blocks/                      blocos (caldeirão, fornalha infernal)
  items/armaduras/<conjunto>/  GERADO: uma pasta por armadura
  items/materiais/             GERADO: pepitas, lingotes, chapas...
  recipes/armaduras/           GERADO: receitas de upgrade das armaduras
  recipes/materiais/           receitas de bancada feitas à mão
  recipes/fornalhas/           fornalha, alto-forno, fogueira e fornalha infernal
  scripts/
    main.js                    ponto de entrada: liga os sistemas e o loop de 1 segundo
    config.js                  TODOS os números de balanceamento
    dados/armaduras.js         GERADO: tabela de armaduras usada pelo script
    sistemas/                  defesa, oxidação, raios, habilidades, minérios, caldeirão, hud, comandos
    util/                      equipamento e clima
Hydro_RP/                      pacote de recursos
  attachables/armaduras/       GERADO: como cada armadura aparece no corpo
  textures/items/armaduras/    ícones das armaduras, uma pasta por conjunto
  textures/items/materiais/    ícones dos materiais
  textures/models/armor/       camadas das armaduras no corpo (<conjunto>_1 e _2)
  textures/blocks/             texturas dos blocos novos
  models/blocks/               modelo do caldeirão
  ui/hud_screen.json           troca a barra de armadura pela Defesa Hydro
  texts/                       GERADO: traduções
tools/
  dados.mjs                    fonte única das armaduras, materiais e nomes
  gerar.mjs                    gera os arquivos marcados como GERADO
```

## Como adicionar ou mudar uma armadura

1. Edite `tools/dados.mjs` (tier, classe, receita, durabilidade, nomes).
2. Rode `npm run gerar`.
3. Coloque as texturas em `Hydro_RP/textures/items/armaduras/<conjunto>/` e `Hydro_RP/textures/models/armor/`.
4. Habilidades vão em `Hydro_BP/scripts/sistemas/habilidades.js` (ou `raios.js`), e os números em `config.js`.

Não edite à mão os arquivos das pastas GERADO: o gerador apaga e recria essas pastas.

## Ferramentas

- `npm install` uma vez, para o VS Code entender a Script API.
- `npm run gerar` recria os arquivos gerados.
- `npm run checar` procura erros de tipo nos scripts.
- `empacotar.ps1` gera o `.mcaddon`.

## Comandos de teste (no jogo)

`/scriptevent hydro:defesa` (Defesa Hydro e quanto dano passa), `hydro:oxidar`, `hydro:limpar`, `hydro:chances`,
`hydro:tempestade` (liga ou desliga uma tempestade simulada) e `hydro:raio` (força o para-raios).

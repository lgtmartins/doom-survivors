# DOOM Survivors

Survival roguelike em **primeira pessoa** com os sprites de DOOM / DOOM II: sobreviva a 10 ondas de
demônios numa arena, suba de nível escolhendo upgrades e derrote o Spider Mastermind.

Projeto da disciplina de Jogos Digitais. Feito com **Phaser 3 + Vite**, JavaScript (ES modules), sem backend.

## Como rodar

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo.

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

```bash
npm run build      # gera o site estático em dist/
npm run preview    # serve a pasta dist/ para conferir o build
```

O build usa caminhos relativos: a pasta `dist/` pode ser publicada em qualquer hospedagem estática
(itch.io, GitHub Pages, Netlify...).

## Controles

| Tecla | Ação |
|---|---|
| **W A S D** | andar (A e D andam de lado) |
| **Mouse** | mirar — clique na tela para capturar o cursor |
| **Setas ← →** ou **Q / E** | girar pelo teclado (as setas ↑ ↓ também andam) |
| **Clique esquerdo** (segurar) | atirar |
| **Espaço** | dash: um arranque curto, invencível durante o movimento |
| **1 – 6** ou **scroll** | trocar de arma |
| **Clique direito** | dispara a BFG 9000 sem precisar selecioná-la |
| **ESC** ou **P** | pausa (a sensibilidade do mouse é ajustada ali) |
| **M** | liga/desliga o som |

## Como se joga

- Inimigos mortos soltam **poções azuis de XP**. Chegue perto para recolher.
- Ao subir de nível o jogo pausa e oferece **3 cartas**: dano, cadência, vida, novas armas, evoluções...
- **Armas**: pistola → shotgun (nível 2) → chaingun (4) → lança-foguetes (6) → rifle de plasma (8) → BFG 9000 (10).
  A BFG é a "ultimate": limpa a tela, mas tem recarga longa.
- **Itens raros**: medkit, armadura, Soulsphere, **berserk** (dano em dobro), **invulnerabilidade** e
  **Megasphere** (puxa todo o XP do mapa).
- O **radar** no canto superior direito mostra quem vem pelas costas. As faixas vermelhas nas bordas
  mostram de que lado veio o golpe.
- Depois da onda 10 vem o **Spider Mastermind**: rajada de metralhadora (corra de lado ou use um pilar),
  anéis de orbes (passe pelos vãos) e reforços. Abaixo de 50% de vida ele entra em **fúria**.
- O recorde fica salvo no navegador.

### Inimigos

| Inimigo | Comportamento |
|---|---|
| **Blob** | fraco, vem em enxame e morde |
| **Lost Soul** | para, grita e se lança em linha reta — desvie de lado |
| **Banshee** | mais rápida que você; explode ao encostar. Mate de longe (ela leva as vizinhas junto) |
| **Ghoul** | mantém distância e atira raios |
| **Vassago** | tanque: bolas de fogo que deixam o chão queimando |

## Estrutura do código

```
src/
  main.js            configuração do Phaser
  config.js          resolução, FOV e outras constantes
  data/              BALANCEAMENTO: tudo que é número está aqui
    armas.js  inimigos.js  ondas.js  chefe.js  upgrades.js  itens.js  mapa.js
  entities/          Jogador, Inimigo (IA por tipo), Chefe, Projeteis, Itens, Efeitos
  systems/           Armas, Horda (pool + grade espacial), Diretor (ondas), CampoDeFluxo,
                     Entrada, Sons, Pool, Recorde
  render/            Raycaster (o "motor 3D"), texturas procedurais, banco de sprites
  scenes/            Boot, Menu, Jogo, Hud, Cartas (level-up), Pausa, Fim
tools/               recorte dos assets e teste automatizado
public/assets/       atlas gerados (PNG + JSON)
Assets/              sheets originais do Spriters Resource (entrada do recorte)
```

Para balancear, mexa em `src/data/`. Exemplos: vida e velocidade de um monstro em `inimigos.js`;
quantos nascem por onda em `ondas.js`; dano e cadência das armas em `armas.js`; os números do
jogador (vida, velocidade, dash) no topo de `entities/Jogador.js`.

### Decisões técnicas

- **Primeira pessoa com raycaster.** O mundo é um mapa 2D em grade; a vista é pintada pixel a pixel
  num buffer de 320×168 (a área de jogo do Doom original) e ampliada 3× pelo Phaser com
  `pixelArt: true` e `Scale.FIT`. Paredes por DDA, chão por linha, céu cilíndrico e sprites em
  billboard com z-buffer.
- **Sem Arcade Physics.** O Arcade só enxerga GameObjects 2D do Phaser; aqui as entidades são objetos
  simples desenhados pelo raycaster. A colisão é feita à mão: círculo × grade (`data/mapa.js`) e
  círculo × círculo com grade espacial (`systems/Horda.js`).
- **Pooling** para inimigos, projéteis, itens, efeitos e para a lista de sprites do renderizador:
  nenhuma alocação por quadro no caminho quente.
- **Tudo em delta time**, com o delta limitado a 50 ms.
- **Perseguição por campo de fluxo**: uma busca em largura a partir do jogador, 5 vezes por segundo,
  guia a horda inteira em volta dos pilares.

## Assets e ferramentas

Os atlas em `public/assets/` são gerados a partir das sheets de `Assets/`:

```bash
npm run assets     # refaz os atlas (tools/recortar.mjs)
npm run teste      # sobe o jogo num Edge/Chrome headless e acusa erros de console
```

O mapeamento completo de cada sprite está em [ASSETS.md](ASSETS.md).

Acrescentar `?debug` à URL liga atalhos de teste: **K** mata todos, **N** próxima onda, **B** chefão,
**L** sobe de nível, **G** modo deus.

## Créditos

- **Sprites e gráficos**: © **id Software** / Bethesda — *DOOM*, *DOOM II* e *Legacy of Rust*.
- **Rips**, via [The Spriters Resource](https://www.spriters-resource.com/): Dolphman (Lost Soul, armas,
  rosto do HUD), Planz Doom (Vassago), MG12 (Spider Mastermind e Blob do id Vault), PGE (Ghoul),
  DaColGy, 16-Bit Globe e SuperDave938 (efeitos, menu e HUD).
- **Texturas de cenário, sons e música**: gerados por código neste projeto.
- **Engine**: [Phaser 3](https://phaser.io) (MIT). **Build**: [Vite](https://vitejs.dev).

Projeto acadêmico, sem fins lucrativos. DOOM é marca registrada da id Software LLC; este projeto não
é afiliado nem endossado pela id Software ou pela Bethesda.

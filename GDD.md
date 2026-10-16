# DOOM Survivors — Game Design Document (simplificado)

**Equipe:** Luiz Guilherme Tiritan Martins, Pedro Guermandi Bressan e Gustavo Messa Corbe
**Disciplina:** Jogos Digitais

---

## 1. Visão geral

| | |
|---|---|
| **Título** | DOOM Survivors |
| **Gênero** | Survival roguelike de arena ("survivors-like") em primeira pessoa |
| **Plataforma** | Navegador (PC), teclado e mouse |
| **Duração de uma partida** | cerca de 9 a 11 minutos |
| **Público** | jogadores de ação que gostam de partidas curtas e de evoluir o personagem a cada tentativa |
| **Referências** | *DOOM* (1993) pelo visual e pela visão em primeira pessoa; *Vampire Survivors* pela estrutura de hordas, XP e cartas de upgrade |

**Resumo (pitch):** o jogador está preso numa arena tomada pelo inferno e precisa sobreviver a 10
ondas de demônios cada vez maiores. Cada inimigo derrotado deixa XP; a cada nível o jogo pausa e
oferece três cartas de upgrade. Depois da última onda chega o chefão, o Spider Mastermind.

## 2. Objetivo e condições de fim

- **Vitória:** sobreviver às 10 ondas e derrotar o Spider Mastermind.
- **Derrota:** a vida do jogador chega a zero.
- Ao fim da partida aparecem as estatísticas (tempo, onda, abates, nível, dano causado e sofrido)
  e o que matou o jogador. Os recordes ficam salvos no navegador.

## 3. Loop de jogo

```
anda e atira → inimigo morre → solta XP → recolhe XP → sobe de nível
     ↑                                                      ↓
     └──────────── escolhe 1 de 3 cartas (fica mais forte) ←┘
```

As ondas ficam mais numerosas e os inimigos mais resistentes, então o jogador precisa evoluir as
armas e escolher bem as cartas para acompanhar.

## 4. Controles

| Ação | Tecla |
|---|---|
| Andar | W A S D (A e D andam de lado) |
| Mirar | mouse (setas ← → ou Q/E também giram) |
| Atirar | clique esquerdo (segurar) |
| Dash | espaço — arranque curto, invencível durante o movimento |
| Trocar de arma | 1 a 6 ou scroll do mouse |
| BFG 9000 | clique direito |
| Pausa | ESC ou P |
| Som | M |

## 5. Jogador

- **Vida:** 100 (aumenta com a carta *Vitalidade* e com a Soulsphere).
- **Armadura:** absorve 1/3 do dano recebido; máximo 200.
- **Velocidade:** 4,7 unidades por segundo.
- **Dash:** 0,17 s, recarga de 2,2 s; durante o dash o jogador não toma dano.
- **Invencibilidade após dano:** 0,55 s, para que um grupo de inimigos não tire toda a vida de uma vez.

## 6. Armas

Todas as armas ficam disponíveis por cartas ao subir de nível; cada uma pode evoluir mais 3 vezes.
Um multiplicador geral (`PODER_DE_FOGO`, hoje 2×) se aplica ao dano de todas elas.

| Tecla | Arma | Libera no nível | Funcionamento | Dano base | Intervalo |
|---|---|---|---|---|---|
| 1 | Pistola | início | tiro instantâneo e preciso | 16 | 0,30 s |
| 2 | Shotgun | 2 | 7 balins em leque, forte de perto | 11 por balim | 0,82 s |
| 3 | Chaingun | 4 | cadência muito alta, menos precisa | 10 | 0,085 s |
| 4 | Lança-foguetes | 6 | foguete que explode em área (raio 2,6) | 85 | 0,80 s |
| 5 | Rifle de plasma | 8 | rajada de bolas de plasma | 17 | 0,095 s |
| 6 | BFG 9000 | 10 | "ultimate": explosão enorme (raio 5) e dano extra em todo inimigo à vista | 420 | recarga de 18 s |

## 7. Inimigos

| Inimigo | Papel | Comportamento | Vida base | Aparece na onda |
|---|---|---|---|---|
| Blob | enxame | vem em bando e morde | 24 | 1 |
| Lost Soul | investida | para, grita e se lança em linha reta | 34 | 2 |
| Banshee | kamikaze | mais rápida que o jogador; explode ao encostar e leva as vizinhas junto | 40 | 3 |
| Ghoul | atirador | voa, mantém distância e dispara raios | 55 | 4 |
| Vassago | tanque | lento e resistente; bolas de fogo que deixam o chão queimando | 520 | 5 |

A vida dos inimigos cresce 20% a cada onda. Os inimigos nascem fora da visão do jogador e usam um
campo de fluxo para contornar os pilares da arena.

## 8. Chefão: Spider Mastermind

- **Vida:** 24.000, com barra de vida no topo da tela.
- **Padrões de ataque:** rajada de metralhadora mirada no jogador, anéis de orbes (é preciso passar
  pelos vãos) e invocação de reforços.
- **Fúria (abaixo de 50% de vida):** fica mais rápido, os ataques ficam mais densos e ganha uma
  investida em linha reta.

## 9. Progressão

- **XP:** cada inimigo solta uma poção azul de XP; o Vassago solta uma maior. O XP é atraído quando
  o jogador chega perto.
- **Nível:** o XP necessário cresce a cada nível. Ao subir, o jogo pausa e mostra 3 cartas sorteadas.
- **Cartas:** novas armas, evolução de armas e melhorias gerais (dano, cadência, velocidade, vida
  máxima, armadura, área de coleta, projéteis extras, crítico, área de explosão, perfuração,
  regeneração, XP, sorte e recarga do dash).

## 10. Estrutura da partida

| Fase | Duração | O que acontece |
|---|---|---|
| Preparação | 3 s | arena vazia |
| Ondas 1 a 10 | 40 a 60 s cada | novos tipos de inimigo vão entrando; se a onda for limpa antes, a próxima começa mais cedo |
| Chefão | até derrotá-lo | aviso, entrada do Spider Mastermind e luta final |

## 11. Itens

Além do XP, os inimigos podem soltar itens raros: estimulante, medkit, armadura, mega armadura,
Soulsphere (+100 de vida), Berserk (dano em dobro por 15 s), invulnerabilidade (10 s) e Megasphere
(puxa todo o XP do mapa).

## 12. Interface e telas

- **Menu principal:** Novo jogo, Como jogar?, Records e Créditos.
- **HUD** no estilo da barra de status do Doom: vida, armadura, arma atual, onda, tempo, nível,
  barra de XP e o rosto do personagem, que reage à vida e aos golpes.
- **Na tela de jogo:** radar com os inimigos próximos, indicador da direção de onde veio o dano e
  números de dano.
- **Outras telas:** escolha de cartas, pausa (com ajuste da sensibilidade do mouse) e fim de
  partida (vitória ou derrota).

## 13. Arte e som

- **Visual:** sprites originais de *DOOM* / *DOOM II* (personagens, armas, itens, HUD), obtidos no
  The Spriters Resource e recortados por um script do projeto. Texturas do cenário geradas por código.
- **Som:** efeitos sonoros originais do Doom; música sintetizada por código.

## 14. Tecnologia

- Phaser 3 + Vite, JavaScript.
- Visão em primeira pessoa feita com *raycasting*, no mesmo estilo do Doom original.
- Roda no navegador, sem servidor; instruções de execução no [README](README.md).

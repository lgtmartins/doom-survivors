// Armas do jogador. Tudo aqui é balanceamento: mexa à vontade.
//
//   dano        dano por projétil/estilhaço (nos explosivos, o dano da explosão no centro)
//   intervalo   segundos entre disparos (a cadência do jogador divide esse valor)
//   projeteis   quantos saem por disparo;  leque = ângulo (rad) entre eles
//   dispersao   imprecisão aleatória (rad)
//   tipo        'hitscan' acerta na hora; 'projetil' cria um objeto que viaja
//   vista       sprites da arma em primeira pessoa (atlas "weapons"):
//                 sequencias = variações da animação de tiro, alternadas a cada disparo;
//                 cada passo é [frame da arma, duração em s, frame do clarão ou null, dx opcional]
//                 (dx em px desloca o frame para a arma não "pular" de lugar entre frames de larguras diferentes)
//                 claraoDy = quantos px o clarão invade o topo da arma
//   evolucao    o que cada nível extra da arma dá (carta "evoluir")

const f = (n) => `weapons_${n}`;
const fx = (l, ...cs) => cs.map(c => `fx_${l}_${c}`);

export const ARMAS = {
  pistola: {
    id: 'pistola', nome: 'Pistola', tecla: 1, icone: f('0_1'), som: 'pistola',
    tipo: 'hitscan', dano: 16, intervalo: 0.3, projeteis: 1, leque: 0.045, dispersao: 0.012,
    tremor: 1.2, luz: 60, recuo: 3,
    vista: { parado: f('1_9'), claraoDy: 14, sequencias: [[[f('1_10'), 0.07, f('0_0'), -16], [f('1_11'), 0.06, null, -5], [f('1_12'), 0.07, null, -2]]] },
    evolucao: { dano: 0.3 },
  },
  shotgun: {
    id: 'shotgun', nome: 'Shotgun', tecla: 2, icone: 'pickups_0_1', som: 'shotgun',
    tipo: 'hitscan', dano: 11, intervalo: 0.82, projeteis: 7, leque: 0.035, dispersao: 0.02, alcance: 22,
    tremor: 4, luz: 110, recuo: 9, empurrao: 2.2,
    vista: {
      parado: f('3_1'), claraoDy: 12,
      sequencias: [[[f('3_1'), 0.06, f('2_0')], [f('3_1'), 0.06, f('2_1')], [f('3_2'), 0.11, null], [f('3_3'), 0.12, null], [f('3_4'), 0.13, null], [f('3_3'), 0.1, null], [f('3_2'), 0.09, null]]],
    },
    evolucao: { dano: 0.2, projeteis: 2 },
  },
  chaingun: {
    id: 'chaingun', nome: 'Chaingun', tecla: 3, icone: 'pickups_0_3', som: 'chaingun',
    tipo: 'hitscan', dano: 10, intervalo: 0.085, projeteis: 1, leque: 0.05, dispersao: 0.035,
    tremor: 1.0, luz: 70, recuo: 2,
    vista: { parado: f('5_0'), claraoDy: 26, sequencias: [[[f('5_0'), 0.045, f('4_0')]], [[f('5_1'), 0.045, f('4_2')]]] },
    evolucao: { dano: 0.25 },
  },
  foguete: {
    id: 'foguete', nome: 'Lança-foguetes', tecla: 4, icone: 'pickups_0_4', som: 'foguete',
    tipo: 'projetil', dano: 85, intervalo: 0.8, projeteis: 1, leque: 0.12, dispersao: 0,
    tremor: 3, luz: 90, recuo: 8,
    projetil: {
      quadros: ['fx_20_0'], fps: 1, vel: 16, raio: 0.22, escala: 1.2,
      explosao: { raio: 2.6, quadros: fx(21, 0, 1, 2), escala: 1.5, som: 'explosao', empurrao: 5, feridaPropria: 0.2 },
    },
    vista: { parado: f('5_2'), claraoDy: 22, sequencias: [[[f('5_3'), 0.05, f('4_3')], [f('5_3'), 0.05, f('4_4')], [f('5_3'), 0.06, f('4_5')], [f('5_2'), 0.07, f('4_6')]]] },
    evolucao: { dano: 0.25, area: 0.12 },
  },
  plasma: {
    id: 'plasma', nome: 'Rifle de Plasma', tecla: 5, icone: 'pickups_0_5', som: 'plasma',
    tipo: 'projetil', dano: 17, intervalo: 0.095, projeteis: 1, leque: 0.07, dispersao: 0.025,
    tremor: 0.8, luz: 60, recuo: 2,
    projetil: { quadros: fx(22, 0, 1), fps: 12, vel: 24, raio: 0.2, escala: 1.1, impacto: fx(22, 2, 3, 4, 5), impactoEscala: 0.9 },
    vista: { parado: f('5_6'), claraoDy: 0, sequencias: [[[f('5_7'), 0.05, null]], [[f('5_8'), 0.05, null]]] },
    evolucao: { dano: 0.25 },
  },
  bfg: {
    id: 'bfg', nome: 'BFG 9000', tecla: 6, icone: 'pickups_0_6', som: 'bfg',
    // "Ultimate": não usa o intervalo normal, e sim uma recarga longa (que upgrades reduzem).
    tipo: 'projetil', suprema: true, recarga: 18, atraso: 0.55,
    dano: 420, intervalo: 1.1, projeteis: 1, leque: 0, dispersao: 0,
    tremor: 7, luz: 160, recuo: 12,
    projetil: {
      quadros: fx(10, 0, 1), fps: 10, vel: 12, raio: 0.5, escala: 1.4,
      explosao: { raio: 5, quadros: fx(8, 0, 1, 2, 1, 0), escala: 2.2, som: 'bfgExplosao', empurrao: 8, feridaPropria: 0 },
      // ao explodir, todo inimigo com linha de visão para o jogador leva um "traço" extra
      tracos: { fracao: 0.45, alcance: 16, quadros: fx(9, 0, 1, 2, 3) },
    },
    vista: { parado: f('5_10'), claraoDy: 24, sequencias: [[[f('5_11'), 0.3, f('4_8')], [f('5_11'), 0.25, f('4_9')], [f('5_12'), 0.25, null], [f('5_10'), 0.3, null]]] },
    evolucao: { dano: 0.3, recarga: -3 },
  },
};

export const ORDEM_ARMAS = ['pistola', 'shotgun', 'chaingun', 'foguete', 'plasma', 'bfg'];
export const NIVEL_MAX_ARMA = 4;

// Botão geral de poder de fogo: multiplica o dano de TODAS as armas de uma vez.
// 1 = os valores da tabela acima; 1.4 = 40% mais forte. É o jeito rápido de
// deixar o jogo mais fácil ou mais difícil sem mexer arma por arma.
export const PODER_DE_FOGO = 1.4;

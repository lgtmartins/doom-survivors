// Menu inicial, com quatro telas: principal, "como jogar", recordes e créditos.
//
// As quatro são a MESMA cena. Trocar de tela é reiniciar a cena passando qual tela
// mostrar (scene.restart({ tela })): o Phaser limpa objetos e teclas da tela
// anterior sozinho, então não há nada para esconder/mostrar à mão.
import Phaser from 'phaser';
import { TELA_L, TELA_A, COR } from '../config.js';
import { lerRecorde, formatarTempo } from '../systems/Recorde.js';
import { ONDAS } from '../data/ondas.js';
import { sons } from '../systems/Sons.js';
import { texto, ListaDeBotoes, travarMouse, aoTecla } from './ui.js';

const CONTROLES = [
  ['WASD', 'andar (A/D andam de lado)'],
  ['MOUSE', 'mirar  ·  setas ou Q/E também giram'],
  ['CLIQUE (segurar)', 'atirar'],
  ['ESPAÇO', 'dash (fica invencível durante)'],
  ['1-6 / SCROLL', 'trocar de arma'],
  ['BOTÃO DIREITO', 'BFG 9000 (quando tiver)'],
  ['ESC / P', 'pausa   ·   M: som'],
];

const EQUIPE = ['Luiz Guilherme Tiritan Martins', 'Pedro Guermandi Bressan', 'Gustavo Messa Corbe'];
const URL_SPRITES = 'https://www.spriters-resource.com/ms_dos/doomdoomii/';

const DICAS = [
  'Recolha as poções azuis: são o XP. A cada nível você escolhe 1 de 3 upgrades.',
  'O radar (canto superior direito) mostra quem vem pelas costas.',
  'Banshees explodem: mate de longe. Ghouls atiram: são alvo prioritário.',
  'Use os pilares como cobertura contra a metralhadora do chefão.',
];

export class CenaMenu extends Phaser.Scene {
  constructor() { super('Menu'); }

  init(dados) { this.tela = dados?.tela || 'principal'; }

  create() {
    this.saindo = false; // a instância da cena é reaproveitada: zera o estado a cada entrada
    // fundo: o céu infernal do próprio pack, ampliado, com um degradê escuro por cima
    const ampliacao = TELA_A / 128;
    this.ceu = this.add.tileSprite(0, 0, Math.ceil(TELA_L / ampliacao), 128, 'skies', 'sky_inferno').setOrigin(0).setScale(ampliacao);
    this.ceu.tilePositionX = this.registry.get('ceuDoMenu') || 0; // o céu continua de onde estava ao trocar de tela
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x200000, 0x200000, 0.25, 0.25, 0.92, 0.92);
    g.fillRect(0, 0, TELA_L, TELA_A);

    if (this.tela === 'comoJogar') this.telaComoJogar();
    else if (this.tela === 'recordes') this.telaRecordes();
    else if (this.tela === 'creditos') this.telaCreditos();
    else this.telaPrincipal();
  }

  update(_t, delta) {
    this.ceu.tilePositionX += delta * 0.004; // o céu desliza devagar
    this.registry.set('ceuDoMenu', this.ceu.tilePositionX);
  }

  // ----------------------------------------------------------------- telas

  telaPrincipal() {
    this.add.image(TELA_L / 2, 130, 'menu', 'menu_0_2').setScale(3);
    texto(this, TELA_L / 2, 250, 'S U R V I V O R S', 46, COR.amarelo);
    texto(this, TELA_L / 2, 292, `sobreviva a ${ONDAS.length} ondas e derrote o Spider Mastermind`, 18, COR.cinza);

    new ListaDeBotoes(this, TELA_L / 2, 366, [
      { rotulo: 'NOVO JOGO', acao: () => this.iniciar() },
      { rotulo: 'COMO JOGAR?', acao: () => this.scene.restart({ tela: 'comoJogar' }) },
      { rotulo: 'RECORDS', acao: () => this.scene.restart({ tela: 'recordes' }) },
      { rotulo: 'CRÉDITOS', acao: () => this.scene.restart({ tela: 'creditos' }) },
    ], { tamanho: 36, espaco: 52 });
  }

  telaCreditos() {
    texto(this, TELA_L / 2, 52, 'CRÉDITOS', 52, COR.amarelo);
    let y = 112;
    // cada bloco: título amarelo e as linhas em branco/cinza logo abaixo
    const bloco = (titulo, linhas, cor = COR.branco) => {
      texto(this, TELA_L / 2, y, titulo, 20, COR.amarelo);
      y += 25;
      for (const l of linhas) { texto(this, TELA_L / 2, y, l, 17, cor); y += 22; }
      y += 10;
    };
    bloco('DESENVOLVIDO POR', [EQUIPE.join('   ·   '), 'Disciplina de Jogos Digitais']);
    bloco('SPRITES E GRÁFICOS', ['© id Software / Bethesda  —  DOOM, DOOM II e Legacy of Rust']);
    // o endereço é clicável: abre a página das sheets numa aba nova
    texto(this, TELA_L / 2, y - 6, 'Sheets obtidas em The Spriters Resource:', 17, COR.branco);
    // em Arial e com folga embaixo: na fonte Impact o "_" de ms_dos é cortado e some
    const link = texto(this, TELA_L / 2, y + 16, URL_SPRITES.replace('https://', ''), 17, '#7fb2ff')
      .setFontFamily('Arial, sans-serif').setFontStyle('bold').setPadding(0, 0, 0, 4)
      .setInteractive({ useHandCursor: true });
    link.on('pointerdown', () => window.open(URL_SPRITES, '_blank'));
    y += 44;
    bloco('RIPS DOS SPRITES', ['Dolphman  ·  Planz Doom  ·  MG12  ·  PGE  ·  DaColGy  ·  16-Bit Globe  ·  SuperDave938'], COR.cinza);
    bloco('EFEITOS SONOROS', ['© id Software  —  rips de Nai255 e InfamousLazure'], COR.cinza);
    bloco('TECNOLOGIA', ['Phaser 3 + Vite  ·  texturas do cenário e música geradas por código'], COR.cinza);
    this.botaoVoltar(548);
  }

  telaComoJogar() {
    texto(this, TELA_L / 2, 62, 'COMO JOGAR?', 52, COR.amarelo);
    CONTROLES.forEach(([tecla, acao], i) => {
      const y = 132 + i * 34;
      texto(this, TELA_L / 2 - 30, y, tecla, 23, COR.amarelo, 1);
      texto(this, TELA_L / 2 - 6, y, acao, 23, COR.branco, 0);
    });
    DICAS.forEach((dica, i) => texto(this, TELA_L / 2, 394 + i * 26, dica, 17, COR.cinza));
    this.botaoVoltar();
  }

  telaRecordes() {
    texto(this, TELA_L / 2, 62, 'RECORDS', 52, COR.amarelo);
    const r = lerRecorde();
    if (r.maisAbates === 0 && r.maiorTempo === 0) {
      texto(this, TELA_L / 2, 270, 'Nenhuma run registrada ainda.', 26, COR.cinza);
      texto(this, TELA_L / 2, 308, 'Jogue uma partida e volte aqui.', 20, COR.cinza);
    } else {
      const linhas = [
        ['Maior onda alcançada', `${r.maiorOnda} / ${ONDAS.length}`],
        ['Mais inimigos abatidos', String(r.maisAbates)],
        ['Maior nível', String(r.maiorNivel)],
        ['Maior tempo de sobrevivência', formatarTempo(r.maiorTempo)],
        ['Vitórias', String(r.vitorias)],
        ['Vitória mais rápida', r.vitorias ? formatarTempo(r.melhorVitoria) : '—'],
      ];
      linhas.forEach(([rotulo, valor], i) => {
        const y = 150 + i * 46;
        texto(this, TELA_L / 2 + 40, y, rotulo, 26, COR.cinza, 1);
        texto(this, TELA_L / 2 + 70, y, valor, 26, COR.amarelo, 0);
      });
      texto(this, TELA_L / 2, 446, 'Cada marca é a melhor entre todas as runs; ficam salvas neste navegador.', 15, COR.cinza);
    }
    this.botaoVoltar();
  }

  botaoVoltar(y = 530) {
    const voltar = () => this.scene.restart({ tela: 'principal' });
    new ListaDeBotoes(this, TELA_L / 2, y, [{ rotulo: 'VOLTAR', acao: voltar }], { tamanho: 34 });
    aoTecla(this, 'ESC', () => { sons.tocar('menu'); voltar(); });
  }

  iniciar() {
    if (this.saindo) return;
    this.saindo = true;
    sons.iniciar();
    travarMouse(this);
    this.scene.start('Jogo');
  }
}

// Sistema de armas: qual está na mão, cadência, disparo (hitscan ou projétil) e
// a animação da arma em primeira pessoa. Os números vêm de data/armas.js.
import { ARMAS, ORDEM_ARMAS } from '../data/armas.js';
import { EFEITOS } from '../data/inimigos.js';
import { ALTURA_OLHO } from '../config.js';
import { ferirInimigo } from '../entities/Inimigo.js';
import { sons } from './Sons.js';

const T_TROCA = 0.22; // segundos para a arma nova subir na tela

export class Armas {
  constructor(jogo) {
    this.jogo = jogo;
    this.atual = 'pistola';
    this.anterior = null;     // para voltar depois de um disparo de BFG pelo botão direito
    this.tRecarga = 0;        // tempo até poder atirar de novo
    this.tBfg = 0;            // recarga da BFG (conta mesmo com outra arma na mão)
    this.pendente = null;     // disparo atrasado (a BFG "carrega" antes de soltar a bola)
    this.sequencia = null;    // animação de tiro em andamento
    this.passo = 0;
    this.tPasso = 0;
    this.variacao = 0;
    this.tTroca = 0;
    this.recuo = 0;           // deslocamento visual da arma (px), volta a zero sozinho
    this.acertos = [];        // reaproveitado pelo hitscan
  }

  get def() { return ARMAS[this.atual]; }
  get recargaBfg() { return this.recargaDe(ARMAS.bfg); }

  recargaDe(arma) {
    const nivel = this.jogo.jogador.armas[arma.id]?.nivel || 1;
    return Math.max(6, arma.recarga + (nivel - 1) * (arma.evolucao.recarga || 0));
  }

  trocar(id, silencioso = false) {
    if (!this.jogo.jogador.armas[id] || id === this.atual || this.pendente) return false;
    this.atual = id;
    this.sequencia = null;
    this.tTroca = T_TROCA;
    this.tRecarga = Math.max(this.tRecarga, T_TROCA);
    if (!silencioso) sons.tocar('trocar');
    return true;
  }

  /** Scroll do mouse: próxima (+1) ou anterior (-1) entre as armas que o jogador tem. */
  ciclar(dir) {
    const tenho = ORDEM_ARMAS.filter(id => this.jogo.jogador.armas[id]);
    const i = tenho.indexOf(this.atual);
    this.anterior = null;
    this.trocar(tenho[(i + dir + tenho.length) % tenho.length]);
  }

  atualizar(dt, entrada) {
    const jog = this.jogo.jogador;
    this.tRecarga -= dt;
    this.tBfg -= dt;
    if (this.tTroca > 0) this.tTroca -= dt;
    this.recuo *= Math.exp(-14 * dt);

    // animação de tiro
    if (this.sequencia) {
      this.tPasso += dt;
      while (this.sequencia && this.tPasso >= this.sequencia[this.passo][1]) {
        this.tPasso -= this.sequencia[this.passo][1];
        if (++this.passo >= this.sequencia.length) this.sequencia = null;
      }
    }
    // disparo atrasado (BFG)
    if (this.pendente) {
      this.pendente.t -= dt;
      if (this.pendente.t <= 0) {
        const arma = this.pendente.arma;
        this.pendente = null;
        this.soltar(arma);
      }
    }
    // depois do tiro de BFG pelo botão direito, volta para a arma que estava na mão
    if (this.anterior && this.atual === 'bfg' && !this.sequencia && !this.pendente) {
      const volta = this.anterior;
      this.anterior = null;
      this.trocar(volta, true);
    }
    if (jog.morto) return;

    // botão direito: BFG direto, sem precisar selecionar
    if (entrada.suprema) {
      entrada.suprema = false;
      if (!jog.armas.bfg) {
        this.jogo.mensagem('Você ainda não tem a BFG 9000');
      } else if (this.tBfg > 0) {
        sons.tocar('negado', 1, 0.3);
        this.jogo.mensagem(`BFG recarregando: ${Math.ceil(this.tBfg)}s`);
      } else if (!this.pendente) {
        if (this.atual !== 'bfg') { this.anterior = this.atual; this.atual = 'bfg'; this.sequencia = null; }
        this.tRecarga = 0;
        this.disparar();
      }
      return;
    }
    if (entrada.atirando && this.tRecarga <= 0 && !this.pendente) {
      if (this.def.suprema && this.tBfg > 0) {
        sons.tocar('negado', 1, 0.5);
        this.jogo.mensagem(`BFG recarregando: ${Math.ceil(this.tBfg)}s`);
        this.tRecarga = 0.4;
      } else {
        this.disparar();
      }
    }
  }

  /** Puxa o gatilho: inicia animação, som e recarga. O efeito do tiro está em soltar(). */
  disparar() {
    const arma = this.def, jog = this.jogo.jogador;
    this.tRecarga = arma.suprema ? arma.intervalo : arma.intervalo / jog.mods.cadencia;
    if (arma.suprema) this.tBfg = this.recargaDe(arma);
    const seqs = arma.vista.sequencias;
    this.sequencia = seqs[this.variacao++ % seqs.length];
    this.passo = 0;
    this.tPasso = 0;
    sons.tocar(arma.som, 1, 0.03);
    this.jogo.aoAtirar(arma);
    if (arma.atraso) this.pendente = { arma, t: arma.atraso };
    else this.soltar(arma);
  }

  soltar(arma) {
    const { jogo } = this;
    const jog = jogo.jogador;
    const nivel = jog.armas[arma.id]?.nivel || 1;
    const evo = arma.evolucao;
    const dano = arma.dano * (1 + (nivel - 1) * (evo.dano || 0)) * jog.multDano;
    let n = arma.projeteis + (nivel - 1) * (evo.projeteis || 0);
    const extras = arma.suprema ? 0 : jog.mods.projeteis * (arma.id === 'shotgun' ? 2 : 1);
    n += extras;
    this.recuo = arma.recuo;
    jogo.tremer(arma.tremor);
    jogo.clarao(arma.luz);

    for (let i = 0; i < n; i++) {
      const ang = jog.ang + (i - (n - 1) / 2) * arma.leque + (Math.random() * 2 - 1) * arma.dispersao;
      const critico = Math.random() < jog.mods.critico;
      // os projéteis da carta "Munição Extra" valem metade (senão ela dobraria o dano de tudo)
      const extra = i >= n - extras;
      const danoDeste = extra ? dano * 0.5 : dano;
      if (arma.tipo === 'hitscan') {
        this.hitscan(ang, danoDeste, critico, arma);
      } else {
        const p = arma.projetil;
        // nasce um pouco à frente do jogador para não explodir na própria cara
        jogo.projeteis.disparar(p, true, jog.x + Math.cos(ang) * 0.45, jog.y + Math.sin(ang) * 0.45, ang, p.vel, danoDeste, critico);
      }
    }
  }

  /**
   * Tiro instantâneo: acha os inimigos que o raio cruza antes da parede e fere os
   * primeiros (1 + perfuração). É geometria 2D: projeta o centro do inimigo sobre
   * o raio (`ao longo`) e mede a distância lateral (`fora`).
   */
  hitscan(ang, dano, critico, arma) {
    const { jogo, acertos } = this;
    const { jogador: jog, mapa, horda, efeitos } = jogo;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const limite = Math.min(mapa.raio(jog.x, jog.y, dx, dy, 60), arma.alcance || 60);
    acertos.length = 0;
    for (const e of horda.pool.ativos) {
      if (!e.vivo || e.estado === 'nascer') continue;
      const rx = e.x - jog.x, ry = e.y - jog.y;
      const aoLongo = rx * dx + ry * dy;
      if (aoLongo <= 0 || aoLongo > limite + e.raio) continue;
      const fora = Math.abs(rx * dy - ry * dx);
      if (fora < e.raio + 0.1) acertos.push(e); // +0.1 de tolerância: mira generosa
    }
    if (acertos.length === 0) {
      if (limite < (arma.alcance || 60)) {
        efeitos.anim(EFEITOS.fumaca, jog.x + dx * (limite - 0.06), jog.y + dy * (limite - 0.06), ALTURA_OLHO - 0.15 + Math.random() * 0.3, 0.8, 14);
      }
      return;
    }
    const dist = (e) => (e.x - jog.x) * dx + (e.y - jog.y) * dy;
    acertos.sort((a, b) => dist(a) - dist(b));
    const max = 1 + jog.mods.perfuracao;
    for (let i = 0; i < acertos.length && i < max; i++) {
      const e = acertos[i];
      const t = Math.max(0.2, dist(e) - e.raio * 0.7);
      if (!e.def.sprites.brilho) efeitos.sangue(jog.x + dx * t, jog.y + dy * t, (e.def.voa || 0.6) + Math.random() * 0.2, 2);
      else efeitos.anim(EFEITOS.fumaca, jog.x + dx * t, jog.y + dy * t, e.def.voa || 0.6, 0.8, 14);
      ferirInimigo(e, dano, jogo, critico, jog.x, jog.y, arma.empurrao || 0.6);
    }
  }

  // ------------------------------------------- o que a cena precisa desenhar

  /** Frame atual da arma. */
  get quadroArma() {
    return this.sequencia ? this.sequencia[this.passo][0] : this.def.vista.parado;
  }

  /** Frame do clarão do tiro (ou null). */
  get quadroClarao() {
    return this.sequencia ? this.sequencia[this.passo][2] : null;
  }

  /** Deslocamento horizontal do frame atual, em px (ver `vista` em data/armas.js). */
  get dxArma() {
    return this.sequencia ? this.sequencia[this.passo][3] || 0 : 0;
  }

  /** Quanto a arma está abaixada (0..1) por causa da troca. */
  get abaixada() { return Math.max(0, this.tTroca / T_TROCA); }
}

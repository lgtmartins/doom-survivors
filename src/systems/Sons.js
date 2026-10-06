// Áudio 100% sintetizado com a Web Audio API (o pack de assets não tem som).
// Cada efeito é uma receita feita de dois tijolos:
//   tom()   -> oscilador com a frequência deslizando de f0 para f1
//   ruido() -> ruído branco passando por um filtro que também desliza
// A música é um sequenciador simples de 16 passos (baixo distorcido + bumbo + chimbal).

const RECEITAS = {
  pistola: (s) => { s.ruido(0.13, 3200, 500, 0.5); s.tom('square', 210, 55, 0.09, 0.35); },
  shotgun: (s) => { s.ruido(0.34, 2600, 220, 0.9); s.tom('sawtooth', 130, 38, 0.22, 0.5); },
  chaingun: (s) => { s.ruido(0.07, 2400, 700, 0.42); s.tom('square', 170, 65, 0.05, 0.28); },
  foguete: (s) => { s.ruido(0.5, 500, 2600, 0.5); s.tom('sawtooth', 90, 190, 0.3, 0.25); },
  explosao: (s) => { s.ruido(0.75, 1000, 70, 1.0); s.tom('sine', 95, 28, 0.55, 0.8); },
  plasma: (s) => { s.tom('sawtooth', 950, 180, 0.11, 0.22); s.tom('square', 1400, 500, 0.06, 0.1); },
  bfg: (s) => { s.tom('sawtooth', 70, 520, 0.6, 0.4); s.tom('square', 140, 1040, 0.6, 0.15); },
  bfgExplosao: (s) => { s.ruido(1.1, 2200, 60, 1.0); s.tom('sine', 220, 26, 0.9, 0.9); s.tom('sawtooth', 660, 110, 0.5, 0.25); },
  ferido: (s) => { s.tom('sawtooth', 310, 110, 0.2, 0.5); s.ruido(0.1, 900, 300, 0.3); },
  inimigoDor: (s) => { s.tom('square', 230, 150, 0.07, 0.16); },
  inimigoMorte: (s) => { s.ruido(0.2, 1300, 180, 0.35); s.tom('sawtooth', 170, 48, 0.24, 0.3); },
  grito: (s) => { s.tom('sawtooth', 420, 980, 0.32, 0.22); },
  banshee: (s) => { s.tom('sine', 880, 1700, 0.36, 0.3); s.tom('triangle', 900, 1750, 0.36, 0.15); },
  tiroInimigo: (s) => { s.tom('triangle', 520, 190, 0.18, 0.25); },
  fogo: (s) => { s.ruido(0.3, 500, 1800, 0.3); },
  xp: (s) => { s.tom('triangle', 900, 1350, 0.05, 0.1); },
  item: (s) => { s.tom('sine', 620, 940, 0.13, 0.35); s.tom('sine', 940, 1250, 0.13, 0.25, 0.09); },
  poder: (s) => { s.tom('sawtooth', 200, 800, 0.4, 0.3); s.tom('sine', 400, 1600, 0.4, 0.3); },
  nivel: (s) => { [523, 659, 784, 1047].forEach((f, i) => s.tom('square', f, f, 0.12, 0.2, i * 0.08)); },
  dash: (s) => { s.ruido(0.16, 700, 3200, 0.35); },
  teleporte: (s) => { s.tom('sine', 180, 760, 0.25, 0.18); s.ruido(0.2, 2000, 600, 0.12); },
  trocar: (s) => { s.tom('square', 300, 420, 0.05, 0.15); },
  negado: (s) => { s.tom('square', 140, 110, 0.1, 0.2); },
  menu: (s) => { s.tom('square', 440, 440, 0.05, 0.2); },
  confirmar: (s) => { s.ruido(0.25, 2400, 300, 0.6); s.tom('sawtooth', 150, 45, 0.2, 0.4); },
  onda: (s) => { s.tom('sawtooth', 110, 110, 0.25, 0.3); s.tom('sawtooth', 165, 165, 0.35, 0.3, 0.2); },
  chefeRugido: (s) => { s.tom('sawtooth', 120, 42, 1.1, 0.7); s.ruido(1.0, 700, 120, 0.6); },
  chefeTiro: (s) => { s.ruido(0.06, 1500, 500, 0.3); s.tom('square', 120, 50, 0.05, 0.2); },
  morte: (s) => { s.tom('sawtooth', 380, 45, 0.95, 0.6); },
  vitoria: (s) => { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => s.tom('square', f, f, 0.22, 0.22, i * 0.14)); },
};

// Riff original em mi menor (semitons acima do Mi1; -1 = pausa), 16 passos por compasso.
const RIFF = [
  [0, 0, 12, 0, 0, 10, 0, 0, 8, 0, 0, 7, 0, 3, 5, 7],
  [0, 0, 12, 0, 0, 10, 0, 0, 8, 0, 0, 7, 6, 5, 3, 1],
  [3, 3, 15, 3, 3, 13, 3, 3, 12, 3, 3, 10, 3, 7, 8, 10],
  [0, 0, 12, 0, 0, 10, 0, 0, 8, 0, 7, 0, 6, 0, 5, 3],
];

class Sons {
  constructor() {
    this.ctx = null;
    this.mudo = false;
    this.ultimo = {};        // nome -> instante do último toque (limita sons repetidos)
    this.musicaLigada = false;
    this.intensa = false;    // versão acelerada para o chefão
    this.volumeDaVez = 1;
  }

  /** Navegadores só liberam áudio depois de um gesto do usuário: chame isto num clique/tecla. */
  iniciar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.mestre = this.ctx.createGain();
      this.mestre.gain.value = 0.5;
      const comp = this.ctx.createDynamicsCompressor(); // segura o volume quando muita coisa toca junto
      this.mestre.connect(comp).connect(this.ctx.destination);
      this.canalMusica = this.ctx.createGain();
      this.canalMusica.gain.value = 0.16;
      this.canalMusica.connect(this.mestre);
      const n = this.ctx.sampleRate;
      this.bufRuido = this.ctx.createBuffer(1, n, n);
      const d = this.bufRuido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.curva = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = i / 128 - 1; this.curva[i] = Math.tanh(x * 5); }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  alternarMudo() {
    this.mudo = !this.mudo;
    if (this.mestre) this.mestre.gain.value = this.mudo ? 0 : 0.5;
    return this.mudo;
  }

  tocar(nome, volume = 1, intervaloMin = 0.04) {
    if (!this.ctx || this.mudo || this.ctx.state !== 'running') return;
    const agora = this.ctx.currentTime;
    if (agora - (this.ultimo[nome] || -1) < intervaloMin) return;
    this.ultimo[nome] = agora;
    this.volumeDaVez = volume;
    this.saida = this.mestre;
    RECEITAS[nome](this);
  }

  tom(tipo, f0, f1, dur, ganho, atraso = 0) {
    const t = this.ctx.currentTime + atraso;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(ganho * this.volumeDaVez, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.saida);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  ruido(dur, f0, f1, ganho, atraso = 0, tipo = 'lowpass') {
    const t = this.ctx.currentTime + atraso;
    const src = this.ctx.createBufferSource(), filtro = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = this.bufRuido;
    filtro.type = tipo;
    filtro.frequency.setValueAtTime(f0, t);
    filtro.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(ganho * this.volumeDaVez, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filtro).connect(g).connect(this.saida);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // ----------------------------------------------------------------- música

  musica(ligar, intensa = false) {
    this.intensa = intensa;
    if (ligar === this.musicaLigada) return;
    this.musicaLigada = ligar;
    clearInterval(this.relogio);
    if (!ligar || !this.ctx) return;
    this.passo = 0;
    this.proximo = this.ctx.currentTime + 0.1;
    // Agenda as notas um pouco adiantado; setInterval sozinho não tem precisão para ritmo.
    this.relogio = setInterval(() => this.agendar(), 50);
  }

  agendar() {
    if (!this.ctx || this.ctx.state !== 'running') { if (this.ctx) this.proximo = this.ctx.currentTime + 0.1; return; }
    const dur = 60 / (this.intensa ? 172 : 140) / 4; // duração de uma semicolcheia
    while (this.proximo < this.ctx.currentTime + 0.15) {
      const p = this.passo % 16, compasso = Math.floor(this.passo / 16) % RIFF.length;
      const semitom = RIFF[compasso][p] + (this.intensa ? 2 : 0);
      this.nota(41.2 * 2 ** (semitom / 12), this.proximo, dur * 0.9);
      if (p % 4 === 0 || (this.intensa && p % 4 === 2)) this.bumbo(this.proximo);
      if (p % 2 === 0) this.chimbal(this.proximo, p % 8 === 4 ? 0.5 : 0.22);
      this.proximo += dur;
      this.passo++;
    }
  }

  nota(freq, t, dur) {
    const osc = this.ctx.createOscillator(), dist = this.ctx.createWaveShaper(), filtro = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq * 2;
    dist.curve = this.curva;
    filtro.type = 'lowpass';
    filtro.frequency.value = 1100;
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + dur);
    osc.connect(dist).connect(filtro).connect(g).connect(this.canalMusica);
    osc.start(t);
    osc.stop(t + dur);
  }

  bumbo(t) {
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(1.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g).connect(this.canalMusica);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  chimbal(t, ganho) {
    const src = this.ctx.createBufferSource(), filtro = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = this.bufRuido;
    filtro.type = 'highpass';
    filtro.frequency.value = 6000;
    g.gain.setValueAtTime(ganho, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filtro).connect(g).connect(this.canalMusica);
    src.start(t);
    src.stop(t + 0.06);
  }
}

// Uma única instância para o jogo todo (as cenas importam `sons`).
export const sons = new Sons();

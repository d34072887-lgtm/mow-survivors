/** 回合表（docs/05）：读 spawn-rules/rounds.json；超出表长按最后一条递增（首版 5 回合封顶） */
export class Rounds {
  constructor(cfg) { this.cfg = cfg; }
  get total() { return this.cfg.rounds.length; }
  rule(n) {
    const rows = this.cfg.rounds;
    const row = rows[Math.min(n, rows.length) - 1];
    return { ...row, round: n, duration: Math.min(this.cfg.durationCap, row.duration) };
  }
  isFinal(n) { return !!this.rule(n).final || n >= this.total; }
  restoreRatio() { return this.cfg.restoreHpRatio ?? 0.25; }
}

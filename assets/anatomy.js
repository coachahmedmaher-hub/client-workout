/* Stylised anatomy figures (front + back). Highlights the muscles an exercise works. */
(function () {
  const REG = {
    back: {
      "Lower Back": `<rect x="84" y="18" width="32" height="40" rx="10"/>`,
      Glutes: `<path d="M52 66 Q54 52 74 50 Q98 52 99 74 Q99 98 78 104 Q56 104 51 88 Z"/><path d="M148 66 Q146 52 126 50 Q102 52 101 74 Q101 98 122 104 Q144 104 149 88 Z"/>`,
      Hamstrings: `<path d="M58 108 Q74 102 92 108 Q95 140 88 168 Q76 174 66 168 Q56 140 58 108 Z"/><path d="M142 108 Q126 102 108 108 Q105 140 112 168 Q124 174 134 168 Q144 140 142 108 Z"/>`,
      Calves: `<path d="M70 186 Q82 180 92 188 Q94 214 87 236 Q80 240 75 236 Q66 212 70 186 Z"/><path d="M130 186 Q118 180 108 188 Q106 214 113 236 Q120 240 125 236 Q134 212 130 186 Z"/>`
    },
    front: {
      Core: `<rect x="83" y="6" width="34" height="56" rx="9"/>`,
      Abductors: `<path d="M48 62 Q44 80 52 98 Q60 92 60 76 Q58 64 48 62 Z"/><path d="M152 62 Q156 80 148 98 Q140 92 140 76 Q142 64 152 62 Z"/>`,
      Quads: `<path d="M60 84 Q74 76 90 88 Q94 124 88 166 Q76 174 66 166 Q56 126 60 84 Z"/><path d="M140 84 Q126 76 110 88 Q106 124 112 166 Q124 174 134 166 Q144 126 140 84 Z"/>`,
      Adductors: `<path d="M92 92 Q99 96 98 120 Q96 138 92 142 Q89 120 92 92 Z"/><path d="M108 92 Q101 96 102 120 Q104 138 108 142 Q111 120 108 92 Z"/>`,
      Tibialis: `<path d="M76 188 Q84 184 88 192 Q88 216 84 236 Q79 236 76 224 Q73 206 76 188 Z"/><path d="M124 188 Q116 184 112 192 Q112 216 116 236 Q121 236 124 224 Q127 206 124 188 Z"/>`
    }
  };
  const ALIAS = { Abs: "Core", Obliques: "Core", "Hip Abductors": "Abductors", Hamstring: "Hamstrings", Glute: "Glutes", Quad: "Quads", Calf: "Calves" };

  function silhouette(f) {
    const h = f ? 6 : 0; // a little more hip width for the female figure
    return `<path d="M68 0 H132 Q${150 + h} 40 ${152 + h} 80 Q${150 + h} 104 140 112 L136 170 Q134 182 132 196 L128 252 Q126 262 114 262 L110 262 Q106 230 106 196 L104 170 Q102 132 100 112 Q98 132 96 170 L94 196 Q94 230 90 262 L86 262 Q74 262 72 252 L68 196 Q66 182 64 170 L60 112 Q${50 - h} 104 ${48 - h} 80 Q${50 - h} 40 68 0 Z"/>`;
  }

  function figure(view, hi, gender, opts = {}) {
    const f = gender === "f", set = new Set((hi || []).map(m => ALIAS[m] || m));
    const regs = REG[view];
    const parts = Object.entries(regs).map(([m, d]) => `<g class="mz${set.has(m) ? " on" : ""}" data-m="${m}">${d}</g>`).join("");
    return `<svg class="anat ${opts.cls || ""}" viewBox="40 -4 120 272" role="img" aria-label="${view} view: ${[...set].join(", ")}">
      <g class="sil">${silhouette(f)}</g>${parts}
      <text x="100" y="-10" class="vlab">${view === "back" ? "BACK" : "FRONT"}</text></svg>`;
  }
  function pair(hi, gender, cls) {
    const s = new Set((hi || []).map(m => ALIAS[m] || m));
    const front = ["Core", "Abductors", "Quads", "Adductors", "Tibialis"].some(m => s.has(m));
    const back = ["Lower Back", "Glutes", "Hamstrings", "Calves"].some(m => s.has(m));
    const views = front && back ? ["back", "front"] : front ? ["front"] : ["back"];
    return views.map(v => figure(v, hi, gender, { cls })).join("");
  }
  window.Anatomy = { figure, pair };
})();

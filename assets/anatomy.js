/* Stylised full-body anatomy figures (front + back). Highlights the muscles an exercise works. */
(function () {
  const M = d => d; // shapes are written for the right side of the figure; mirror() adds the left side
  const mirror = svg => svg + `<g transform="translate(200 0) scale(-1 1)">${svg}</g>`;
  const LEG = 170; // lower-body shapes are drawn from the waist down and shifted by this much

  const REG = {
    front: {
      Shoulders: mirror(`<ellipse cx="146" cy="74" rx="11" ry="13"/>`),
      Chest: mirror(`<path d="M102 66 Q126 61 140 72 Q143 95 128 106 Q110 109 102 100 Z"/>`),
      Biceps: mirror(`<ellipse cx="155" cy="114" rx="7.5" ry="21"/>`),
      Forearms: mirror(`<path d="M154 160 Q162 156 166 164 L170 220 Q168 228 162 226 L156 186 Z"/>`),
      Core: `<rect x="85" y="110" width="30" height="62" rx="9"/>` + mirror(`<path d="M118 114 Q134 112 138 124 L132 168 Q124 172 118 168 Z"/>`),
      Abductors: `<g transform="translate(0 ${LEG})">` + mirror(`<path d="M152 62 Q156 80 148 98 Q140 92 140 76 Q142 64 152 62 Z"/>`) + `</g>`,
      Quads: `<g transform="translate(0 ${LEG})">` + mirror(`<path d="M140 84 Q126 76 110 88 Q106 124 112 166 Q124 174 134 166 Q144 126 140 84 Z"/>`) + `</g>`,
      Adductors: `<g transform="translate(0 ${LEG})">` + mirror(`<path d="M108 92 Q101 96 102 120 Q104 138 108 142 Q111 120 108 92 Z"/>`) + `</g>`,
      Tibialis: `<g transform="translate(0 ${LEG})">` + mirror(`<path d="M124 188 Q116 184 112 192 Q112 216 116 236 Q121 236 124 224 Q127 206 124 188 Z"/>`) + `</g>`
    },
    back: {
      Traps: `<path d="M88 47 L112 47 L132 62 L100 80 L68 62 Z"/>`,
      "Lower Traps": `<path d="M100 82 L118 70 L106 124 L94 124 L82 70 Z"/>`,
      Shoulders: mirror(`<ellipse cx="146" cy="74" rx="11" ry="13"/>`),
      "Rear Delts": mirror(`<ellipse cx="148" cy="80" rx="9" ry="9"/>`),
      Back: mirror(`<path d="M118 86 Q140 82 146 102 Q142 138 122 160 Q110 150 108 120 Z"/>`),
      Triceps: mirror(`<ellipse cx="155" cy="114" rx="7.5" ry="21"/>`),
      Forearms: mirror(`<path d="M154 160 Q162 156 166 164 L170 220 Q168 228 162 226 L156 186 Z"/>`),
      "Lower Back": `<rect x="86" y="136" width="28" height="34" rx="9"/>`,
      Glutes: `<g transform="translate(0 ${LEG})">` + mirror(`<path d="M148 66 Q146 52 126 50 Q102 52 101 74 Q101 98 122 104 Q144 104 149 88 Z"/>`) + `</g>`,
      Hamstrings: `<g transform="translate(0 ${LEG})">` + mirror(`<path d="M142 108 Q126 102 108 108 Q105 140 112 168 Q124 174 134 168 Q144 140 142 108 Z"/>`) + `</g>`,
      Calves: `<g transform="translate(0 ${LEG})">` + mirror(`<path d="M130 186 Q118 180 108 188 Q106 214 113 236 Q120 240 125 236 Q134 212 130 186 Z"/>`) + `</g>`
    }
  };
  const FRONT_ONLY = ["Chest", "Biceps", "Core", "Abductors", "Quads", "Adductors", "Tibialis"];
  const BACK_ONLY = ["Traps", "Lower Traps", "Rear Delts", "Back", "Triceps", "Lower Back", "Glutes", "Hamstrings", "Calves"];
  const ALIAS = { Abs: "Core", Obliques: "Core", "Hip Abductors": "Abductors", Hamstring: "Hamstrings", Glute: "Glutes", Quad: "Quads", Calf: "Calves",
    Lats: "Back", "Upper Back": "Back", Delts: "Shoulders", "Lateral Delts": "Shoulders", "Front Delts": "Shoulders", Trapezius: "Traps" };

  function silhouette(f) {
    const h = f ? 6 : 0, w = f ? -4 : 0; // the female figure: a little more hip, a little less shoulder
    const torso = `<path d="M88 44 L112 44 Q118 56 ${140 + w} 60 Q${150 + w} 64 ${150 + w} 80 L146 120 Q140 150 132 172 L68 172 Q60 150 54 120 L${50 - w} 80 Q${50 - w} 64 ${60 - w} 60 Q82 56 88 44 Z"/>`;
    const arm = `<path d="M${146 + w} 62 Q${160 + w} 64 ${162 + w} 82 L166 140 Q168 150 166 158 L172 226 Q172 236 166 236 L160 236 Q156 232 156 224 L150 160 Q146 150 146 140 L142 100 Z"/>`;
    const legs = `<path transform="translate(0 ${LEG})" d="M68 0 H132 Q${150 + h} 40 ${152 + h} 80 Q${150 + h} 104 140 112 L136 170 Q134 182 132 196 L128 252 Q126 262 114 262 L110 262 Q106 230 106 196 L104 170 Q102 132 100 112 Q98 132 96 170 L94 196 Q94 230 90 262 L86 262 Q74 262 72 252 L68 196 Q66 182 64 170 L60 112 Q${50 - h} 104 ${48 - h} 80 Q${50 - h} 40 68 0 Z"/>`;
    return `<circle cx="100" cy="24" r="17"/>${torso}${mirror(arm)}${legs}`;
  }

  function figure(view, hi, gender, opts = {}) {
    const set = new Set((hi || []).map(m => ALIAS[m] || m));
    const parts = Object.entries(REG[view]).map(([m, d]) => `<g class="mz${set.has(m) ? " on" : ""}" data-m="${m}">${d}</g>`).join("");
    return `<svg class="anat ${opts.cls || ""}" viewBox="20 -16 160 466" role="img" aria-label="${view} view: ${[...set].join(", ")}">
      <g class="sil">${silhouette(gender === "f")}</g>${parts}
      <text x="100" y="-4" class="vlab">${view === "back" ? "BACK" : "FRONT"}</text></svg>`;
  }
  function pair(hi, gender, cls) {
    const s = new Set((hi || []).map(m => ALIAS[m] || m));
    const front = [...s].some(m => FRONT_ONLY.includes(m)), back = [...s].some(m => BACK_ONLY.includes(m));
    const views = front && back ? ["back", "front"] : front ? ["front"] : back ? ["back"] : ["front"];
    return views.map(v => figure(v, hi, gender, { cls })).join("");
  }
  window.Anatomy = { figure, pair };
})();

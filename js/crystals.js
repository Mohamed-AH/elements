// Lightweight crystal-structure viewer: a tiny orthographic 3D projector on
// Canvas 2D. No WebGL, no libraries — smooth on older tablets. Lattices are
// simplified single/small cells: the goal is "atoms stack in patterns", not
// crystallography homework.

const LATTICES = {
  salt: {
    title: 'Table salt (NaCl) — a cube of alternating atoms',
    build() {
      const atoms = [], bonds = [];
      for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) {
        const isNa = (x + y + z) % 2 === 0;
        atoms.push({ x, y, z, r: isNa ? 0.26 : 0.42, color: isNa ? '#c9a7ff' : '#7dffa8' });
      }
      eachPair(atoms, 1.01, (i, j) => bonds.push([i, j]));
      return { atoms, bonds };
    }
  },
  diamond: {
    title: 'Diamond — carbon locked in unbreakable pyramids',
    build() {
      const base = [
        [0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1],
        [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],[0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5],
        [0.25,0.25,0.25],[0.75,0.75,0.25],[0.75,0.25,0.75],[0.25,0.75,0.75]
      ];
      const atoms = base.map(([x, y, z]) => ({ x, y, z, r: 0.14, color: '#6ec6ff' }));
      const bonds = [];
      eachPair(atoms, 0.44, (i, j) => bonds.push([i, j]));
      return { atoms, bonds, cube: 1 };
    }
  },
  graphite: {
    title: 'Graphite — carbon in slippery flat sheets',
    build() {
      const atoms = [], bonds = [];
      const s3 = Math.sqrt(3);
      for (const layer of [0, 1]) {
        const z = layer * 1.4;
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
          const ax = s3 * i + (s3 / 2) * j, ay = 1.5 * j;
          for (const [px, py] of [[ax, ay], [ax, ay + 1]]) {
            if (Math.hypot(px, py + 0.5) < 2.7) atoms.push({ x: px, y: z, z: py, r: 0.16, color: layer ? '#8fd6ff' : '#9aa3c7' });
          }
        }
      }
      eachPair(atoms, 1.05, (i, j) => { if (atoms[i].y === atoms[j].y) bonds.push([i, j]); });
      return { atoms, bonds };
    }
  },
  iron: {
    title: 'Iron — a cube with a bonus atom in the middle',
    build() {
      const atoms = [];
      for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) {
        atoms.push({ x, y, z, r: 0.3, color: '#ff8d68' });
      }
      atoms.push({ x: 0.5, y: 0.5, z: 0.5, r: 0.3, color: '#ffcf5c' });
      const bonds = [];
      eachPair(atoms, 0.9, (i, j) => bonds.push([i, j]));
      return { atoms, bonds, cube: 1 };
    }
  }
};

export const LATTICE_TITLES = Object.fromEntries(
  Object.entries(LATTICES).map(([k, v]) => [k, v.title])
);

function eachPair(atoms, maxDist, fn) {
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a = atoms[i], b = atoms[j];
      if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= maxDist) fn(i, j);
    }
  }
}

export function mountCrystal(canvas, latticeName) {
  const lattice = LATTICES[latticeName];
  if (!lattice) return;
  const { atoms, bonds, cube } = lattice.build();

  // Center the model and find its extent for fitting.
  const cx = avg(atoms, 'x'), cy = avg(atoms, 'y'), cz = avg(atoms, 'z');
  for (const a of atoms) { a.x -= cx; a.y -= cy; a.z -= cz; }
  const extent = Math.max(...atoms.map((a) => Math.hypot(a.x, a.y, a.z))) + 0.5;

  const cubeEdges = [];
  if (cube) {
    const c = [[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]]
      .map(([x, y, z]) => ({ x: x - cx, y: y - cy, z: z - cz }));
    const pairs = [[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]];
    for (const [i, j] of pairs) cubeEdges.push([c[i], c[j]]);
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = Math.min(canvas.clientWidth || 360, 420);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rotX = -0.45, rotY = 0.65;
  let dragging = false, lastX = 0, lastY = 0, idleSince = 0;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    rotY += (e.clientX - lastX) * 0.012;
    rotX += (e.clientY - lastY) * 0.012;
    lastX = e.clientX; lastY = e.clientY;
    if (reducedMotion) draw();
  });
  const stopDrag = () => { dragging = false; idleSince = performance.now(); };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  function project(p) {
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const x1 = p.x * cosY + p.z * sinY;
    const z1 = -p.x * sinY + p.z * cosY;
    const y1 = p.y * cosX - z1 * sinX;
    const z2 = p.y * sinX + z1 * cosX;
    const s = (size / 2 - 20) / extent;
    const depth = 1 + z2 / (extent * 4); // gentle pseudo-perspective
    return { sx: size / 2 + x1 * s * depth, sy: size / 2 - y1 * s * depth, z: z2, scale: s * depth };
  }

  function draw() {
    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (const [a, b] of cubeEdges) {
      const pa = project(a), pb = project(b);
      ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
    }

    const projected = atoms.map(project);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (const [i, j] of bonds) {
      ctx.beginPath();
      ctx.moveTo(projected[i].sx, projected[i].sy);
      ctx.lineTo(projected[j].sx, projected[j].sy);
      ctx.stroke();
    }

    const order = projected.map((p, i) => i).sort((a, b) => projected[a].z - projected[b].z);
    for (const i of order) {
      const p = projected[i];
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, atoms[i].r * p.scale, 0, Math.PI * 2);
      ctx.fillStyle = atoms[i].color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  if (reducedMotion) {
    draw();
    return;
  }

  function frame(t) {
    if (!canvas.isConnected) return; // view was replaced; stop the loop
    if (!dragging && t - idleSince > 1500) rotY += 0.006;
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function avg(list, key) {
  return list.reduce((sum, item) => sum + item[key], 0) / list.length;
}

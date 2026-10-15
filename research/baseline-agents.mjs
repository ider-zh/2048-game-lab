import { dirs, slide, legal, spawn, draw } from './engine.mjs';
export const names = { random: '随机合法动作', priority: '固定方向优先', greedy: '即时合并贪心', heuristic: '局面启发式', expectimax: 'Expectimax', rollout: 'Monte Carlo rollout' };
export const defaults = { budget: 1600, depth: 2, horizon: 12 };
export function features(b) { const logs = b.map(v => v ? Math.log2(v) : 0); let smooth = 0, mono = 0; for (let i = 0; i < 16; i++) {
    if (i % 4 < 3)
        smooth -= Math.abs(logs[i] - logs[i + 1]);
    if (i < 12)
        smooth -= Math.abs(logs[i] - logs[i + 4]);
} for (let axis = 0; axis < 2; axis++)
    for (let l = 0; l < 4; l++) {
        let a = 0, c = 0;
        for (let j = 0; j < 3; j++) {
            const x = logs[axis ? j * 4 + l : l * 4 + j], y = logs[axis ? (j + 1) * 4 + l : l * 4 + j + 1];
            a += Math.max(0, x - y);
            c += Math.max(0, y - x);
        }
        mono -= Math.min(a, c);
    } const empty = b.filter(v => !v).length, max = Math.max(...logs), corner = [0, 3, 12, 15].some(i => logs[i] === max) ? max : 0; return { empty, smooth, mono, corner, total: empty * 120 + smooth * 3 + mono * 20 + corner * 30 }; }
export function decide(board, strategy, params, agentSeed = 12345) {
    const start = performance.now();
    let rng = agentSeed >>> 0, nodes = 0;
    const rows = dirs.map(dir => { const m = slide(board, dir); return { dir, legal: m.changed, merge: m.score, ...features(m.board), estimate: null, ms: 0 }; });
    const possible = rows.filter(r => r.legal);
    const quota = Math.max(1, Math.floor(params.budget / Math.max(1, possible.length)));
    function random() { const [v, s] = draw(rng); rng = s; return v; }
    function player(b, depth, limit) { if (depth <= 0 || nodes >= limit)
        return features(b).total; const ds = legal(b); if (!ds.length)
        return features(b).total - 2000; let best = -Infinity; for (const d of ds) {
        if (nodes >= limit)
            break;
        nodes++;
        const m = slide(b, d);
        best = Math.max(best, m.score + chance(m.board, depth - 1, limit));
    } return Number.isFinite(best) ? best : features(b).total; }
    function chance(b, depth, limit) { const empty = b.flatMap((v, i) => v ? [] : [i]); if (!empty.length)
        return player(b, depth, limit); let sum = 0; for (const i of empty)
        for (const [v, p] of [[2, .9], [4, .1]]) {
            const next = [...b];
            next[i] = v;
            const exhausted = nodes >= limit;
            if (!exhausted)
                nodes++;
            sum += p * (exhausted ? features(next).total : player(next, depth, limit)) / empty.length;
        } return sum; }
    for (const row of possible) {
        const t = performance.now(), m = slide(board, row.dir);
        if (strategy === 'random')
            row.estimate = random();
        if (strategy === 'priority')
            row.estimate = 4 - dirs.indexOf(row.dir);
        if (strategy === 'greedy')
            row.estimate = m.score;
        if (strategy === 'heuristic')
            row.estimate = m.score + row.total;
        if (strategy === 'expectimax') {
            const limit = nodes + quota;
            row.estimate = m.score + chance(m.board, Math.max(0, params.depth - 1), limit);
        }
        if (strategy === 'rollout') {
            const horizon = Math.min(params.horizon, quota);
            let sum = 0, count = Math.max(1, Math.floor(quota / horizon));
            for (let k = 0; k < count; k++) {
                let b = m.board, score = m.score;
                for (let j = 0; j < horizon; j++) {
                    const s = spawn(b, rng);
                    rng = s.rng;
                    b = s.board;
                    const ds = legal(b);
                    if (!ds.length)
                        break;
                    const next = slide(b, ds[Math.floor(random() * ds.length)]);
                    b = next.board;
                    score += next.score;
                    nodes++;
                }
                sum += score + features(b).total;
            }
            row.estimate = sum / count;
        }
        row.ms = performance.now() - t;
    }
    const best = [...possible].sort((a, b) => (b.estimate ?? 0) - (a.estimate ?? 0))[0];
    return { dir: best?.dir ?? null, rows, ms: performance.now() - start, nodes };
}

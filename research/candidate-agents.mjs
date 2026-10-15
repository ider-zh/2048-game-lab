import { dirs, slide, legal, spawn, draw } from './engine.mjs';
export const names = { random: '随机合法动作', priority: '固定方向优先', greedy: '即时合并贪心', heuristic: '局面启发式', expectimax: 'Expectimax · 推荐', rollout: 'Monte Carlo rollout' };
export const defaults = { budget: 6000, depth: 3, horizon: 12 };
export const ALGORITHM_VERSION = 'agents-2';
const powers = Array.from({ length: 54 }, (_, i) => i * i);
export function features(b) {
    const logs = b.map(v => v ? Math.log2(v) : 0);
    let smooth = 0, mono = 0, pairs = 0;
    for (let axis = 0; axis < 2; axis++)
        for (let l = 0; l < 4; l++) {
            let forward = 0, backward = 0, previous = 0;
            for (let i = 0; i < 4; i++) {
                const x = logs[axis ? i * 4 + l : l * 4 + i];
                if (i < 3) {
                    const y = logs[axis ? (i + 1) * 4 + l : l * 4 + i + 1], diff = powers[x] - powers[y];
                    forward += Math.max(0, diff);
                    backward += Math.max(0, -diff);
                }
                if (x) {
                    if (previous) {
                        smooth -= Math.abs(previous - x);
                        if (previous === x)
                            pairs++;
                    }
                    previous = x;
                }
            }
            mono -= Math.min(forward, backward);
        }
    const empty = b.filter(v => !v).length, max = Math.max(...logs), corner = [0, 3, 12, 15].some(i => logs[i] === max) ? powers[max] : 0;
    return { empty, smooth, mono, corner, pairs, total: empty * 270 + smooth * 3 + mono * 15 + corner * 5 + pairs * 100 };
}
export function decide(board, strategy, params, agentSeed = 12345) {
    const start = performance.now();
    let rng = agentSeed >>> 0, nodes = 0, completedDepth = 0;
    const budget = Math.max(4, Math.min(200000, Number.isFinite(params.budget) ? Math.floor(params.budget) : defaults.budget));
    const maxDepth = Math.max(1, Math.min(5, Number.isFinite(params.depth) ? Math.floor(params.depth) : defaults.depth));
    const horizon = Math.max(1, Math.min(100, Number.isFinite(params.horizon) ? Math.floor(params.horizon) : 12));
    const rows = dirs.map(dir => { const m = slide(board, dir); return { dir, legal: m.changed, merge: m.score, ...features(m.board), estimate: null, ms: 0 }; });
    const possible = rows.filter(r => r.legal);
    function random() { const [v, s] = draw(rng); rng = s; return v; }
    function evaluate(b) { return features(b).total; }
    // A whole depth is committed only when all legal root actions finish.
    // Budget exhaustion never mixes deep early branches with shallow late branches.
    const exhausted = Symbol('budget');
    function consume() { if (nodes >= budget)
        throw exhausted; nodes++; }
    function player(b, depth) { consume(); if (depth === 0) {
        const alive = b.some((v, i) => v === 0 || (i % 4 < 3 && v === b[i + 1]) || (i < 12 && v === b[i + 4]));
        return alive ? evaluate(b) : -1e7;
    } const ds = legal(b); if (!ds.length)
        return -1e7; let best = -Infinity; for (const d of ds) {
        const m = slide(b, d);
        best = Math.max(best, m.score + chance(m.board, depth - 1));
    } return best; }
    function chance(b, depth) { const empty = b.flatMap((v, i) => v ? [] : [i]); if (!empty.length)
        return player(b, depth); let sum = 0; for (const i of empty) {
        const next = [...b];
        next[i] = 2;
        sum += .9 * player(next, depth) / empty.length;
        next[i] = 4;
        sum += .1 * player(next, depth) / empty.length;
    } return sum; }
    for (const row of possible) {
        const t = performance.now(), m = slide(board, row.dir);
        if (strategy === 'random')
            row.estimate = random();
        else if (strategy === 'priority')
            row.estimate = 4 - dirs.indexOf(row.dir);
        else if (strategy === 'greedy')
            row.estimate = m.score;
        else
            row.estimate = m.score + row.total;
        if (strategy === 'rollout') {
            const quota = Math.max(1, Math.floor(budget / possible.length)), length = Math.min(horizon, quota), count = Math.max(1, Math.floor(quota / length));
            let sum = 0;
            for (let k = 0; k < count; k++) {
                let b = m.board, score = m.score, terminal = false;
                for (let j = 0; j < length; j++) {
                    const s = spawn(b, rng);
                    rng = s.rng;
                    b = s.board;
                    const ds = legal(b);
                    if (!ds.length) {
                        terminal = true;
                        break;
                    }
                    const next = slide(b, ds[Math.floor(random() * ds.length)]);
                    b = next.board;
                    score += next.score;
                    nodes++;
                }
                sum += score + (terminal ? -1e7 : evaluate(b));
            }
            row.estimate = sum / count;
        }
        row.ms = performance.now() - t;
    }
    if (strategy === 'expectimax' && possible.length) {
        for (let depth = 1; depth <= maxDepth; depth++) {
            const values = [];
            try {
                for (const row of possible) {
                    const t = performance.now(), m = slide(board, row.dir);
                    try {
                        values.push(m.score + chance(m.board, depth - 1));
                    }
                    finally {
                        row.ms += performance.now() - t;
                    }
                }
            }
            catch (e) {
                if (e === exhausted)
                    break;
                throw e;
            }
            possible.forEach((row, i) => row.estimate = values[i]);
            completedDepth = depth;
        }
    }
    const best = [...possible].sort((a, b) => (b.estimate ?? -Infinity) - (a.estimate ?? -Infinity))[0];
    return { dir: best?.dir ?? null, rows, ms: performance.now() - start, nodes, completedDepth, fallback: strategy === 'expectimax' && possible.length > 0 && completedDepth === 0 ? '预算不足，使用合法启发式动作' : null };
}
// Runtime boundary: a strategy bug must never look like a normal game over.
export function safeDecide(board, strategy, params, agentSeed = 12345) {
    const actions = legal(board);
    try {
        const result = decide(board, strategy, params, agentSeed);
        if (!actions.length)
            return result;
        if (result.dir && actions.includes(result.dir))
            return result;
        throw Error('策略未返回合法动作');
    }
    catch (e) {
        const result = decide(board, 'heuristic', defaults, agentSeed);
        return { ...result, dir: result.dir ?? actions[0] ?? null, fallback: `策略计算异常，已回退启发式：${String(e)}` };
    }
}

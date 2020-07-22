import * as Util from './util.js';

export function toSVGPoint (ev) {
    const svg = ev.target.closest('svg');
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgPoint.x, y: svgPoint.y };
}

export function quantizeSVGPoint (point) {
    return { x: Util.quantize(point.x, 1), y: Util.quantize(point.y, 1) };
}

export function movetool (ev, update, commit) {
    let last = toSVGPoint(ev);

    function mousemove (ev) {
        let curr = toSVGPoint(ev);
        update({ dx: curr.x - last.x, dy: curr.y - last.y });
        last = curr;
    };

    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', (ev) => {
        document.removeEventListener('mousemove', mousemove);
        let curr = toSVGPoint(ev);
        commit({ dx: curr.x - last.x, dy: curr.y - last.y });
    }, { once: true });
}

export function line (ev, update, commit) {
    let start = quantizeSVGPoint(toSVGPoint(ev));
    let line = [start];

    function mousemove (ev) {
        let curr = quantizeSVGPoint(toSVGPoint(ev));
        line = Util.line(start.x, start.y, curr.x, curr.y);
        update(line);
    };

    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', (ev) => {
        document.removeEventListener('mousemove', mousemove);
        let curr = quantizeSVGPoint(toSVGPoint(ev));
        commit(Util.line(start.x, start.y, curr.x, curr.y));
    }, { once: true });
}

export function rect (ev, update, commit) {
    let start = quantizeSVGPoint(toSVGPoint(ev));
    let cells = [start];

    function mousemove (ev) {
        let curr = quantizeSVGPoint(toSVGPoint(ev));
        cells = Util.rect(start.x, start.y, curr.x, curr.y);
        update(cells);
    };

    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', (ev) => {
        document.removeEventListener('mousemove', mousemove);
        let curr = quantizeSVGPoint(toSVGPoint(ev));
        commit(Util.rect(start.x, start.y, curr.x, curr.y));
    }, { once: true });
}

export function filledRect (ev, update, commit) {
    let start = quantizeSVGPoint(toSVGPoint(ev));
    let cells = [start];

    function mousemove (ev) {
        let curr = quantizeSVGPoint(toSVGPoint(ev));
        cells = Util.filledRect(start.x, start.y, curr.x, curr.y);
        update(cells);
    };

    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', (ev) => {
        document.removeEventListener('mousemove', mousemove);
        let curr = quantizeSVGPoint(toSVGPoint(ev));
        commit(Util.filledRect(start.x, start.y, curr.x, curr.y));
    }, { once: true });
}

export function pen (ev, update, commit) {
    let start = quantizeSVGPoint(toSVGPoint(ev));
    let cells = [start];

    const hasPoint = (point) => cells.find(p => p.x === point.x && p.y === point.y);

    function mousemove (ev) {
        let curr = quantizeSVGPoint(toSVGPoint(ev));
        if (hasPoint(curr)) return;

        const last = cells[cells.length - 1] || null;

        if (last) {
            // we may end up adding points that already exist in cells;
            cells.push(...Util.line(last.x, last.y, curr.x, curr.y))
        } else {
            cells.push(curr);
        }

        update(cells);
    };

    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', (ev) => {
        document.removeEventListener('mousemove', mousemove);
        let curr = quantizeSVGPoint(toSVGPoint(ev));
        if (!hasPoint(curr)) cells.push(curr);
        commit(cells);
    }, { once: true });
}

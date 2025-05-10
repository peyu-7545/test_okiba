// draw.js
// 主に描画処理を行う

// 引数の位置に球を描画する
function sphere(position, color) {

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(...scaling(position), canvasSize / size * scalingFactor / 5, 0, Math.PI * 2);
    ctx.fill();
}

// 引数の位置に立方体を描画する
function cube([x, y, z], color, size = 1) {

    ctx.strokeStyle = color;
    const r = size / 2;

    // 立方体の4面を描画する(残りの2面は描画しなくてよい)
    polygon(`stroke`, [x - r, y - r, z - r], [x + r, y - r, z - r], [x + r, y - r, z + r], [x - r, y - r, z + r]);
    polygon(`stroke`, [x - r, y + r, z - r], [x + r, y + r, z - r], [x + r, y + r, z + r], [x - r, y + r, z + r]);
    polygon(`stroke`, [x - r, y - r, z - r], [x - r, y - r, z + r], [x - r, y + r, z + r], [x - r, y + r, z - r]);
    polygon(`stroke`, [x + r, y - r, z - r], [x + r, y - r, z + r], [x + r, y + r, z + r], [x + r, y + r, z - r]);
}

// 頂点から多角形を描画する
function polygon(type, ...points) {

    const scaledPoints = points.map(e => scaling(e));
    ctx.beginPath();
    // 最後の点から始めることでループを簡単にする
    ctx.moveTo(...scaledPoints[scaledPoints.length - 1]);
    for (const p of scaledPoints) {
        ctx.lineTo(...p);
    }

    // `fill`または`stroke`で描画する
    ctx[type]();
}
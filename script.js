const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const size = 3;
const center = (size - 1) / 2;
const cameraPosition = { x: center, y: center, z: -size };
const rotateCenter = { x: center, y: center, z: center };
const inputKeys = [];
const cubeColor = "#00000010";
const playerColor = { "1": "black", "-1": "white" };
let isPressed = false, isClicked = false;
let board = [], selectCube = [], selectDet = [];
let turn = 1, theta = 0, phi = .3;
let canvasSize, mouseX, mouseY, winner;
let offsetX, offsetY;
let resultView = false;
let scalingFactor;

/**
 * キャンバスをリサイズし、キャンバス依存の変数を更新する
 */
function resizeCanvas() {
    canvasSize = Math.min(innerWidth, innerHeight);
    canvas.width = canvasSize, canvas.height = canvasSize;
    ctx.translate(canvasSize / 2, canvasSize / 2);
    offsetX = (window.innerWidth - canvas.width) / 2;
    offsetY = (window.innerHeight - canvas.height) / 2;
    scalingFactor = canvasSize * .7;
}

/**
 * ゲームループを実行
 */
function gameLoop() {
    // ゲームが終わっていないならループを続け、終わっている(勝負がついたか引き分け)ならend関数を呼び出す
    if (winner == undefined || resultView) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        end();
    }
}

function draw() {
    ctx.clearRect(-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize);
    ctx.fillStyle = "green";
    ctx.fillRect(-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize);
    const hoveredCube = hover();
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                cube(x, y, z);
                if (!resultView) {
                    if (isMatchArray(x, y, z, hoveredCube) && selectDet.length == 0 && board[convert(x, y, z)] == 0) {
                        bottom(x, y, z, "red");
                    }
                    if (isMatchArray(x, y, z, selectCube)) {
                        bottom(x, y, z, "blue");
                    }
                    if (isMatchArray(x, y, z, selectDet)) {
                        bottom(x, y, z, "yellow");
                    }
                }
                if (board[convert(x, y, z)] != 0) {
                    ctx.fillStyle = playerColor[board[convert(x, y, z)]];
                    circle(x, y, z);
                }
            }
        }
    }
}

function update() {
    // 入力キーの処理
    if (inputKeys[32]) theta = 0, phi = 0;
    if (inputKeys[65]) theta += .1;
    if (inputKeys[87]) phi -= .1;
    if (inputKeys[68]) theta -= .1;
    if (inputKeys[83]) phi += .1;
    if (inputKeys[82] && resultView) {
        init();
        return;
    }

    const hoveredCube = hover();
    if (isClicked && hoveredCube.length != 0) {
        if (selectDet.length == 1 && !isPressed) {
            board[convert(...selectDet[0])] = turn;
            turn *= -1;
            isPressed = true;
        }
        if (selectDet.length == 0) {
            selectCube = hoveredCube.filter(([x, y, z]) => board[convert(x, y, z)] == 0);
        }
    }
    if (isPressed) {
        selectCube = [];
    }

    if (!resultView) {
        const setA = new Set(hoveredCube.map(e => e.toString()));
        selectDet = [];
        for (const subArr of selectCube) {
            if (setA.has(subArr.toString())) {
                selectDet.push(subArr);
            }
        }
    }
}

function end() {
    ctx.font = `${canvasSize / 8}px bold`
    if (winner == 0) {
        ctx.fillStyle = "gray";
        ctx.fillText("引き分け！", -canvasSize * .3, 0);
    } else {
        ctx.fillStyle = playerColor[winner];
        ctx.fillText(`${playerColor[winner]}の勝利！`, -canvasSize * .3, 0);
    }
    setTimeout(() => {
        if (confirm("再プレイしますか？")) {
            init();
        } else {
            alert("再プレイしたい場合はRキーを押してください");
            resultView = true;
            requestAnimationFrame(gameLoop);
        }
    }, 50);
}

const isMatchArray = (x, y, z, arr) => arr.some(e => e[0] == x && e[1] == y && e[2] == z);

function isPointinPolygon(x, y, polygon) {
    n = polygon.length;
    inSide = false;
    for (let i = 0; i < n; i++) {
        [xi, yi] = polygon[i];
        [xj, yj] = polygon[(i + 1) % n];

        intersect = (yi > y) == (y > yj) && (x < (xj - xi) * (y - yi) / (yj - yi + 1e-10) + xi);

        if (intersect) {
            inSide = !inSide;
        }
    }
    return inSide;
}

function hover() {
    const hoveredCube = [];
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                const cubeBottomPoints = [[x - .5, y - .5, z - .5], [x + .5, y - .5, z - .5], [x + .5, y - .5, z + .5], [x - .5, y - .5, z + .5]];
                const isHover = isPointinPolygon(mouseX, mouseY, cubeBottomPoints.map(e => scaling(...e)));
                if (isHover && board[convert(x, y, z)] == 0) {
                    hoveredCube.push([x, y, z]);
                }
            }
        }
    }
    return hoveredCube;
}

function judge([x, y, z], selected = board[convert(x, y, z)]) {
    const directions = [
        { dx: +1, dy: +0, dz: +0 }, { dx: +0, dy: +1, dz: +0 }, { dx: +0, dy: +0, dz: +1 },
        { dx: +1, dy: +0, dz: +1 }, { dx: +1, dy: +0, dz: -1 }, { dx: +1, dy: +1, dz: +0 },
        { dx: +1, dy: -1, dz: +0 }, { dx: +0, dy: +1, dz: +1 }, { dx: +0, dy: -1, dz: +1 },
        { dx: +1, dy: +1, dz: +1 }, { dx: +1, dy: -1, dz: +1 }, { dx: +1, dy: +1, dz: -1 }, { dx: +1, dy: -1, dz: -1 },
    ];

    let result = [];

    directions.forEach(({ dx, dy, dz }, index) => {
        let startX = x, startY = y, startZ = z;

        while (
            startX - dx >= 0 && startX - dx < size &&
            startY - dy >= 0 && startY - dy < size &&
            startZ - dz >= 0 && startZ - dz < size
        ) {
            startX -= dx;
            sta
    return result.length > 0 ? result : undefined;
}

/**
 * 
 * @param {*} x 変換するx座標
 * @param {*} y 変換するy座標
 * @param {*} z 変換するz座標
 * @returns 
 */
const convert = (x, y, z) => x + y * size + z * size * size;

function init() {
    board = new Array(size ** 3).fill(0);
    selectCube = [];
    selectDet = [];
    winner = undefined;
    resultView = false;
    gameLoop();
}

/**
 * 今の状況で打つと勝てる手を探す
 * @param {Number} judgeTurn 判定するときのターン、デフォルトは現在ターン
 * @returns 打てば勝てる手の座標(なければundefined)
 */
function getWinningMove(judgeTurn = turn) {
    const winPositions = [];
    // ループで全てのセルに対して判定する
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                const i = convert(x, y, z);
                // 既に埋まっている(0でない)ときはスキップ
                if (board[i]) continue;
                // 置いたら勝てるかをチェックし、trueなら候補に追加
                judge([x, y, z], judgeTurn) && winPositions.push(i);
            }
        }
    }

    // 勝てる場所があるならその場所を返し、なければundefined
    return winPositions.length > 0 ? winPositions : undefined;
}

/**
 * boardのインデックスを座標に変換する
 * @param {number} i 復元前の座標
 * @return {array} 復元後の座標
 */
function unConvert(i) {
    x = i % size;
    y = Math.floor(i / size) % size;
    z = Math.floor(i / size / size) % size;
    return [x, y, z];
}

/**
 * 3D点をキャンバスに直接描画できる座標にスケーリングする
 * @param {number} x スケーリングするx座標
 * @param {number} y スケーリングするy座標
 * @param {number} z スケーリングするz座標
 * @returns キャンバスでの座標
 */
function scaling(x, y, z) {
    // カメラより手前にある場合は描画しないのでundefinedを返す
    if (z < cameraPosition.z) {
        return;
    }
    // y軸を中心としてthetaだけ回転移動させた座標を計算する
    [x, z] = [
        (x - rotateCenter.x) * Math.cos(theta) + (z - rotateCenter.z) * Math.sin(theta) + rotateCenter.x,
        (z - rotateCenter.z) * Math.cos(theta) - (x - rotateCenter.x) * Math.sin(theta) + rotateCenter.z
    ];
    // x軸を中心としてphiだけ回転移動させた座標を計算する
    [y, z] = [
        (y - rotateCenter.y) * Math.cos(phi) + (z - rotateCenter.z) * Math.sin(phi) + rotateCenter.y,
        (z - rotateCenter.z) * Math.cos(phi) - (y - rotateCenter.y) * Math.sin(phi) + rotateCenter.z
    ]
    // カメラの分だけ相対位置を動かす
    x -= cameraPosition.x;
    y -= cameraPosition.y;
    z -= cameraPosition.z;
    // 奥行きで割って2Dにし、補正係数を掛ける
    return [x / z * scalingFactor, -y / z * scalingFactor];
}

/**
 * 引数の座標に◯を描画する
 * @param {number} x 描画するx座標
 * @param {number} y 描画するy座標
 * @param {number} z 描画するz座標
 */
function circle(x, y, z) {
    const points = [];
    for (let i = 0; i < Math.PI * 2; i += .1) {
        points.push([x + .3 * Math.cos(i), y - .5, z + .3 * Math.sin(i)]);
    }
    polygon("fill", ...points);
}

/**
 * 引数の座標にキューブを描画する
 * @param {number} x 描画するx座標
 * @param {number} y 描画するy座標
 * @param {number} z 描画するz座標
 */
function cube(x, y, z) {
    ctx.strokeStyle = cubeColor;
    polygon("stroke", [x - .5, y - .5, z - .5], [x + .5, y - .5, z - .5], [x + .5, y - .5, z + .5], [x - .5, y - .5, z + .5]);
    polygon("stroke", [x - .5, y + .5, z - .5], [x + .5, y + .5, z - .5], [x + .5, y + .5, z + .5], [x - .5, y + .5, z + .5]);
    polygon("stroke", [x - .5, y - .5, z - .5], [x - .5, y - .5, z + .5], [x - .5, y + .5, z + .5], [x - .5, y + .5, z - .5]);
    polygon("stroke", [x + .5, y - .5, z - .5], [x + .5, y - .5, z + .5], [x + .5, y + .5, z + .5], [x + .5, y + .5, z - .5]);
}

/**
 * 引数の座標にキューブの底面を描画する
 * @param {number} x 描画するx座標
 * @param {number} y 描画するy座標
 * @param {number} z 描画するz座標
 * @param {string} color 枠線の色
 */
function bottom(x, y, z, color) {
    ctx.strokeStyle = color;
    polygon("stroke", [x - .5, y - .5, z - .5], [x + .5, y - .5, z - .5], [x + .5, y - .5, z + .5], [x - .5, y - .5, z + .5]);
}

/**
 * 引数の座標に点を描画する
 * @param {number} x 描画するx座標
 * @param {number} y 描画するy座標
 * @param {number} z 描画するz座標
 */
function point(x, y, z) {
    const scaled = scaling(x, y, z);
    if (scaled == undefined) return;
    [x, y] = scaled;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * 引数の座標を各頂点とする多角形を描画する
 * @param  {...array} points 座標の配列
 */
function polygon(type, ...points) {
    // 全ての点をスケーリングする
    const scaledPoints = points.map(e => scaling(...e));

    ctx.beginPath();
    ctx.moveTo(...scaledPoints[scaledPoints.length - 1]);
    for (const p of scaledPoints) {
        p && ctx.lineTo(...p);
    }

    ctx[type]();
}

// ポインター関連の処理
document.addEventListener("pointermove", e => {
    mouseX = e.clientX - canvasSize / 2 - offsetX;
    mouseY = e.clientY - canvasSize / 2 - offsetY
});

document.addEventListener("pointerdown", () => {
    isClicked = true;
});

document.addEventListener("pointerup", () => {
    isClicked = false;
    isPressed = false;
});

// 押下されているキーはtrue、離されたキーはfalseにする
document.onkeydown = (e) => inputKeys[e.keyCode] = true;
document.onkeyup = (e) => inputKeys[e.keyCode] = false;

// リサイズに応じてキャンバスもリサイズする
window.onresize = resizeCanvas;

// 初期化する
resizeCanvas();
init();
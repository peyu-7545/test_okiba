// osero_script.js

// DOM要素の取得
const canvas = document.querySelector(`canvas`);
const description = document.getElementById(`description`);

// レンダリングコンテキストの取得
const ctx = canvas.getContext(`2d`);

// ゲームの基本パラメーター
const size = 8; // 盤面の一辺のセル数

// ターンと角度
const defaultParam = { turn: 1, angle: { theta: 0, phi: 0 } }; // パラメーターの初期値
const gameParam = structuredClone(defaultParam); // 可変パラメーター

// セルの状態を保存する変数
let board = []; // 盤面
let hoveredCell = []; // ホバーセル
let selectedCell = []; // 選択セル
let determinedCell = []; // 決定セル
let legalMove = []; // 合法手セル

// スケーリング・描画パラメーター
const center = (size - 1) / 2; // 中心の座標
const cameraPosition = { x: center, y: center, z: -size }; // カメラの位置
const rotateCenter = { x: center, y: center, z: center }; // 回転の中心
const offset = new Object; // キャンバスの左上の座標
const scalingFactor = 0.7; // スケーリング係数(拡大率の)
const cellColor = `#ffffff30`; // 合法手セルの色
const playerColor = { "1": `black`, "-1": `white` }; // プレイヤーの色
let canvasSize; // キャンバスのw/h

// 操作フラグ
const inputKeys = []; // 入力キーを格納する配列
const mouse = new Object; // マウス位置
let isPressed = false; // 長押しフラグ
let isClicked = false; // クリックフラグ

// ゲームの状態のフラグ
let isGameEnd = false; // ゲーム終了フラグ
let isResultView = false; // リザルトビューフラグ
let PathCount = 0; // 連続パスの回数

// 描画フラグ
let isOutBorderDraw = false; // 外枠を描画するか
let isHintMode = true; // 合法手を描画するか

// デバッグ用
let frame = 0;
let fps;

// 自動対戦
let isAutoBattle = false;

/**
 * ゲームループを実行
 */
function gameLoop() {
    // ループ
    if (isAutoBattle && !isGameEnd) random();
    update();
    draw();
    requestAnimationFrame(gameLoop);
    frame++;
}

/**
 * canvasに描画する関数
 */
function draw() {

    // 背景で塗りつぶす
    ctx.fillStyle = `green`;
    ctx.fillRect(-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize);

    // 設定次第で外枠描画
    if (isOutBorderDraw) cube(center, center, center, `lightgray`, size);

    // 各セルについて描画
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {

                // リザルトビュー時は描画しない
                if (!isResultView) {

                    // ホバーしているキューブがあり、かつ決定しているキューブがないとき
                    if (isSomeMatchArray([x, y, z], hoveredCell) && !determinedCell.length) {
                        cube(x, y, z, `red`);
                    } else if (isSomeMatchArray([x, y, z], legalMove) && isHintMode) {
                        cube(x, y, z, cellColor);
                    }

                    // 選択しているキューブがあるとき
                    if (isSomeMatchArray([x, y, z], selectedCell)) cube(x, y, z, `blue`);

                    // 選択していて、かつホバーしているキューブがあるとき
                    if (isSomeMatchArray([x, y, z], determinedCell)) cube(x, y, z, `yellow`);
                }

            }
        }
    }

    // 駒を描画する
    // context2Dでレイマーチングは重いのでカメラからの距離でソートして遠い方から描画する
    board.map((e, i) => ({ e, i })).filter(p => p.e).sort((a, b) => getDistance(iTp(b.i)) - getDistance(iTp(a.i))).forEach(({ e, i }) => circle(...iTp(i), e));
}

// カメラとの距離の2乗を求める
function getDistance([x, y, z]) {

    // それぞれの距離
    [dx, dy, dz] = scaling3D(x, y, z);

    return dx * dx + dy * dy + dz * dz;
}

/**
 * 盤面を更新する
 * @param {array} 置く座標
 * @return 置けたか
 */
function updateBoard(placedCell) {

    // ひっくり返すセルを取得する
    const reversible = getReversibleCells(placedCell);

    if (reversible.length == 0) {
        // ひっくり返せるセルが存在しない場合は置けないのでfalseを返す
        return false;
    }

    // 置いた場所を更新する
    board[pTi(placedCell)] = gameParam.turn;

    // ひっくり返せるセルを更新する
    reversible.forEach(e => {
        board[pTi(e)] = gameParam.turn;
    });

    // ターンを逆転させる
    gameParam.turn *= -1;

    // 長押しでまた呼び出されないようにする
    isPressed = true;

    // ゲームエンド判定

    // 全て0ではない(各セルが置かれている)または両者ともパスならばゲームエンド
    if (board.every(e => e != 0) || checkPath()) {
        isGameEnd = true;
        return;
    }

    return true;
}

function checkPath() {
    let isPath = false;
    if (!getLegalMove()) {
        if (pathCount == 0) {
            // 出せない場合はパス
            gameParam.turn *= -1;
            pathCount++;
            return checkPath();
        } else {
            // ふたりとも出せない場合はゲームエンド
            isPath = true;
            return isPath;
        }
    } else {
        pathCount = 0;
    }
}

/**
 * アップデートする
 */
function update() {

    // 入力キーの処理
    inputKeyProcess();

    if (isGameEnd) {
        // エンド関数を呼び出す
        end();
        // また呼ばれないようにフラグはこの時点でへし折る
        isGameEnd = false;
    } else {

        // ホバーしているキューブを検出する
        checkHover();

        // クリックアクション
        if (isClicked) clickAction();

        // 押下されているときは選択セルを空にする
        isPressed && (selectedCell = []);

        // 決定されたセルを検出する
        getDeterminedCell();
    }
}

/**
 * クリックされているときの処理
 */
function clickAction() {
    if (determinedCell.length == 1 && !isPressed) {
        // 決定セルが一つに決まり、かつ長押しされていないとき(駒が置かれたとき)
        // 盤面を更新する(置けなければreturn)
        if (!updateBoard(determinedCell[0])) return;
    } else if (determinedCell.length == 0) {
        // 決定セルがないとき
        // ホバーされているセルを選択セルにする
        selectedCell = [...hoveredCell];
    }
}

/**
 * ホバーされていて、かつ選択されているセルを決定セルにする
 */
function getDeterminedCell() {
    const setA = new Set(hoveredCell.map(e => e.join()));
    determinedCell = [];
    for (const subArr of selectedCell) {
        if (setA.has(subArr.join())) {
            determinedCell.push(subArr);
        }
    }
}

/**
 * 数が多い方を見つける
 * @return どちらが数が多いか
 */
function getStronger() {
    const sum = board.reduce((accum, current) => accum + current, 0); // 盤面の総和
    if (sum > 0) {
        return 1; // 1が-1より多い
    } else if (sum < 0) {
        return -1; // -1が1より多い
    } else {
        return 0; // 1と-1が同じ数ある
    }
}

/**
 * ゲーム終了時の処理
 */
function end() {
    const winner = getStronger(); // どちらが多いか調べる
    if (isAutoBattle) {
        console.log(winner == 0 ? `引き分け！` : `${playerColor[winner]}の勝利！`);
        init();
        return;
    }
    if (winner == 0) {
        // 同点
        alert(`引き分け！`);
    } else {
        // 強い方の勝ち
        alert(`${playerColor[winner]}の勝利！`);
        console.log(1);
    }
    setTimeout(() => {
        if (confirm(`再プレイしますか？`)) {
            init();
        } else {
            alert(`再プレイしたい場合はRキーを押してください`);
            isResultView = true;
        }
    }, 50);
}

/**
 * 点が多角形の内側か判別する
 * @param {number} x 判定したい点のx座標
 * @param {number} y 判定したい点のy座標
 * @param {array} polygon 内側か判定する多角形
 * @return 内側かどうか
 */
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

// 立方体の全ての面を取得(当たり判定のため)
const getCubeSides = (x, y, z) => [
    [[x - .5, y - .5, z - .5], [x + .5, y - .5, z - .5], [x + .5, y - .5, z + .5], [x - .5, y - .5, z + .5]],
    [[x - .5, y + .5, z - .5], [x + .5, y + .5, z - .5], [x + .5, y + .5, z + .5], [x - .5, y + .5, z + .5]],
    [[x - .5, y - .5, z - .5], [x - .5, y - .5, z + .5], [x - .5, y + .5, z + .5], [x - .5, y + .5, z - .5]],
    [[x + .5, y - .5, z - .5], [x + .5, y - .5, z + .5], [x + .5, y + .5, z + .5], [x + .5, y + .5, z - .5]],
    [[x - .5, y - .5, z - .5], [x + .5, y - .5, z - .5], [x + .5, y + .5, z - .5], [x - .5, y + .5, z - .5]],
    [[x - .5, y - .5, z + .5], [x + .5, y - .5, z + .5], [x + .5, y + .5, z + .5], [x - .5, y + .5, z + .5]],
];

/**
 * ホバーされているセルを検出する
 */
function checkHover() {
    hoveredCell = [];
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                const isHover = getCubeSides(x, y, z).some(e => isPointinPolygon(mouse.x, mouse.y, e.map(p => scaling(...p))));
                if (isHover && board[pTi([x, y, z])] == 0 && isSomeMatchArray([x, y, z], legalMove)) {
                    hoveredCell.push([x, y, z]);
                }
            }
        }
    }
}

/**
 * [x,y,z]にjudgeTurnの駒を置いたときに取れるセルを列挙する
 * @param {array} 置く場所 
 * @param {number} judgeTurn 判定するときのターン
 * @return ひっくり返せるセル
 */
function getReversibleCells([x, y, z], judgeTurn = gameParam.turn) {
    const reversibleCells = []; // ひっくり返せるセルを格納する配列
    // -1~1のループ
    for (let dx = -1; dx < 2; dx++) {
        for (let dy = -1; dy < 2; dy++) {
            for (let dz = -1; dz < 2; dz++) {
                if (!dx && !dy && !dz) continue; // 自分自身(全て0)はひっくり返さないのでスキップ
                const reversibleCandidate = []; // 候補を一時的に保存する配列
                [nx, ny, nz] = [x, y, z]; // 判定するセル
                while (true) {
                    nx += dx, ny += dy, nz += dz; // それぞれの方向に動かす
                    const israngeOut = (nx < 0 || size <= nx || ny < 0 || size <= ny || nz < 0 || size <= nz); // 範囲外に出たか
                    if (israngeOut) break; // 範囲外ならループ終了
                    const currentCell = board[pTi([nx, ny, nz])]; // 現在のセル
                    if (currentCell * -1 == judgeTurn) { // 逆のセル(ひっくり返せるセル)なら候補に追加
                        reversibleCandidate.push([nx, ny, nz]);
                    } else {
                        if (currentCell == judgeTurn) { // 同じセルなら候補はひっくり返せることが分かる
                            reversibleCells.push(...reversibleCandidate);
                        }
                        break;
                    }
                }
            }
        }
    }
    return reversibleCells;
}

/**
 * 座標からboardの要素にアクセスするためのインデックスに変換する
 * @param {number} x 変換するx座標
 * @param {number} y 変換するy座標
 * @param {number} z 変換するz座標
 * @return 変換されたインデックス
 */
const pTi = ([x, y, z]) => x + y * size + z * size * size;

/**
 * boardのインデックスを座標に変換する
 * @param {number} i 復元前の座標
 * @return {array} 復元後の座標
 */
const iTp = i => [i % size, (i / size | 0) % size, (i / size / size | 0) % size];

/**
 * 3D点をキャンバスに直接描画できる座標にスケーリングする
 * @param {number} x スケーリングするx座標
 * @param {number} y スケーリングするy座標
 * @param {number} z スケーリングするz座標
 * @return キャンバスでの座標もしくはundefined
 */
function scaling(x, y, z) {
    const [sx, sy, sz] = scaling3D(x, y, z);

    // 奥行きで割って2Dにし、補正係数で掛ける
    return [sx / sz * canvasSize * scalingFactor, -sy / sz * canvasSize * scalingFactor];
}

// 3Dで回転移動、平行移動を処理
function scaling3D(x, y, z) {
    // ※セルはその場で回転するだけなので、カメラより手前に来てしまった場合の処理は不要

    // y軸を中心としてgameParam.angle[0]だけ回転移動させた座標を計算する
    [x, z] = [
        (x - rotateCenter.x) * Math.cos(gameParam.angle.theta) + (z - rotateCenter.z) * Math.sin(gameParam.angle.theta) + rotateCenter.x,
        (z - rotateCenter.z) * Math.cos(gameParam.angle.theta) - (x - rotateCenter.x) * Math.sin(gameParam.angle.theta) + rotateCenter.z
    ];
    // x軸を中心としてgameParam.angle[1]だけ回転移動させた座標を計算する
    [y, z] = [
        (y - rotateCenter.y) * Math.cos(gameParam.angle.phi) + (z - rotateCenter.z) * Math.sin(gameParam.angle.phi) + rotateCenter.y,
        (z - rotateCenter.z) * Math.cos(gameParam.angle.phi) - (y - rotateCenter.y) * Math.sin(gameParam.angle.phi) + rotateCenter.z
    ]
    // カメラの分だけ相対位置を動かす
    x -= cameraPosition.x;
    y -= cameraPosition.y;
    z -= cameraPosition.z;

    return [x, y, z];
}

/**
 * 引数の座標に球を描画する
 * @param {number} x 描画するx座標
 * @param {number} y 描画するy座標
 * @param {number} z 描画するz座標
 */
function circle(x, y, z, turn) {

    // 円を描画して球に見せる
    ctx.fillStyle = playerColor[turn];
    ctx.beginPath();
    ctx.arc(...scaling(x, y, z), canvasSize / size * scalingFactor / 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = playerColor[turn * -1];
    ctx.stroke();
}

/**
 * 引数の座標にキューブを描画する
 * @param {number} x 描画するx座標
 * @param {number} y 描画するy座標
 * @param {number} z 描画するz座標
 */
function cube(x, y, z, color, size = 1) {

    // 色を変更する
    ctx.strokeStyle = color;

    // 中心から頂点までの距離を求める
    const r = size / 2;

    // 立方体の4面を描画する(残りの2面は描画しなくてよい)
    polygon(`stroke`, [x - r, y - r, z - r], [x + r, y - r, z - r], [x + r, y - r, z + r], [x - r, y - r, z + r]);
    polygon(`stroke`, [x - r, y + r, z - r], [x + r, y + r, z - r], [x + r, y + r, z + r], [x - r, y + r, z + r]);
    polygon(`stroke`, [x - r, y - r, z - r], [x - r, y - r, z + r], [x - r, y + r, z + r], [x - r, y + r, z - r]);
    polygon(`stroke`, [x + r, y - r, z - r], [x + r, y - r, z + r], [x + r, y + r, z + r], [x + r, y + r, z - r]);
}

/**
 * 引数の座標を各頂点とする多角形を描画する
 * @param {string} type 描画タイプ(string or fill) 
 * @param {...array} points 座標の配列
 */
function polygon(type, ...points) {

    // 全ての点をスケーリングする
    const scaledPoints = points.map(e => scaling(...e));

    // 描画を始める
    ctx.beginPath();
    ctx.moveTo(...scaledPoints[scaledPoints.length - 1]); // 最後の点から始めることでループを簡単にする
    for (const p of scaledPoints) {
        p && ctx.lineTo(...p);
    }

    // `fill`または`stroke`で描画する
    ctx[type]();
}

/**
 * 合法手を取得し、legalMove変数を更新する
 */
function getLegalMove() {
    // 合法手配列を空にする
    legalMove = [];
    for (let i = 0; i < size ** 3; i++) {
        // 置いたらひっくり返せる駒が少なくとも1つあり、かつそこがまだ置かれていない(0)であるならば合法手とみなす
        if (getReversibleCells(iTp(i)).length && !board[i]) {
            legalMove.push(iTp(i));
        }
    }
    return legalMove.length;
}

/**
 * 入力キーに応じて角度/ゲーム状態を変化させる
 */
function inputKeyProcess() {
    if (inputKeys[32]) gameParam.angle = structuredClone(defaultParam.angle); // 角度リセット
    if (inputKeys[65] || inputKeys[37]) gameParam.angle.theta += .1; // 左回転
    if (inputKeys[87] || inputKeys[38]) gameParam.angle.phi -= .1; // 上回転
    if (inputKeys[68] || inputKeys[39]) gameParam.angle.theta -= .1; // 右回転
    if (inputKeys[83] || inputKeys[40]) gameParam.angle.phi += .1; // 下回転
    if (inputKeys[82]) { init(); return; }; // リセット
}

/**
 * 盤面や各変数の初期化
 */
function init() {

    // 盤面を空にする
    board = [];

    // 中央のセルを取得
    const centerCell = size / 2;

    // 盤面を初期状態(中央に白と黒が交互に並んでいる状態)にする
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {

                // x,y,zのどれかが中央または中央-1であるかを判定(白と黒が交互に並ぶのは中央とその隣であるため)
                const isCenter = [x, y, z].every(e => e == centerCell || e == centerCell - 1);

                // x,y,zの中に中央の座標が奇数個あれば黒(1)、偶数なら白(-1)、その他は何もない(0)
                board[pTi([x, y, z])] = isCenter ? [x, y, z].filter(e => e == centerCell).length % 2 == 1 ? 1 : -1 : 0;
            }
        }
    }

    // 配列の初期化
    selectedCell = [];
    determinedCell = [];

    // フラグの初期化
    isResultView = false;

    // 合法手を取得
    getLegalMove();
}

/**
 * キャンバスをリサイズし、キャンバス依存の変数を更新する
 */
function resizeCanvas() {

    // 正方形にする
    canvasSize = Math.min(innerWidth, innerHeight);
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // キャンバスに伴い位置を変える
    ctx.translate(canvasSize / 2, canvasSize / 2);
    offset.x = (window.innerWidth - canvas.width) / 2; // 左上のx座標
    offset.y = (window.innerHeight - canvas.height) / 2; // 左上のy座標

    // 操作キー説明の位置を更新
    description.style.top = `${offset.y}px`;
    description.style.left = `${offset.x}px`;
}

/**
 * 置くことのできるセルからランダムに選んで置く
 */
const random = () => updateBoard(legalMove[Math.random() * legalMove.length | 0]);

/**
 * 少なくとも１つは一致する配列があるか調べる
 * @return 条件のboolean
 */
const isSomeMatchArray = (element, arr) => arr.some(e => e.join() == element.join());

// イベントリスナー

// ポインターが移動したらマウス位置変数も合わせる
document.addEventListener(`pointermove`, e => {
    mouse.x = e.clientX - canvasSize / 2 - offset.x;
    mouse.y = e.clientY - canvasSize / 2 - offset.y
});

// ポインターが押下されたらクリックしていることにする
document.addEventListener(`pointerdown`, () => {
    isClicked = true;
});

// ポインターが上がったらクリックしていないことにし、かつ長押し判定も消す
document.addEventListener(`pointerup`, () => {
    isClicked = false;
    isPressed = false;
});

// 押下されているキーはtrue、離されたキーはfalseにする
document.onkeydown = (e) => inputKeys[e.keyCode] = true;
document.onkeyup = (e) => inputKeys[e.keyCode] = false;

onresize = resizeCanvas;

// 初期化する
resizeCanvas();
init();
gameLoop();

setInterval(() => {
    fps = frame;
    frame = 0;
}, 1000);
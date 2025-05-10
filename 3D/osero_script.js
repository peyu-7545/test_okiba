// osero_script.js

// DOM要素の取得
const canvas = document.querySelector(`canvas`);
const description = document.getElementById(`description`);

// レンダリングコンテキストの取得
const ctx = canvas.getContext(`2d`);

// ゲームの基本パラメーター
const size = 4; // 盤面の一辺のセル数

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
const cellColor = `#ccc2`; // 合法手セルの色
const playerColor = { "1": `#000000cc`, "-1": `#ffffffcc` }; // プレイヤーの色
let canvasSize; // キャンバスのw/h

// 操作フラグ
const inputKeys = []; // 入力キーを格納する配列
const mouse = new Object; // マウス位置
let isPressed = false; // 長押しフラグ
let isClicked = false; // クリックフラグ

// ゲームの状態のフラグ
let isGameEnd = false; // ゲーム終了フラグ
let isResultView = false; // リザルトビューフラグ
let continuousPath = false;; // 連続パスフラグ

// 描画フラグ
let isOutBorderDraw = false; // 外枠を描画するか
let isHintMode = true; // 合法手を描画するか

// デバッグ用
let frame = 0;
let fps;

// 自動対戦
let isAutoBattle = false;

// vsCOM
let isVsCom = false;

// ゲームループ
function gameLoop() {
    if (isAutoBattle && !isGameEnd) random();
    update();
    draw();
    requestAnimationFrame(gameLoop);
    frame++;
}

// 描画する
function draw() {

    // 背景で塗りつぶす
    ctx.fillStyle = `green`;
    ctx.fillRect(-canvasSize / 2, -canvasSize / 2, canvasSize, canvasSize);

    // 設定次第で外枠描画
    if (isOutBorderDraw) cube([center, center, center], `lightgray`, size);

    if (isResultView) {
        drawSphere();
        return;
    }

    // 各セルについて描画
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {

                // セルのプロパティ
                const cellPropertys = {};

                // 優先したい色は先に描く(最初のマッチでループがbreakするため)

                // 決定(ホバー&&選択)
                cellPropertys.isDeterMine = {
                    condition: isSomeMatchArray([x, y, z], determinedCell),
                    color: `yellow`,
                }

                // ホバー
                cellPropertys.isHover = {
                    condition: isSomeMatchArray([x, y, z], hoveredCell) && !determinedCell.length,
                    color: `red`,
                }

                // ひっくり返されるセル
                cellPropertys.isReversible = {
                    condition: determinedCell.length == 1 && isSomeMatchArray([x, y, z], getReversibleCells(...determinedCell)),
                    color: `purple`,
                }

                // 選択
                cellPropertys.isSelect = {
                    condition: isSomeMatchArray([x, y, z], selectedCell),
                    color: `blue`,
                };

                // ヒント(合法手表示)
                cellPropertys.isHint = {
                    condition: isSomeMatchArray([x, y, z], legalMove) && !cellPropertys.isHover.condition && isHintMode,
                    color: cellColor,
                }

                // 最初にマッチした色を描画
                for (property of Object.values(cellPropertys)) {
                    if (property.condition) {
                        cube([x, y, z], property.color);
                        break;
                    }
                }
            }
        }
    }

    drawSphere();
}

function drawSphere() {
    board.map((e, i) => ({ e, i })).filter(p => p.e).sort((a, b) => getDistance(iTp(b.i)) - getDistance(iTp(a.i))).forEach(({ e, i }) => sphere(iTp(i), playerColor[e]));
}

// アップデート
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

// ゲーム終了時
function end() {
    const winner = getStronger(); // どちらが多いか調べる
    const massage = winner == 0 ? `引き分け！` : `${winner == 1 ? `黒` : `白`}の勝利！`;
    if (isAutoBattle) {
        console.log(massage);
        init();
    } else {
        alert(massage);
        setTimeout(() => {
            if (confirm(`再プレイしますか？`)) {
                init();
            } else {
                alert(`再プレイしたい場合はRキーを押してください`);
                isResultView = true;
            }
        }, 50);
    }
}

// 入力キーの処理
function inputKeyProcess() {
    if (inputKeys[" "]) gameParam.angle = structuredClone(defaultParam.angle); // 角度リセット
    if (inputKeys.a || inputKeys.ArrowLeft) gameParam.angle.theta += .1; // 左回転
    if (inputKeys.w || inputKeys.ArrowUp) gameParam.angle.phi -= .1; // 上回転
    if (inputKeys.d || inputKeys.ArrowRight) gameParam.angle.theta -= .1; // 右回転
    if (inputKeys.s || inputKeys.ArrowDown) gameParam.angle.phi += .1; // 下回転
    if (inputKeys.r) init(); // リセット
}

// 初期化
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

    // ターンの初期化
    gameParam.turn = +defaultParam.turn;

    // 配列の初期化
    selectedCell = [];
    determinedCell = [];

    // フラグの初期化
    isResultView = false;

    // 合法手を取得
    getLegalMove();
}

// キャンバスのりサイズと変数の更新
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

// ランダムに置く
const random = () => updateBoard(legalMove[Math.random() * legalMove.length | 0]);

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
document.onkeydown = (e) => inputKeys[e.key] = true;
document.onkeyup = (e) => inputKeys[e.key] = false;

// リサイズ
onresize = resizeCanvas;

// 初期化する
resizeCanvas();
init();
updateFps();
gameLoop();
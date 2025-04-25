const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let moveCooltime = 0; canMove = false; // 移動系
let cursor = [3, 3], pointerPosition, isPointerDown = false; // 操作系
let cs, padding, cellSize; // 描画系
let selectStart = false; // その他
let board; // 盤面

// セルの色:[赤,白,黄色,紫,緑,水色,黒,ピンク]
const colors = ["#ee8d95", "#fbfbfb", "#efeb77", "#e1c7de", "#b2d8aa", "#a1d9ee", "#4d3d45", "#f7c5de"];

/* 
    keyCode一覧 = {
        左:37,
        上:38,
        右:39,
        下:40,
        Shift:16,
        スペース:32,
        P:80
    }
*/
const Keys = [37, 38, 39, 40, 16, 32, 80];
const isKey = new Array(Keys.length); // 入力キーを格納する配列


// 読み込み完了時
document.addEventListener("DOMContentLoaded", () => {

    window.addEventListener("resize", resizeCanvas); // リサイズに応じてキャンバスをリサイズする

    document.addEventListener("keydown", e => { // 入力キーを保存する
        const temp = Keys.indexOf(e.keyCode);
        if (temp >= 0) isKey[temp] = true;
    });

    document.addEventListener("keyup", e => { // 入力キーを破棄する
        const temp = Keys.indexOf(e.keyCode);
        if (temp >= 0) isKey[temp] = false;
    });

    canvas.addEventListener("pointerdown", e => { // ポインター押下
        isPointerDown = true;
        pointerPosition = [e.clientX, e.clientY].map(e => ~~((e - padding) / cellSize));
    });

    canvas.addEventListener("pointermove", e => { // ポインター移動
        if (isPointerDown) {
            const currentPosition = [e.clientX, e.clientY].map(e => ~~((e - padding) / cellSize));
            if ((pointerPosition[0] !== currentPosition[0]) || (pointerPosition[1] !== currentPosition[1])) {
                swapTest(...pointerPosition, ...currentPosition);
                pointerPosition = currentPosition;
                isPointerDown = false;
            }
        }
    });

    canvas.addEventListener("pointerup", () => {
        isPointerDown = false;
    });
    // 読み込み完了時に呼び出す関数
    resizeCanvas();
    initBoard();
    gameloop();
});

// ゲームループ関数
function gameloop() {
    update();
    draw();
    requestAnimationFrame(gameloop);
}

function update() {
    // 選択カーソルの移動
    if (!moveCooltime) {
        // 左右(上下)片方だけが押されているならばその方向に動く(端にいるときは外に向かって動けない)
        const dx = (isKey[0] ^ isKey[2]) && (isKey[0] ? -(cursor[0] > 0) : cursor[0] < 7);
        const dy = (isKey[1] ^ isKey[3]) && (isKey[1] ? -(cursor[1] > 0) : cursor[1] < 7)
        cursor[0] += dx;
        cursor[1] += dy;
        // 入れ替え判定
        if (selectStart && (dx || dy)) {
            swapTest(...selectStart, ...cursor);
            selectStart = undefined;
        }

        moveCooltime = 8;
    } else {
        if (isKey.slice(0, 4).every(e => !e)) {
            moveCooltime = 0;
        }
        moveCooltime > 0 && moveCooltime--;
    }

    if (pointerPosition) {
        cursor = pointerPosition;
    }

    if (isKey[5] && !selectStart) {
        selectStart = [...cursor];
    }
}


// 描画関数
function draw() {
    ctx.clearRect(0, 0, cs, cs);
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            ctx.fillStyle = colors[board[y][x]];
            ctx.fillRect(padding + x * cellSize, padding + y * cellSize, cellSize, cellSize);
        }
    }
    ctx.strokeRect(...cursor.map(e => e * cellSize + padding), cellSize, cellSize);
}

// キャンバスリサイズ関数
function resizeCanvas() {
    // 大きさや太さがキャンバス依存のものの更新
    cs = Math.min(window.innerWidth, window.innerHeight);
    canvas.width = cs;
    canvas.height = cs;
    padding = cs * 0.05;
    cellSize = (cs - (2 * padding)) / 8;
    ctx.lineWidth = cs * 0.01;
}

function swapTest() {
    swap(...arguments);
    if (!matchFind().length) {
        swap(...arguments); // 二度swapするともとに戻る
    }
    match3(); // マッチ3関数を呼び出す
};

// 盤面をすべて調べ、マッチ3で消えるセルを列挙する
function matchFind() {
    // 盤面を保存する２次元配列
    const matched = Array.from({ length: 8 }, () => Array(8).fill(false));
    // 横方向マッチを調べる
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8 - 2; x++) {
            const current = board[y][x];
            // 色が3連続する判定
            if (current === board[y][x + 1] && current === board[y][x + 2]) {
                matched[y][x] = matched[y][x + 1] = matched[y][x + 2] = true;
                let i = x + 3;
                // 4連続以上
                while (i < 8 && board[y][i] === current) {
                    matched[y][i] = true;
                    i++;
                }
            }
        }
    }
    // 縦方向も同様に
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8 - 2; y++) {
            const current = board[y][x];
            if (current === board[y + 1][x] && current === board[y + 2][x]) {
                matched[y][x] = matched[y + 1][x] = matched[y + 2][x] = true;
                let i = y + 3;
                while (i < 8 && board[i][x] === current) {
                    matched[i][x] = true;
                    i++;
                }
            }
        }
    }
    // trueつまりマッチしているセルのみを選択する
    const result = [];
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (matched[y][x]) result.push([x, y]);
        }
    }
    return result;
}

// 入れ替え
function swap(x1, y1, x2, y2) {
    const temp = board[y1][x1]; // 一時変数
    board[y1][x1] = board[y2][x2];
    board[y2][x2] = temp;
}

// 全てのパターンを試す脳筋戦法
function checkTumi() {
    // 可能な入れ替えを全通り試す
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            if (x < 7) {
                swap(x, y, x + 1, y);
                if (matchFind().length) {
                    swap(x, y, x + 1, y);
                    return false;
                }
                swap(x, y, x + 1, y);
            }
            if (y < 7) {
                swap(x, y, x, y + 1);
                if (matchFind().length) {
                    swap(x, y, x, y + 1);
                    return false;
                }
                swap(x, y, x, y + 1);
            }
        }
    }
    return true;
}

// 盤面の初期化
function initBoard() {
    board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            fillRandom(x, y);
        }
    }
}

// 乱数を生成する(ただし、自動的に揃わないようにする)
function fillRandom(x, y) {
    do { // ビット演算子を使用すると自動的に切り捨てられる+not演算子二個で元に戻す
        board[y][x] = ~~(Math.random() * colors.length);
    } while (isPartOfMatch(x, y));
}

// x,yの位置にセルを追加した際、自動的にマッチするか判定する
function isPartOfMatch(x, y) {
    const current = board[y][x];
    if (x >= 2 && board[y][x - 1] === current && board[y][x - 2] === current) return true; // 左に2つある場合
    if (y >= 2 && board[y - 1][x] === current && board[y - 2][x] === current) return true; // 上に2つある場合
    if (x >= 1 && x < 7 && board[y][x - 1] === current && board[y][x + 1] === current) return true; // 左、右に1つある場合
    if (y >= 1 && y < 7 && board[y - 1][x] === current && board[y + 1][x] === current) return true; // 上、下に1つある場合
}

// マッチ3を消し、新たな盤面を生成する
function match3() {
    let rensa = 0;
    while (matchFind().length) {
        const m = matchFind().join("_");
        const t = (x, y) => m.includes(`${x},${y}`);
        const result = Array.from({ length: 8 }, () => Array(8).fill(undefined));
        for (let x = 0; x < 8; x++) {
            let i = 0;
            for (let y = 7; y >= 0; y--) {
                if (!t(x, y)) {
                    result[7 - i][x] = board[y][x];
                    i++;
                }
            }
        }
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                if (result[y][x] !== undefined) {
                    board[y][x] = result[y][x];
                }
            }
        }
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                if (result[y][x] === undefined) {
                    fillRandom(x, y);
                }
            }
        }
        rensa++;
    }
    if (checkTumi()) {
        // 詰み時の処理
        initBoard(); // 打つ手がなくなった場合、盤面を初期化(再生成)
    }
    return rensa++;
}
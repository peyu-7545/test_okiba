// util.js

// 3D->2Dスケーリング
function scaling(position) {
    const [sx, sy, sz] = scaling3D(position);

    // 奥行きで割って2Dにし、補正係数で掛ける
    return [sx / sz * canvasSize * scalingFactor, -sy / sz * canvasSize * scalingFactor];
}

// 3Dアフィン変換
function scaling3D([x, y, z]) {

    // 原点に移す
    sx = x - rotateCenter.x;
    sz = z - rotateCenter.z;

    // y軸中心回転移動
    [x, z] = [
        sx * Math.cos(gameParam.angle.theta) + sz * Math.sin(gameParam.angle.theta) + rotateCenter.x,
        sz * Math.cos(gameParam.angle.theta) - sx * Math.sin(gameParam.angle.theta) + rotateCenter.z,
    ];

    // 原点に移す
    sy = y - rotateCenter.y;
    sz = z - rotateCenter.z;

    // x軸中心回転移動
    [y, z] = [
        sy * Math.cos(gameParam.angle.phi) + sz * Math.sin(gameParam.angle.phi) + rotateCenter.y,
        sz * Math.cos(gameParam.angle.phi) - sy * Math.sin(gameParam.angle.phi) + rotateCenter.z,
    ]

    // カメラを原点にするため平行移動
    x -= cameraPosition.x;
    y -= cameraPosition.y;
    z -= cameraPosition.z;

    return [x, y, z];
}

// マウス座標が多角形の内側かを調べる(ホバー判定)
function isPointinPolygon(polygon) {

    inSide = false;

    // 点から右に半直線を伸ばしていったときに、幾つ交点があるかで内外判定
    polygon.forEach((e, i) => {

        [xi, yi] = polygon[i];
        [xj, yj] = polygon[(i + 1) % polygon.length];

        if ((yi > mouse.y) == (mouse.y > yj) && (((xj - xi) * (mouse.y - yi) / (yj - yi + 1e-10) + xi)) > mouse.x) {
            // 交点にぶつかるたびに内外を反転させる
            inSide = !inSide;
        }
    });

    return inSide;
}

// パス判定
function checkPath() {

    // 合法手があるか判定
    if (getLegalMove()) {
        // あるならパスではないので終了
        continuousPath = false;
    } else {
        // 二人ともパスか判定する
        if (continuousPath) {
            // ゲームエンド
            return true;
        } else {
            // 相手もパスか判定
            gameParam.turn = reverseTurn(gameParam.turn);
            continuousPath++;
            return checkPath();
        }
    }
}

// クリック処理
function clickAction() {
    if (determinedCell.length == 1 && !isPressed) {

        // 決定セルが一つに決まり、かつ長押しされていないとき

        // 盤面を更新する
        updateBoard(determinedCell[0]);

    } else if (determinedCell.length == 0) {

        // 決定セルがないとき
        // ホバーされているセルを選択セルにする
        selectedCell = [...hoveredCell];
    }
}

// ホバーされていて、かつ選択されているセルを決定セルにする
function getDeterminedCell() {

    determinedCell = [];

    // 文字列化して共通セルを見つける
    const stringifiedHoveredCell = hoveredCell.map(e => e.join());

    for (const cell of selectedCell) {
        if (stringifiedHoveredCell.includes(cell.join())) {
            determinedCell.push(cell);
        }
    }
}

// ホバーされているセルを見つける
function checkHover() {

    hoveredCell = [];

    for (let i = 0; i < size ** 3; i++) {
        const position = iTp(i);
        const isHover = getCubeSides(position).some(e => isPointinPolygon(e.map(p => scaling(p))));
        if (isHover && !board[i] && isSomeMatchArray(position, legalMove)) {
            hoveredCell.push(position);
        }
    }
}

// 置いたら取れるセルを取得する
function getReversibleCells([x, y, z]) {

    const result = [];

    // -1~1のループ
    for (let dx = -1; dx < 2; dx++) {
        for (let dy = -1; dy < 2; dy++) {
            for (let dz = -1; dz < 2; dz++) {

                // 自分自身(全て0)はひっくり返さないのでスキップ
                if (!dx && !dy && !dz) continue;

                // 候補を一時保存する
                const reversibleCandidate = [];

                // 判定するセル
                [nx, ny, nz] = [x, y, z];

                while (true) {

                    // それぞれの方向に動かす
                    nx += dx, ny += dy, nz += dz;

                    // 範囲外ならループ終了
                    if (nx < 0 || size <= nx || ny < 0 || size <= ny || nz < 0 || size <= nz) break;

                    // 現在のセルを取得する
                    const bCell = board[pTi([nx, ny, nz])];

                    if (bCell == gameParam.turn) {

                        // 自分のセルならこれまでの候補を挟めるので候補を確定する
                        result.push(...reversibleCandidate);
                        break;

                    } else if (reverseTurn(bCell) == gameParam.turn) {

                        // 相手のセルならひっくり返す候補に追加する
                        reversibleCandidate.push([nx, ny, nz]);

                    } else {

                        // 0(どちらでもない)ならひっくり返せないので終了
                        break;
                    }
                }
            }
        }
    }

    return result;
}

// 合法手を取得する
function getLegalMove() {

    legalMove = [];

    for (let i = 0; i < size ** 3; i++) {

        // ひっくり返せるセルが0ではなく、かつまだ置かれていない(0)なら追加
        getReversibleCells(iTp(i)).length && !board[i] && legalMove.push(iTp(i));
    }
    return legalMove.length;
}

// 盤面を更新
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
    gameParam.turn = reverseTurn(gameParam.turn);

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

// 座標からインデックス
const pTi = ([x, y, z]) => x + y * size + z * size * size;

// インデックスから座標
const iTp = i => [i % size, (i / size | 0) % size, (i / size / size | 0) % size];

// ターンを反転した結果を返す
const reverseTurn = turn => -turn;

// 数が多い方を返す
const getStronger = _ => Math.sign(board.reduce((a, b) => a + b, 0));

// 座標が配列に入っているかを調べる
const isSomeMatchArray = (position, arr) => arr.some(e => e.join() == position.join());

// カメラとの距離を求める
const getDistance = position => scaling3D(position).reduce((a, b) => a + b * b, 0);

// 立方体の全ての面を取得(当たり判定用)
const getCubeSides = ([x, y, z]) => [
    [[x - .5, y - .5, z - .5], [x + .5, y - .5, z - .5], [x + .5, y - .5, z + .5], [x - .5, y - .5, z + .5]],
    [[x - .5, y + .5, z - .5], [x + .5, y + .5, z - .5], [x + .5, y + .5, z + .5], [x - .5, y + .5, z + .5]],
    [[x - .5, y - .5, z - .5], [x - .5, y - .5, z + .5], [x - .5, y + .5, z + .5], [x - .5, y + .5, z - .5]],
    [[x + .5, y - .5, z - .5], [x + .5, y - .5, z + .5], [x + .5, y + .5, z + .5], [x + .5, y + .5, z - .5]],
    [[x - .5, y - .5, z - .5], [x + .5, y - .5, z - .5], [x + .5, y + .5, z - .5], [x - .5, y + .5, z - .5]],
    [[x - .5, y - .5, z + .5], [x + .5, y - .5, z + .5], [x + .5, y + .5, z + .5], [x - .5, y + .5, z + .5]],
];

// 毎秒fpsを更新する
const updateFps = _ => setInterval(_ => { fps = frame, frame = 0 }, 1000);
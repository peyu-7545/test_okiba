// 各要素を取得
const textarea = document.getElementById("textarea");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// グローバル変数
let canvasSize;

//パラメータ
const iteration = 5; // 変換ルールの適用回数
const graphsize = 10; // 描画するグラフの最大x,y
const lineLength = 0.04; // 一度の命令で引く線の長さ
const angle = Math.PI / 3; // 一度の命令で曲がる角度
let currentPoint = [0, 0]; // 現在の座標
let currentAngle = 0; // 現在の向いている方向
let keep; // 命令[で保存するための変数

// このツールで利用可能なLsystemの命令
const Lsystem = ["Axiom:", "->", ";", "F", "+", "-", "[", "]"];

// リサイズ・ロード時の処理(キャンバスの初期化)
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvasSize = rect.width;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
}

function resetCanvas() {
    currentPoint = [0, 0];
    currentAngle = 0;
    keep = { point: undefined, angle: undefined };
    ctx.clearRect(0, 0, canvasSize, canvasSize);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

// テキストエリア(Lsystemの命令欄)への入力内容の処理
textarea.addEventListener("keyup", (event) => {
    const instructions = event.target.value;
    let isAxiom = undefined;
    let isrule = true;
    let rule = [];
    let tmp = [];
    let axiom = [];
    // Lsystemの文字列の処理(axiom:,->,;)
    for (let element of find(instructions)) {
        if (isAxiom !== false) {
            if (element === "Axiom:") {
                isAxiom = true; continue;
            };
            if (element === ";" && isAxiom) isAxiom = false;
            if (isAxiom) axiom.push(element);
        } else {
            if (element === "->" || ";" === element) {
                if (element === (isrule ? "->" : ";")) {
                    isrule = !isrule;
                    rule.push(tmp);
                };
                tmp = [];
            } else {
                tmp.push(element);
            }
        }
    };
    for (let i = 0; i < iteration; i++) {
        for (let j = 0; j < (rule.length - rule.length % 2) / 2; j++) {
            axiom = replace(axiom, rule[2 * j], rule[2 * j + 1]);
        }
    }
    const drawrule = axiom;
    resetCanvas();
    drawrule.forEach(rule => {
        switch (rule) {
            case "F": L.F(); break;
            case "+": L.plus(); break;
            case "-": L.minus(); break;
            case "[": L.sbS(); break;
            case "]": L.sbF(); break;
        }
    })
});

const resizebar = document.getElementById("resizebar");
let isDragg = false;
resizebar.addEventListener("mousedown", (event) => {
    isDragg = true;
    document.body.style.cursor = "col-resize";
});
document.addEventListener("mouseup", () => {
    isDragg = false;
    document.body.style.cursor = "default";
});
document.addEventListener("mousemove", (event) => {
    if (!isDragg) return;
    const left = event.clientX;
    const right = window.innerWidth - left - 7;
    document.getElementById("UIdiv").style.gridTemplateColumns = `${left}px 7px ${right}px`;
});

// 配列の一部分を全て置き換える関数
function replace(arr, target, replacement) {
    const targetLength = target.length;
    let i = 0;
    while (i <= arr.length - targetLength) {
        const slice = arr.slice(i, i + targetLength);
        if (slice.length === target.length && slice.every((val, i) => val === target[i])) {
            arr.splice(i, targetLength, ...replacement);
            i += replacement.length;
        } else {
            i++;
        }
    }
    return arr;
}

// 引数checkwordをLsystemの命令で分解する
function find(checkword) {
    const result = [];
    let i = 0;
    while (i < checkword.length) {
        const matches = Lsystem.filter(key => checkword.slice(i).startsWith(key)); // 文字が一致するものを絞り込
        if (matches.length > 0) {
            const bestMatch = matches.reduce((a, b) => a.length >= b.length ? a : b); // keyの文字数が最も長いものを選ぶ
            result.push(bestMatch); // 返り値に追加
            i += bestMatch.length; // マッチした文字数分だけ進む
        } else {
            i++; // マッチしなければ次の文字へ
        }
    }
    return result;
}

class drawcanvas {
    // 直交座標→canvas用座標へのスケーリング
    scaling(point) {
        return [
            point[0] / graphsize * canvasSize,
            (1 - point[1] / graphsize) * canvasSize
        ];
    }
    // 現在の位置から線を引く
    line(point) {
        const scaled = this.scaling(point);
        const scaledcurrent = this.scaling(currentPoint);
        ctx.beginPath();
        ctx.moveTo(scaledcurrent[0], scaledcurrent[1]);
        ctx.lineTo(scaled[0], scaled[1]);
        ctx.stroke();
        currentPoint = point;
    }
    // 任意の場所に点を打つ
    dot(point) {
        const scaled = this.scaling(point);
        ctx.beginPath();
        ctx.arc(scaled[0], scaled[1], 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Lsystemfunction {
    // 命令Fの処理
    F() {
        D.line([
            currentPoint[0] + lineLength * Math.cos(currentAngle),
            currentPoint[1] + lineLength * Math.sin(currentAngle)
        ]);
    }
    // 命令+の処理
    plus() {
        currentAngle -= angle;
    }
    // 命令-の処理
    minus() {
        currentAngle += angle;
    }
    // 命令[の処理
    sbS() {
        keep = { point: currentPoint, angle: currentAngle };
    }
    // 命令]の処理
    sbF() {
        currentPoint = keep.point;
        currentAngle = keep.angle;
    }
}

const L = new Lsystemfunction;
const D = new drawcanvas;
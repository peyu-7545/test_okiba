const teb_ctrl = Array.from(document.getElementsByClassName(`tabctrl`));
const tab_arr = Array.from(document.getElementsByClassName(`tabs`));
const input_num_arr = Array.from(document.getElementsByClassName(`inputnum`));
const textarea = document.getElementById(`textarea`);
const canvas = document.getElementById(`canvas`);
const log_area = document.getElementById(`log_area`);
const resize_bar = document.getElementById(`resizebar`);
const ui_div = document.getElementById(`UIdiv`);
const ctx = canvas.getContext(`2d`);
const w_w = window.innerWidth;
const w_h = window.innerHeight;
const min_lwidth = 100;
const min_rwidth = w_w - (w_h - 50) - 7;
const lsystem = [`Axiom:`, `->`, `;`, `F`, `+`, `-`, `[`, `]`];
const init_prm = [0, 0, 0, 60, 0.04, 10, 5];
let is_dragg = false;
let keep_list, canvas_size;
textarea.addEventListener(`keyup`, main);

resizebar.addEventListener(`mousedown`, (ev) => {
    is_dragg = true;
    document.body.style.cursor = `col-resize`;
});
document.addEventListener(`mouseup`, () => {
    is_dragg = false;
    document.body.style.cursor = `default`;
});
document.addEventListener(`mousemove`, (ev) => {
    if (!is_dragg) return;
    const l = ev.clientX;
    const r = w_w - l - 7;
    if (min_lwidth < l && min_rwidth < r) {
        ui_div.style.gridTemplateColumns = `${l}px 7px ${r}px`;
    };
});

function var_init() {
    input_num_arr.forEach((el, i) => el.value = init_prm[i])
}

function replace(arr, target, replace) {
    const trg_l = target.length;
    let i = 0;
    while (i <= arr.length - trg_l) {
        const slice = arr.slice(i, i + trg_l);
        if (slice.length === trg_l && slice.every((val, i) => val === target[i])) {
            arr.splice(i, trg_l, ...replace);
            i += replace.length;
        } else {
            i++;
        }
    }
    return arr;
}

function find(word) {
    const result = [];
    let i = 0;
    while (i < word.length) {
        const match = lsystem.filter(key => word.slice(i).startsWith(key));
        if (match.length > 0) {
            const best_match = match.reduce((a, b) => a.length >= b.length ? a : b);
            result.push(best_match);
            i += best_match.length;
        } else {
            if (!/\s/.test(word[i])) result.push(word[i]);
            i++;
        }
    }
    return result;
}

class drawcanvas {
    scl(point) {
        return [
            point[0] / init_prm[5] * canvas_size,
            (1 - point[1] / init_prm[5]) * canvas_size
        ];
    }
    line(point) {
        const scaled_point = this.scl(point);
        const scaled_current_point = this.scl(current_point);
        ctx.beginPath();
        ctx.moveTo(scaled_current_point[0], scaled_current_point[1]);
        ctx.lineTo(scaled_point[0], scaled_point[1]);
        ctx.stroke();
        current_point = point;
    }
    dot(point) {
        const scaled_point = this.scl(point);
        ctx.beginPath();
        ctx.arc(scaled_point[0], scaled_point[1], 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Lsystemfunction {
    F() {
        D.line([
            current_point[0] + init_prm[4] * Math.cos(current_angle),
            current_point[1] + init_prm[4] * Math.sin(current_angle)
        ]);
    }
    plus() { current_angle -= init_prm[3] / 180 * Math.PI; }
    minus() { current_angle += init_prm[3] / 180 * Math.PI; }
    sbS() { keep_list = { point: current_point, angle: current_angle }; }
    sbF() {
        current_point = keep_list.point; current_angle = keep_list.angle;
    }
}

function resize_canvas() {
    canvas_size = canvas.getBoundingClientRect().width;
    canvas.width = canvas_size;
    canvas.height = canvas_size;
}

function reset_canvas() {
    current_point = init_prm.slice(0, 2);
    current_angle = init_prm[2] / 180 * Math.PI;
    keep_list = { point: undefined, angle: undefined };
    ctx.clearRect(0, 0, canvas_size, canvas_size);
}

teb_ctrl.forEach((ctrl, target) => ctrl.addEventListener(`click`, () => change_tab(target)));

function change_tab(target) {
    for (let i = 0; i < tab_arr.length; i++) {
        tab_arr[i].style.display = i == target ? `block` : `none`;
        teb_ctrl[i].style.zIndex = i == target ? `10` : `0`;
    }
}


function log_update(tx) {
    log_area.textContent += `${tx}\n`;
}

function log_reset() {
    log_area.textContent = ``;
    log_area.style.height = `auto`;
}

function main() {
    let is_axiom;
    let is_rule = true;
    let rule = [];
    let tmp = [];
    let axiom = [];
    for (let el of find(textarea.value)) {
        if (is_axiom !== false) {
            if (el === `Axiom:`) {
                is_axiom = true; continue;
            };
            if (el === `;` && is_axiom) is_axiom = false;
            if (is_axiom) (el === `->` || el === `;`) ? log_update(`不正な形式です|at`) : axiom.push(el);
        } else {
            if (el === `->` || el === `;`) {
                if (el === (is_rule ? `->` : `;`)) {
                    is_rule = !is_rule;
                    rule.push(tmp);
                } else {
                    log_update(`不正な形式です`);
                    return;
                };
                tmp = [];
            } else {
                tmp.push(el);
            }
        }
    };
    for (let i = 0; i < init_prm[6]; i++) {
        for (let j = 0; j < (rule.length - rule.length % 2) / 2; j++) {
            const l_side = rule[2 * j];
            const r_side = rule[2 * j + 1];
            if (!l_side.length || !r_side.length) {
                log_update(`空の変換規則を作ることはできません`);
                return;
            };
            axiom = replace(axiom, l_side, r_side);
        }
    }
    reset_canvas();
    for (let rule of axiom) {
        switch (rule) {
            case `F`: L.F(); break;
            case `+`: L.plus(); break;
            case `-`: L.minus(); break;
            case `[`: L.sbS(); break;
            case `]`: {
                if (keep_list.angle === undefined) {
                    log_update(`エラーメッセージ:\n命令"]"によるデータ復元を実行できません\n先に命令"["でデータを保存する必要があります`);
                    return;
                } else {
                    L.sbF();
                }
            }; break;
        }
    };
}


// 数値入力欄に入力を検知したら更新する
input_num_arr.forEach((el, i) => {
    el.oninput = () => {
        init_prm[i] = Number(el.value);
        reset_canvas();
        main();
    };
});

const L = new Lsystemfunction;
const D = new drawcanvas;
window.onresize = resize_canvas();
window.onload = resize_canvas(), change_tab(0), var_init(), reset_canvas();

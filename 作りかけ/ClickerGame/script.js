let Count= 0;
let SpaceKeyPressed = false;


// レベルアップに必要なMe=解放に必要なMe*必要Meの倍率^レベル
// [タイトル、説明、解放に必要なMe、レベル、レベルアップに必要なMe、必要Meの倍率、MPS、MPC]
const tilesData = [
  ["自己紹介", `メンバーの大半が最初に発現するであろう`, 0 , 1 , ],
  ["総合雑談1", `第一の雑談。日々話題が尽きず、議論が交わされる重要なチャンネル。`, 50],
  ["総合雑談2", `総合雑談1が密のときに使われる。最近は若干過疎り気味。`, 100],
  ["つぶやき部屋", `別名「総合雑談3」。メンバーが日常的に呟く。`, 200]
];

const container = document.getElementById("tileContainer");
        let tiles = [];
        
        tilesData.forEach((data, index) => {
            const tile = document.createElement("div");
            tile.className = "tile";
            if (index === 0) {
                tile.classList.add("unlocked", "visible"); // 最初のタイルは初期状態で解放
              } else{
                tile.classList.add("locked");
            }
;

            tile.innerHTML = `
                <h2 class="title">${index === 0 ? data[0] : "???"}</h2>
                <p class="description">${index === 0 ? data[1] : `解放に必要なメッセージ数: ${data[2]}`}</p>
            `;

            tile.addEventListener("click", () => {
              if (tile.classList.contains("unlocked")) {
                  console.log(`タイル ${index + 1} がクリックされました`);
              }
          });
            
            container.prepend(tile);
            tiles.push({ element: tile, data });
        });

// Countを更新して表示
function incrementCount() {
    Count++;
    document.getElementById("Count").textContent = Count + "Me";

    tiles.forEach((tile, index) => {
      if (Count >= tile.data[2]) {
          tile.element.classList.add("unlocked");
          tile.element.classList.remove("locked");
          tile.element.querySelector(".title").textContent = tile.data[0];
          tile.element.querySelector(".description").textContent = tile.data[1];
        } else {
          tile.element.querySelector(".description").textContent = `解放に必要なメッセージ数: ${tile.data[2]}`;
        }
      if (index > 0 && Count >= tiles[index - 1].data[2]) {
          tile.element.classList.add("visible");
      }
  });
}





// クリックされたら関数を呼び出す
document.getElementById("box-element").addEventListener('click', incrementCount);

// Spaceキーが押されたら関数を呼び出す
document.addEventListener('keydown', function(event) {
    if (event.code === "Space" && !SpaceKeyPressed) {
      SpaceKeyPressed = true;
      event.preventDefault();
      incrementCount();
    }
});
document.addEventListener('keyup', function(event) {
    if (event.code === "Space") {
      SpaceKeyPressed = false;
    }
});

// MPS...Message Per Second
// MPC...Message Per Click
// unlocked...未解放
// locked...解放/状態1
// visible...解放/状態2
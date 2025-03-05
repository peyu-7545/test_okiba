let Count= 0;
let SpaceKeyPressed = false;


const tilesData = [
  ["ウェブマニアと雑談", `鯖主を含めた雑談場。しかし鯖主はどこにでも現れるので意味をなしていない。`, 10],
  ["総合雑談1", `第一の雑談。日々話題が尽きず、議論が交わされる重要なチャンネル。`, 50],
  ["総合雑談2", `総合雑談1が密のときに使われる。最近は若干過疎り気味。`, 100],
  ["つぶやき部屋", `別名「総合雑談3」。メンバーが日常的に呟く。`, 200]
];

const container = document.getElementById("tileContainer");
        let tiles = [];
        
        tilesData.forEach((data, index) => {
            const tile = document.createElement("div");
            tile.className = "tile locked";
            if (index === 0) tile.classList.add("visible");

            tile.innerHTML = `
                <h2 class="title">???</h2>
                <p class="description">???</p>
            `;
            
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
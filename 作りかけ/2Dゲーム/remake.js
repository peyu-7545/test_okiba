//initialization
const canvas=document.createElement("canvas");
const ctx=canvas.getContext("2d");
window.onload=setup;
const numofcell=20;
const width=window.innerWidth;
const height=window.innerHeight;
const limitsize=Math.min(width,height)*0.95;
const cellsize=limitsize/numofcell;

function createcanvas(){
    Object.assign(canvas.style,{
        position:"absolute",
        top:"50%",
        left:"50%",
        transform:"translate(-50%,-50%)",
    });
    document.body.appendChild(canvas);
}

function draw(){
    ctx.clearRect(0,0,limitsize,limitsize);
    for(let y=0;y<numofcell;y++){
        for(let x=0;x<numofcell;x++){
            switch(map[y][x]){
                case 0:ctx.fillStyle="#333";break;
                case 1:ctx.fillStyle="#777";break;
            }
            ctx.fillRect(x*cellsize,y*cellsize,cellsize,cellsize);
        }
    }
}

class Player{
    constructor(x,y,color){
        this.x=x;
        this.y=y;
        this.color=color;
    }

    move(dx,dy){
        this.x=(this.x+dx+numofcell)%numofcell;
        this.y=(this.y+dy+numofcell)%numofcell;
        this.draw();
    }

    draw(){
        draw();
        ctx.beginPath();
        ctx.fillStyle=this.color;
        ctx.arc((this.x+0.5)*cellsize,(this.y+0.5)*cellsize,cellsize/2,0,Math.PI*2);
        ctx.fill();
    }
}

const player=new Player(5,5,"red");
player.draw();

document.addEventListener("keydown",function(evenet){
    switch(event.code){
        case "ArrowRight":player.move(1,0);break;
        case "ArrowLeft":player.move(-1,0);break;
        case "ArrowUp":player.move(0,-1);break;
        case "ArrowDown":player.move(0,1);break;
    }
})

function setup(){
    canvas.width=limitsize;
    canvas.height=limitsize;
    player.draw();
}

createcanvas();
setup();

window.onresize=setup;
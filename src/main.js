import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomctx";


function displayDialogue(text, onDisplayEnd){
	const dialogueUI = document.getElementById("textbox-container");
	const dialogue = document.getElementById("dialogue");
	dialogueUI.style.display = "block"
	let index = 0;
	let currentText = "";
	const intervalRef = setInterval(()=>{
		if (index < text.length){
			currentText += text[index];
			dialogue.innerHTML = currentText;
			index++;
			return ;
		}
		clearInterval(intervalRef);
	}, 5)

	const closeBtn = document.getElementById("close");
	function onCloseBtnClick(){
		onDisplayEnd();
		dialogueUI.style.display = "none";
		dialogue.innerHTML = "";
		clearInterval(intervalRef);
		closeBtn.removeEventListener("click", onCloseBtnClick);
	}
	closeBtn.addEventListener("click", onCloseBtnClick);
}


function setCamScale(k){
	const resizeFactor = k.width() / k.height();
	if (resizeFactor < 1) {k.camScale(k.vec2(1));return ;}

	k.camScale(k.vec2(1.5));
}





k.loadSprite("spritesheet", "./spritesheet.png", {
	sliceX: 39,
	sliceY: 31,
	anims : {
		"idle-down":944,
		"walk-down":{ from: 944, to: 947, loop: true, speed : 8 },
		"idle-side":983,
		"walk-side": { from : 983, to : 986, loop: true, speed: 8 },
		"idle-up": 1022,
		"walk-up":{ from : 1022, to : 1025, loop: true, speed: 8 },
	}
})

k.loadSprite("map", "./map.png")

k.setBackground(k.Color.fromHex("#717047"))

k.scene("main", async () =>{
	const mapData = await (await fetch("./map.json")).json();
	const layers = mapData.layers;
	const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor )]);
	const player = k.make([
		k.sprite("spritesheet", {anim : "idle-down"}),
		k.area({
			shape: new k.Rect(k.vec2(0, 3), 10 , 10),
		}),
		k.body(),
		k.anchor("center"),
		k.pos(),
		k.scale(scaleFactor),
		{
			speed: 250,
			direction: "down",
			isInDialogue: false
		},
		"player "
	])
	for (const layer of layers) {
		if (layer.name === 'boundaries'){
			for (const boundary of layer.objects){
				map.add([
					k.area({shape: new k.Rect(k.vec2(0), boundary.width, boundary.height)}),
					k.body({isStatic: true}),
					k.pos(boundary.x, boundary.y),
					boundary.name,
				])
				if (boundary.name){
					player.onCollide(boundary.name, () =>{
						player.isInDialogue = true;
						displayDialogue(dialogueData[boundary.name], ()=>(player.isInDialogue = false))
					})
				}
			}
			continue;
		}

		if(layer.name === "spawnpoints"){
			for (const entity of layer.objects){
				if (entity.name === "player"){
					player.pos = k.vec2((map.pos.x + entity.x) * scaleFactor, (map.pos.y + entity.y) * scaleFactor);
					k.add(player);
					continue;
				}
			}
		}
	}


	setCamScale(k);

	k.onResize(() => {
		setCamScale(k);
	});

	k.onUpdate(()=>{
		k.camPos(player.pos.x, player.pos.y )
	})

	k.onMouseDown((mouseBtn)=> {
		if (mouseBtn !== "left" || player.isInDialogue) return;
		const worldMousePos = k.toWorld(k.mousePos());
		player.moveTo(worldMousePos, player.speed);


		const mouseAngle = player.pos.angle(worldMousePos);

		const lowerBound = 50;
		const upperBound = 125;

		if (
		mouseAngle > lowerBound &&
		mouseAngle < upperBound &&
		player.curAnim() !== "walk-up"
		) {
		player.play("walk-up");
		player.direction = "up";
		return;
		}

		if (
		mouseAngle < -lowerBound &&
		mouseAngle > -upperBound &&
		player.curAnim() !== "walk-down"
		) {
		player.play("walk-down");
		player.direction = "down";
		return;
		}

		if (Math.abs(mouseAngle) > upperBound) {
		player.flipX = false;
		if (player.curAnim() !== "walk-side") player.play("walk-side");
		player.direction = "right";
		return;
		}

		if (Math.abs(mouseAngle) < lowerBound) {
		player.flipX = true;
		if (player.curAnim() !== "walk-side") player.play("walk-side");
		player.direction = "left";
		return;
		}



	})


	k.onMouseRelease(() => {

		if (player.direction === "down"){
			player.play("idle-down");
			return ;
		}
		if (player.direction === "up"){
			player.play("idle-up");
			return ;
		}
		player.play("idle-side")
	})
})

k.go("main")


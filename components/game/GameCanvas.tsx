"use client";

import { useEffect, useRef } from "react";
import worldMaps from "@/data/worldMaps.json";

type Direction = "up" | "down" | "left" | "right";

export default function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const holdRef = useRef<Direction | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import("phaser").then((Phaser) => {
      if (cancelled || !hostRef.current) return;

      type MapId = keyof typeof worldMaps;
      type WorldMap = (typeof worldMaps)[MapId];

      class WorldScene extends Phaser.Scene {
        private player!: Phaser.GameObjects.Sprite;
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private keys!: Record<string, Phaser.Input.Keyboard.Key>;
        private interactKey!: Phaser.Input.Keyboard.Key;
        private obstacles = new Set<string>();
        private npcs: Array<{ x: number; y: number; name: string; lines: string[] }> = [];
        private exits: Array<{ x: number; y: number; target: string; spawn: { x: number; y: number } }> = [];
        private message!: Phaser.GameObjects.Text;
        private mapLabel!: Phaser.GameObjects.Text;
        private mapId: MapId = "town";
        private dialogueIndex = 0;
        private activeNpc = -1;
        private moveDirection: Direction | null = null;
        private readonly tileSize = 32;

        constructor() {
          super("WorldScene");
        }

        create() {
          this.createTextures();
          this.createInterface();
          this.loadMap("town", worldMaps.town.spawn);
          if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keys = this.input.keyboard.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
            this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
          }
          this.game.events.on("touch-direction", (direction: Direction | null) => {
            this.moveDirection = direction;
          });
          this.game.events.on("touch-interact", () => this.interact());
        }

        private createTextures() {
          const graphics = this.make.graphics({ x: 0, y: 0 });
          graphics.fillStyle(0x315b9a); graphics.fillRect(4, 2, 8, 7);
          graphics.fillStyle(0xe7bd91); graphics.fillRect(4, 9, 8, 7);
          graphics.fillStyle(0x294b83); graphics.fillRect(2, 16, 12, 7);
          graphics.fillStyle(0x283a58); graphics.fillRect(3, 22, 4, 2); graphics.fillRect(9, 22, 4, 2);
          graphics.generateTexture("player", 16, 24);
          graphics.clear();
          graphics.fillStyle(0xe0b58b); graphics.fillRect(5, 1, 10, 10);
          graphics.fillStyle(0x6d4936); graphics.fillRect(4, 0, 12, 4);
          graphics.fillStyle(0x9a654b); graphics.fillRect(3, 11, 14, 12);
          graphics.fillStyle(0x4b594d); graphics.fillRect(4, 22, 5, 2); graphics.fillRect(11, 22, 5, 2);
          graphics.generateTexture("npc", 20, 24);
          graphics.destroy();
        }

        private createInterface() {
          this.message = this.add.text(384, 390, "", {
            fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#ffffff",
            backgroundColor: "#17221b", padding: { x: 12, y: 9 }, wordWrap: { width: 650 }
          }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setVisible(false);
          this.mapLabel = this.add.text(14, 14, "", {
            fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#ffffff",
            backgroundColor: "#17221b", padding: { x: 9, y: 7 }
          }).setScrollFactor(0).setDepth(30);
        }

        private loadMap(id: MapId, spawn: { x: number; y: number }) {
          this.mapId = id;
          const map = worldMaps[id] as WorldMap;
          this.obstacles.clear();
          this.npcs.forEach((npc) => npc && this.children.list.filter((item) => item instanceof Phaser.GameObjects.Container).forEach((item) => item.destroy()));
          this.npcs = map.npcs;
          this.exits = map.exits;
          this.children.list.filter((item) => item.getData("map-object")).forEach((item) => item.destroy());
          const graphics = this.add.graphics().setDepth(0);
          map.tiles.forEach((line, y) => {
            [...line].forEach((tile, x) => {
              const px = x * this.tileSize; const py = y * this.tileSize;
              if (tile === "=") {
                graphics.fillStyle(0xc7b58a); graphics.fillRect(px, py, 32, 32);
                graphics.fillStyle(0xb7a47a); graphics.fillRect(px + 3, py + 15, 26, 2);
              } else {
                graphics.fillStyle((x + y) % 2 === 0 ? 0x82a875 : 0x789b68); graphics.fillRect(px, py, 32, 32);
                if (tile === "#" || tile === "T") {
                  this.obstacles.add(`${x},${y}`);
                  if (tile === "#") { graphics.fillStyle(0x355b3c); graphics.fillRect(px, py, 32, 32); }
                  else {
                    graphics.fillStyle(0x52784d); graphics.fillRect(px + 10, py + 15, 12, 14);
                    graphics.fillStyle(0x315d3c); graphics.fillCircle(px + 16, py + 12, 13);
                    graphics.fillStyle(0x71965b); graphics.fillCircle(px + 12, py + 9, 5);
                  }
                }
              }
            });
          });
          graphics.setData("map-object", true);
          this.npcs.forEach((npc) => {
            const container = this.add.container(npc.x * 32 + 16, npc.y * 32 + 16);
            container.add([this.add.image(0, 0, "npc"), this.add.circle(0, -23, 4, 0xf2d36f)]);
            container.setDepth(9).setData("map-object", true);
          });
          const worldWidth = map.width * this.tileSize; const worldHeight = map.height * this.tileSize;
          this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
          this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
          const px = spawn.x * 32 + 16; const py = spawn.y * 32 + 16;
          if (!this.player) this.player = this.add.sprite(px, py, "player").setDepth(10);
          else this.player.setPosition(px, py);
          this.cameras.main.startFollow(this.player, true, 0.16, 0.16);
          this.mapLabel.setText(map.name);
          this.message.setVisible(false);
        }

        private isBlocked(x: number, y: number) {
          return this.obstacles.has(`${Math.floor(x / 32)},${Math.floor(y / 32)}`);
        }

        private movePlayer(dx: number, dy: number) {
          const nextX = this.player.x + dx; const nextY = this.player.y + dy;
          if (dx && !this.isBlocked(nextX + Math.sign(dx) * 7, this.player.y + 7) &&
              !this.isBlocked(nextX + Math.sign(dx) * 7, this.player.y + 19)) this.player.x = nextX;
          if (dy && !this.isBlocked(this.player.x - 5, nextY + Math.sign(dy) * 7) &&
              !this.isBlocked(this.player.x + 5, nextY + Math.sign(dy) * 7)) this.player.y = nextY;
        }

        private interact() {
          const nearest = this.npcs.findIndex((npc) =>
            Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x * 32 + 16, npc.y * 32 + 16) < 54
          );
          if (nearest < 0) {
            this.message.setText("주변에 대화할 사람이 없습니다.").setVisible(true);
            return;
          }
          if (this.activeNpc !== nearest) { this.activeNpc = nearest; this.dialogueIndex = 0; }
          const npc = this.npcs[nearest];
          this.message.setText(`${npc.name}: ${npc.lines[this.dialogueIndex]}`).setVisible(true);
          this.dialogueIndex = (this.dialogueIndex + 1) % npc.lines.length;
        }

        update(_time: number, delta: number) {
          if (!this.player || !this.cursors || !this.keys) return;
          let dx = 0; let dy = 0;
          if (this.cursors.left.isDown || this.keys.A.isDown || this.moveDirection === "left") dx--;
          if (this.cursors.right.isDown || this.keys.D.isDown || this.moveDirection === "right") dx++;
          if (this.cursors.up.isDown || this.keys.W.isDown || this.moveDirection === "up") dy--;
          if (this.cursors.down.isDown || this.keys.S.isDown || this.moveDirection === "down") dy++;
          if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
          if (dx || dy) {
            const step = 0.13 * delta; const count = Math.max(1, Math.ceil(step / 4));
            for (let i = 0; i < count; i++) this.movePlayer(dx * step / count, dy * step / count);
            this.player.setAngle(dx < 0 ? -4 : dx > 0 ? 4 : 0);
            this.player.setScale(1, 1 + Math.sin(_time / 65) * 0.06);
            this.message.setVisible(false);
          } else this.player.setAngle(0).setScale(1);
          if (Phaser.Input.Keyboard.JustDown(this.interactKey)) this.interact();

          const tileX = Math.floor(this.player.x / 32); const tileY = Math.floor(this.player.y / 32);
          const exit = this.exits.find((item) => item.x === tileX && item.y === tileY);
          if (exit) this.loadMap(exit.target as MapId, exit.spawn);
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO, parent: hostRef.current, width: 768, height: 448,
        backgroundColor: "#789b68", pixelArt: true,
        render: { antialias: false, roundPixels: true },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [WorldScene]
      });
    });

    return () => { cancelled = true; gameRef.current?.destroy(true); gameRef.current = null; };
  }, []);

  const setDirection = (direction: Direction | null) => {
    holdRef.current = direction;
    gameRef.current?.events.emit("touch-direction", direction);
  };

  const interact = () => gameRef.current?.events.emit("touch-interact");

  return (
    <div className="game-stage">
      <div className="game-canvas" ref={hostRef} aria-label="타일 기반 탐험 월드" />
      <div className="touch-controls" aria-label="모바일 조작">
        <div className="direction-pad">
          <button type="button" aria-label="위로 이동" onPointerDown={() => setDirection("up")} onPointerUp={() => setDirection(null)} onPointerLeave={() => setDirection(null)} onPointerCancel={() => setDirection(null)}>▲</button>
          <div><button type="button" aria-label="왼쪽 이동" onPointerDown={() => setDirection("left")} onPointerUp={() => setDirection(null)} onPointerLeave={() => setDirection(null)} onPointerCancel={() => setDirection(null)}>◀</button><button type="button" aria-label="아래로 이동" onPointerDown={() => setDirection("down")} onPointerUp={() => setDirection(null)} onPointerLeave={() => setDirection(null)} onPointerCancel={() => setDirection(null)}>▼</button><button type="button" aria-label="오른쪽 이동" onPointerDown={() => setDirection("right")} onPointerUp={() => setDirection(null)} onPointerLeave={() => setDirection(null)} onPointerCancel={() => setDirection(null)}>▶</button></div>
        </div>
        <button className="interact-control" type="button" onClick={interact}>대화</button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

const MAP = [
  "########################",
  "#....T.......T.........#",
  "#....T.......T....T....#",
  "#...........TTT........#",
  "#..TT.................T#",
  "#..TT....====..........#",
  "#........====..........#",
  "#########====###########",
  "========================",
  "========================",
  "#########====###########",
  "#........====..........#",
  "#..T.....====.....T....#",
  "########################"
];

export default function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import("phaser").Game | undefined;
    let cancelled = false;

    void import("phaser").then((Phaser) => {
      if (cancelled || !hostRef.current) return;

      class WorldScene extends Phaser.Scene {
        private player!: Phaser.GameObjects.Sprite;
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private keys!: Record<string, Phaser.Input.Keyboard.Key>;
        private obstacles = new Set<string>();
        private npc!: Phaser.GameObjects.Container;
        private message!: Phaser.GameObjects.Text;
        private interactKey!: Phaser.Input.Keyboard.Key;
        private facing = new Phaser.Math.Vector2(0, 1);
        private moving = false;
        private readonly tileSize = 32;

        constructor() {
          super("WorldScene");
        }

        create() {
          this.createTextures();
          this.drawMap();
          this.createPlayer();
          this.createNpc();
          this.createInterface();

          if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keys = this.input.keyboard.addKeys("W,A,S,D") as Record<
              string,
              Phaser.Input.Keyboard.Key
            >;
            this.interactKey = this.input.keyboard.addKey(
              Phaser.Input.Keyboard.KeyCodes.E
            );
          }

          this.cameras.main.setBounds(0, 0, 768, 448);
          this.cameras.main.startFollow(this.player, true, 0.16, 0.16);
        }

        private createTextures() {
          const graphics = this.make.graphics({ x: 0, y: 0 });

          graphics.fillStyle(0x315b9a);
          graphics.fillRect(4, 2, 8, 7);
          graphics.fillStyle(0xe7bd91);
          graphics.fillRect(4, 9, 8, 7);
          graphics.fillStyle(0x294b83);
          graphics.fillRect(2, 16, 12, 7);
          graphics.fillStyle(0x283a58);
          graphics.fillRect(3, 22, 4, 2);
          graphics.fillRect(9, 22, 4, 2);
          graphics.generateTexture("player", 16, 24);
          graphics.clear();

          graphics.fillStyle(0xe0b58b);
          graphics.fillRect(5, 1, 10, 10);
          graphics.fillStyle(0x6d4936);
          graphics.fillRect(4, 0, 12, 4);
          graphics.fillStyle(0x9a654b);
          graphics.fillRect(3, 11, 14, 12);
          graphics.fillStyle(0x4b594d);
          graphics.fillRect(4, 22, 5, 2);
          graphics.fillRect(11, 22, 5, 2);
          graphics.generateTexture("npc", 20, 24);
          graphics.destroy();
        }

        private drawMap() {
          const graphics = this.add.graphics();

          MAP.forEach((line, y) => {
            [...line].forEach((tile, x) => {
              const px = x * this.tileSize;
              const py = y * this.tileSize;

              if (tile === "=") {
                graphics.fillStyle(0xc7b58a);
                graphics.fillRect(px, py, 32, 32);
                graphics.fillStyle(0xb7a47a);
                graphics.fillRect(px + 3, py + 15, 26, 2);
                return;
              }

              graphics.fillStyle((x + y) % 2 === 0 ? 0x82a875 : 0x789b68);
              graphics.fillRect(px, py, 32, 32);

              if (tile === "#") {
                this.obstacles.add(`${x},${y}`);
                graphics.fillStyle(0x355b3c);
                graphics.fillRect(px, py, 32, 32);
              }

              if (tile === "T") {
                this.obstacles.add(`${x},${y}`);
                graphics.fillStyle(0x52784d);
                graphics.fillRect(px + 10, py + 15, 12, 14);
                graphics.fillStyle(0x315d3c);
                graphics.fillCircle(px + 16, py + 12, 13);
                graphics.fillStyle(0x71965b);
                graphics.fillCircle(px + 12, py + 9, 5);
              }
            });
          });
        }

        private createPlayer() {
          this.player = this.add.sprite(6 * 32 + 16, 6 * 32 + 16, "player");
          this.player.setDepth(10);
        }

        private createNpc() {
          this.npc = this.add.container(16 * 32 + 16, 6 * 32 + 16);
          const sprite = this.add.image(0, 0, "npc");
          const marker = this.add.circle(0, -23, 4, 0xf2d36f);
          this.npc.add([sprite, marker]);
          this.npc.setDepth(9);
        }

        private createInterface() {
          this.message = this.add.text(384, 390, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            color: "#ffffff",
            backgroundColor: "#17221b",
            padding: { x: 12, y: 9 }
          });
          this.message.setOrigin(0.5);
          this.message.setScrollFactor(0);
          this.message.setDepth(30);
          this.message.setVisible(false);
        }

        private isBlocked(worldX: number, worldY: number) {
          const tileX = Math.floor(worldX / this.tileSize);
          const tileY = Math.floor(worldY / this.tileSize);
          return this.obstacles.has(`${tileX},${tileY}`);
        }

        private movePlayer(dx: number, dy: number) {
          const distance = 16;
          const nextX = this.player.x + dx * distance;
          const nextY = this.player.y + dy * distance;

          if (dx !== 0) {
            if (!this.isBlocked(nextX + dx * 7, this.player.y + 7) &&
                !this.isBlocked(nextX + dx * 7, this.player.y + 19)) {
              this.player.x = nextX;
            }
          }

          if (dy !== 0) {
            if (!this.isBlocked(this.player.x - 5, nextY + dy * 7) &&
                !this.isBlocked(this.player.x + 5, nextY + dy * 7)) {
              this.player.y = nextY;
            }
          }

          this.player.x = Phaser.Math.Clamp(this.player.x, 16, 752);
          this.player.y = Phaser.Math.Clamp(this.player.y, 16, 432);
        }

        private interact() {
          const distance = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.npc.x,
            this.npc.y
          );

          if (distance < 54) {
            this.message.setText("여행자: 이 길을 따라가면 새로운 장소로 이어질 거야.");
            this.message.setVisible(true);
          } else {
            this.message.setText("주변에 대화할 사람이 없습니다.");
            this.message.setVisible(true);
          }
        }

        update(_time: number, delta: number) {
          if (!this.player || !this.cursors || !this.keys) return;

          let dx = 0;
          let dy = 0;

          if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
          if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
          if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
          if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;

          this.moving = dx !== 0 || dy !== 0;

          if (this.moving) {
            if (dx !== 0 && dy !== 0) {
              dx *= Math.SQRT1_2;
              dy *= Math.SQRT1_2;
            }

            this.facing.set(dx, dy);
            const step = 0.13 * delta;
            const steps = Math.max(1, Math.ceil(step / 4));

            for (let i = 0; i < steps; i += 1) {
              this.movePlayer(dx * step / steps, dy * step / steps);
            }

            this.player.setAngle(dx < 0 ? -4 : dx > 0 ? 4 : 0);
          } else {
            this.player.setAngle(0);
          }

          if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.interact();
          }

          if (this.message.visible && !this.moving) {
            this.message.setAlpha(1);
          }
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        width: 768,
        height: 448,
        backgroundColor: "#789b68",
        pixelArt: true,
        render: {
          antialias: false,
          roundPixels: true
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [WorldScene]
      });
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return <div className="game-canvas" ref={hostRef} aria-label="타일 기반 탐험 월드" />;
}

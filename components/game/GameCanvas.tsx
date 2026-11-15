"use client";

import { useEffect, useRef } from "react";

export default function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import("phaser").Game | undefined;
    let cancelled = false;

    void import("phaser").then((Phaser) => {
      if (cancelled || !hostRef.current) return;

      class WorldScene extends Phaser.Scene {
        private player?: Phaser.GameObjects.Rectangle;
        private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
        private keys?: Record<string, Phaser.Input.Keyboard.Key>;

        constructor() {
          super("WorldScene");
        }

        create() {
          const graphics = this.add.graphics();
          const tileSize = 32;
          const columns = 24;
          const rows = 14;

          graphics.fillStyle(0x789b68, 1);
          graphics.fillRect(0, 0, columns * tileSize, rows * tileSize);

          for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < columns; x += 1) {
              const shade = (x + y) % 2 === 0 ? 0x82a875 : 0x789b68;
              graphics.fillStyle(shade, 1);
              graphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
          }

          graphics.fillStyle(0xc5b58a, 1);
          graphics.fillRect(0, 8 * tileSize, columns * tileSize, 3 * tileSize);
          graphics.fillRect(10 * tileSize, 0, 4 * tileSize, rows * tileSize);

          graphics.fillStyle(0x52784d, 1);
          for (let x = 2; x < columns; x += 5) {
            for (let y = 2; y < rows; y += 4) {
              graphics.fillCircle(x * tileSize + 16, y * tileSize + 16, 9);
              graphics.fillRect(x * tileSize + 11, y * tileSize + 19, 10, 9);
            }
          }

          this.player = this.add.rectangle(
            6 * tileSize + 16,
            6 * tileSize + 16,
            20,
            24,
            0x315b9a
          );
          this.player.setStrokeStyle(2, 0xf4f0d8);

          if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keys = this.input.keyboard.addKeys("W,A,S,D") as Record<
              string,
              Phaser.Input.Keyboard.Key
            >;
          }

          this.cameras.main.setBounds(0, 0, columns * tileSize, rows * tileSize);
          this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        }

        update(_time: number, delta: number) {
          if (!this.player || !this.cursors || !this.keys) return;

          const speed = 0.16 * delta;
          let x = 0;
          let y = 0;

          if (this.cursors.left.isDown || this.keys.A.isDown) x -= 1;
          if (this.cursors.right.isDown || this.keys.D.isDown) x += 1;
          if (this.cursors.up.isDown || this.keys.W.isDown) y -= 1;
          if (this.cursors.down.isDown || this.keys.S.isDown) y += 1;

          if (x !== 0 && y !== 0) {
            x *= Math.SQRT1_2;
            y *= Math.SQRT1_2;
          }

          this.player.x = Phaser.Math.Clamp(this.player.x + x * speed, 12, 756);
          this.player.y = Phaser.Math.Clamp(this.player.y + y * speed, 12, 436);
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

  return <div className="game-canvas" ref={hostRef} aria-label="탐험 테스트 월드" />;
}

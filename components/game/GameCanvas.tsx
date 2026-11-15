"use client";

import { useEffect, useRef } from "react";
import worldMaps from "@/data/worldMaps.json";
import creatures from "@/data/creatures.json";

type Direction = "up" | "down" | "left" | "right";
type CreatureId = keyof typeof creatures;
type CreatureData = (typeof creatures)[CreatureId] & { expYield: number; moves: Array<{ name: string; power: number; type: string }> };

export default function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import("phaser").then((Phaser) => {
      if (cancelled || !hostRef.current) return;

      type MapId = keyof typeof worldMaps;
      type WorldMap = (typeof worldMaps)[MapId];
      type EncounterTable = {
        chance: number;
        table: Array<{ speciesId: string; weight: number; minLevel: number; maxLevel: number }>;
      };

      class WorldScene extends Phaser.Scene {
        private player!: Phaser.GameObjects.Sprite;
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private keys!: Record<string, Phaser.Input.Keyboard.Key>;
        private interactKey!: Phaser.Input.Keyboard.Key;
        private actionKeys!: Record<string, Phaser.Input.Keyboard.Key>;
        private obstacles = new Set<string>();
        private npcs: Array<{ x: number; y: number; name: string; lines: string[] }> = [];
        private exits: Array<{ x: number; y: number; target: string; spawn: { x: number; y: number } }> = [];
        private message!: Phaser.GameObjects.Text;
        private mapLabel!: Phaser.GameObjects.Text;
        private mapLayer?: Phaser.GameObjects.Container;
        private battleLayer?: Phaser.GameObjects.Container;
        private mapId: MapId = "town";
        private dialogueIndex = 0;
        private activeNpc = -1;
        private moveDirection: Direction | null = null;
        private encounterTable: EncounterTable | null = null;
        private lastGrassTile = "";
        private nextEncounterAt = 0;
        private inBattle = false;
        private enemy: { species: CreatureData; level: number; hp: number } | null = null;
        private party = [{ speciesId: "mossling" as CreatureId, level: 5, hp: creatures.mossling.maxHp + 12, exp: 0 }];
        private discovered = new Set<string>(["mossling"]);
        private partyPanelOpen = false;
        private partyLayer?: Phaser.GameObjects.Container;
        private balls = 5;
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
            this.actionKeys = this.input.keyboard.addKeys("ONE,TWO,THREE,FOUR,FIVE,SIX,P,H") as Record<string, Phaser.Input.Keyboard.Key>;
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
          graphics.clear();
          graphics.fillStyle(0x91c77a); graphics.fillCircle(16, 16, 13);
          graphics.fillStyle(0x416c45); graphics.fillCircle(11, 13, 3); graphics.fillCircle(21, 13, 3);
          graphics.fillStyle(0xffffff); graphics.fillCircle(11, 12, 1); graphics.fillCircle(21, 12, 1);
          graphics.generateTexture("mossling", 32, 32);
          graphics.clear();
          graphics.fillStyle(0xe58b54); graphics.fillCircle(16, 16, 13);
          graphics.fillStyle(0xffd36a); graphics.fillTriangle(8, 8, 13, 0, 16, 10); graphics.fillTriangle(17, 10, 23, 0, 25, 10);
          graphics.fillStyle(0x5c3828); graphics.fillCircle(11, 16, 2); graphics.fillCircle(21, 16, 2);
          graphics.generateTexture("emberkit", 32, 32);
          graphics.clear();
          graphics.fillStyle(0x72b9d4); graphics.fillCircle(16, 16, 13);
          graphics.fillStyle(0xc8f1f2); graphics.fillEllipse(16, 7, 11, 8);
          graphics.fillStyle(0x245b79); graphics.fillCircle(11, 17, 2); graphics.fillCircle(21, 17, 2);
          graphics.generateTexture("aquabud", 32, 32);
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
          this.mapLayer?.destroy(true);
          this.mapLayer = this.add.container(0, 0).setDepth(0);
          this.obstacles.clear();
          this.npcs = map.npcs;
          this.exits = map.exits;
          this.encounterTable = "encounters" in map ? map.encounters as EncounterTable : null;
          this.lastGrassTile = "";
          const graphics = this.make.graphics({ x: 0, y: 0 });
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
                if (tile === "g") {
                  graphics.fillStyle(0x5e9858); graphics.fillRect(px + 2, py + 2, 28, 28);
                  graphics.fillStyle(0x9acb70);
                  graphics.fillTriangle(px + 5, py + 24, px + 10, py + 9, px + 14, py + 24);
                  graphics.fillTriangle(px + 15, py + 27, px + 20, py + 8, px + 24, py + 27);
                }
              }
            });
          });
          graphics.setDepth(0);
          this.mapLayer.add(graphics);
          this.npcs.forEach((npc) => {
            const container = this.add.container(npc.x * 32 + 16, npc.y * 32 + 16);
            container.add([this.add.image(0, 0, "npc"), this.add.circle(0, -23, 4, 0xf2d36f)]);
            container.setDepth(9);
            this.mapLayer?.add(container);
          });
          const worldWidth = map.width * this.tileSize;
          const worldHeight = map.height * this.tileSize;
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
          if (this.inBattle) return;
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

        private checkEncounter(time: number) {
          if (!this.encounterTable || this.inBattle || time < this.nextEncounterAt) return;
          const tx = Math.floor(this.player.x / 32);
          const ty = Math.floor(this.player.y / 32);
          const map = worldMaps[this.mapId] as WorldMap;
          const tile = map.tiles[ty]?.[tx];
          const key = tile === "g" ? `${tx},${ty}` : "";
          if (!key) { this.lastGrassTile = ""; return; }
          if (key === this.lastGrassTile) return;
          this.lastGrassTile = key;
          this.nextEncounterAt = time + 1000;
          if (Math.random() < this.encounterTable.chance) this.startEncounter();
        }

        private startEncounter() {
          if (!this.encounterTable || this.inBattle) return;
          const entries = this.encounterTable.table;
          const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
          let roll = Math.random() * total;
          let selected = entries[0];
          for (const entry of entries) {
            roll -= entry.weight;
            if (roll <= 0) { selected = entry; break; }
          }
          const species = creatures[selected.speciesId as CreatureId] as CreatureData;
          const level = Phaser.Math.Between(selected.minLevel, selected.maxLevel);
          this.enemy = { species, level, hp: species.maxHp + (level - 1) * 3 };
          this.inBattle = true;
          this.showBattlePanel(`야생 ${species.name}이(가) 나타났다!`);
        }

        private showBattlePanel(status: string) {
          this.battleLayer?.destroy(true);
          this.battleLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(50);
          this.battleLayer.add(this.add.rectangle(384, 224, 700, 390, 0x101712, 0.96).setStrokeStyle(2, 0xa7e3a5));
          this.battleLayer.add(this.add.text(384, 45, "야생 생명체와의 전투", { fontSize: "21px", color: "#a7e3a5", fontStyle: "bold" }).setOrigin(0.5));
          const active = this.party[0];
          const ally = creatures[active.speciesId];
          this.battleLayer.add([
            this.add.image(190, 145, ally.id).setScale(2.5),
            this.add.image(570, 145, this.enemy!.species.id).setScale(2.5),
            this.add.text(85, 205, `${ally.name} Lv.${active.level}\nHP ${active.hp}/${ally.maxHp + (active.level - 1) * 3}`, { fontSize: "14px", color: "#ffffff", lineSpacing: 5 }),
            this.add.text(420, 205, `${this.enemy!.species.name} Lv.${this.enemy!.level}\nHP ${this.enemy!.hp}/${this.enemy!.species.maxHp + (this.enemy!.level - 1) * 3}`, { fontSize: "14px", color: "#ffffff", lineSpacing: 5 }),
            this.add.text(384, 265, status, { fontSize: "13px", color: "#dce8dc", align: "center", wordWrap: { width: 620 } }).setOrigin(0.5)
          ]);
          const actions: Array<{ label: string; x: number; action: () => void }> = [];
          const moves = ally.moves.slice(0, 4);
          moves.forEach((move, index) => actions.push({ label: `${index + 1}. ${move.name}`, x: 95 + index * 130, action: () => this.attack(index) }));
          actions.push({ label: `5. 포획 ${this.balls}`, x: 615, action: () => this.capture() });
          actions.push({ label: "6. 도주", x: 615, action: () => this.flee() });
          actions.forEach(({ label, x, action }, index) => {
            const y = index < 3 ? 335 : 375;
            const column = index < 3 ? index : index - 3;
            const positionX = 150 + column * 234;
            const button = this.add.text(positionX, y, label, { fontSize: "12px", color: "#101712", backgroundColor: "#a7e3a5", padding: { x: 8, y: 9 }, fontStyle: "bold" })
              .setOrigin(0.5).setInteractive({ useHandCursor: true });
            button.on("pointerdown", action);
            this.battleLayer?.add(button);
          });
        }

        private typeMultiplier(attackType: string, defenderType: string) {
          const chart: Record<string, Record<string, number>> = {
            "풀": { "물": 2, "불꽃": 0.5, "풀": 0.5 },
            "불꽃": { "풀": 2, "물": 0.5, "불꽃": 0.5 },
            "물": { "불꽃": 2, "풀": 0.5, "물": 0.5 }
          };
          return chart[attackType]?.[defenderType] ?? 1;
        }

        private closePartyPanel() {
          this.partyPanelOpen = false;
          this.partyLayer?.destroy(true);
          this.partyLayer = undefined;
        }

        private showPartyPanel() {
          this.closePartyPanel();
          this.partyPanelOpen = true;
          this.partyLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(60);
          this.partyLayer.add(this.add.rectangle(384, 224, 700, 390, 0x101712, 0.97).setStrokeStyle(2, 0xa7e3a5));
          this.partyLayer.add(this.add.text(384, 48, "포켓몬 파티", { fontSize: "22px", color: "#a7e3a5", fontStyle: "bold" }).setOrigin(0.5));
          this.party.forEach((member, index) => {
            const data = creatures[member.speciesId];
            const maxHp = data.maxHp + (member.level - 1) * 3;
            const selected = index === 0;
            const row = this.add.rectangle(384, 105 + index * 48, 620, 40, selected ? 0x315b3d : 0x26352a, 1)
              .setStrokeStyle(1, selected ? 0xa7e3a5 : 0x536657).setInteractive({ useHandCursor: true });
            const label = this.add.text(100, 94 + index * 48,
              `${index + 1}. ${data.name}  Lv.${member.level}  HP ${member.hp}/${maxHp}  EXP ${member.exp}/${member.level * 20}`,
              { fontSize: "14px", color: "#ffffff" });
            row.on("pointerdown", () => this.switchPartyMember(index));
            label.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.switchPartyMember(index));
            this.partyLayer?.add([row, label]);
          });
          const hint = this.add.text(384, 370, "항목을 선택하면 선두 포켓몬이 교체됩니다 · P 키로 닫기", { fontSize: "12px", color: "#dce8dc" }).setOrigin(0.5);
          this.partyLayer.add(hint);
        }

        private switchPartyMember(index: number) {
          if (index < 0 || index >= this.party.length || index === 0) return;
          const current = this.party[0];
          if (current.hp <= 0) {
            this.message.setText("기절한 포켓몬은 교체할 수 없습니다.").setVisible(true);
            return;
          }
          const target = this.party[index];
          if (target.hp <= 0) {
            this.message.setText("기절한 포켓몬은 선두로 교체할 수 없습니다.").setVisible(true);
            return;
          }
          [this.party[0], this.party[index]] = [this.party[index], this.party[0]];
          this.showPartyPanel();
        }

        private healParty() {
          this.party.forEach((member) => {
            member.hp = creatures[member.speciesId].maxHp + (member.level - 1) * 3;
          });
          this.message.setText("파티의 모든 포켓몬을 회복했습니다.").setVisible(true);
        }

        private gainExperience(amount: number) {
          const active = this.party[0];
          const data = creatures[active.speciesId];
          active.exp += amount;
          let leveled = false;
          while (active.exp >= active.level * 20 && active.level < 100) {
            active.exp -= active.level * 20;
            active.level += 1;
            active.hp += 3;
            leveled = true;
          }
          return leveled ? `${data.name}이(가) 레벨 ${active.level}(으)로 성장했다!` : `${data.name}이(가) 경험치 ${amount}을(를) 얻었다.`;
        }

        private enemyTurn() {
          if (!this.enemy || !this.inBattle) return;
          const active = this.party[0];
          const species = creatures[active.speciesId];
          const damage = Math.max(1, Math.floor(this.enemy.species.attack * 0.55 - species.defense * 0.25 + Math.random() * 3));
          active.hp = Math.max(0, active.hp - damage);
          if (active.hp <= 0) {
            active.hp = 0;
            this.finishBattle(`${species.name}이(가) 기운을 잃었다. 마을로 돌아가 회복했다.`, true);
            return;
          }
          this.showBattlePanel(`상대의 반격! ${species.name}이(가) ${damage} 피해를 받았다.`);
        }

        private attack(moveIndex = 0) {
          if (!this.enemy || !this.inBattle) return;
          const active = this.party[0];
          const species = creatures[active.speciesId];
          const move = species.moves[Math.min(moveIndex, species.moves.length - 1)];
          const multiplier = this.typeMultiplier(move.type, this.enemy.species.type);
          const damage = Math.max(1, Math.floor((move.power + Math.random() * 4 - this.enemy.species.defense * 0.25) * multiplier));
          this.enemy.hp = Math.max(0, this.enemy.hp - damage);
          if (this.enemy.hp <= 0) {
            const reward = this.gainExperience(this.enemy.species.expYield + this.enemy.level * 3);
            this.finishBattle(`${this.enemy.species.name}을(를) 이겼다! ${reward}`, false);
            return;
          }
          this.enemyTurn();
        }

        private capture() {
          if (!this.enemy || !this.inBattle) return;
          if (this.party.length >= 6) { this.showBattlePanel("파티가 가득 찼습니다. 먼저 파티 공간을 확보하세요."); return; }
          if (this.balls <= 0) { this.showBattlePanel("포획 도구가 없습니다. 공격하거나 도주하세요."); return; }
          this.balls -= 1;
          const maxHp = this.enemy.species.maxHp + (this.enemy.level - 1) * 3;
          const missingRatio = 1 - this.enemy.hp / maxHp;
          const chance = Math.min(0.9, 0.28 + missingRatio * 0.58);
          if (Math.random() < chance) {
            if (this.party.length < 6) {
              this.party.push({ speciesId: this.enemy.species.id as CreatureId, level: this.enemy.level, hp: this.enemy.hp, exp: 0 });
              this.discovered.add(this.enemy.species.id);
              this.finishBattle(`${this.enemy.species.name} 포획 성공! 파티에 합류했다.`, false);
            } else {
              this.finishBattle(`${this.enemy.species.name} 포획 성공! 파티가 가득 차 있어 기록만 남겼다.`, false);
            }
            return;
          }
          this.enemyTurn();
        }

        private flee() {
          this.finishBattle("무사히 전투에서 벗어났다.", false);
        }

        private finishBattle(result: string, fainted: boolean) {
          this.inBattle = false;
          this.enemy = null;
          if (fainted) this.party[0].hp = creatures[this.party[0].speciesId].maxHp + (this.party[0].level - 1) * 3;
          this.battleLayer?.destroy(true);
          this.battleLayer = undefined;
          this.message.setText(result).setVisible(true);
          this.nextEncounterAt = this.time.now + 1800;
          this.lastGrassTile = "";
        }

        update(time: number, delta: number) {
          if (!this.player || !this.cursors || !this.keys) return;
          if (this.inBattle) {
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.ONE)) this.attack(0);
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.TWO)) this.attack(1);
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.THREE)) this.attack(2);
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.FOUR)) this.attack(3);
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.FIVE)) this.capture();
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.SIX)) this.flee();
            return;
          }
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
            this.player.setScale(1, 1 + Math.sin(time / 65) * 0.06);
            this.message.setVisible(false);
            this.checkEncounter(time);
          } else this.player.setAngle(0).setScale(1);
          if (Phaser.Input.Keyboard.JustDown(this.interactKey)) this.interact();
          if (Phaser.Input.Keyboard.JustDown(this.actionKeys.P)) {
            if (this.partyPanelOpen) this.closePartyPanel();
            else this.showPartyPanel();
          }
          if (Phaser.Input.Keyboard.JustDown(this.actionKeys.H)) this.healParty();
          if (this.partyPanelOpen) return;
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
    gameRef.current?.events.emit("touch-direction", direction);
  };

  const interact = () => gameRef.current?.events.emit("touch-interact");

  return (
    <div className="game-stage">
      <div className="game-canvas" ref={hostRef} aria-label="타일 기반 탐험 월드와 전투 화면" />
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

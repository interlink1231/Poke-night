import GameCanvas from "@/components/game/GameCanvas";

export default function GamePage() {
  return (
    <main className="game-shell">
      <header className="game-header">
        <a className="brand" href="/">
          <span className="brand-mark">P</span>
          <span>POKE-NIGHT</span>
        </a>
        <a className="text-button" href="/">홈으로 돌아가기</a>
      </header>
      <section className="game-content">
        <div className="eyebrow">WORLD TEST · PHASE 1</div>
        <h1>첫 번째 탐험</h1>
        <p>방향키 또는 WASD로 캐릭터를 이동할 수 있습니다.</p>
        <GameCanvas />
        <div className="game-help">
          <span>이동</span>
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
          <span className="or-label">또는</span>
          <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd>
        </div>
        <p className="game-disclaimer">현재 화면은 이동 시스템 확인을 위한 테스트 맵입니다.</p>
      </section>
    </main>
  );
}

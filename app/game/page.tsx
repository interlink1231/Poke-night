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
        <div className="eyebrow">WORLD TEST · PHASE 2-2</div>
        <h1>첫 번째 탐험</h1>
        <p>키보드 또는 화면 조작 버튼으로 이동하세요. NPC 근처에서 E 키 또는 대화 버튼을 누르면 대화할 수 있습니다.</p>
        <GameCanvas />
        <div className="game-help">
          <span>PC 이동</span>
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
          <span className="or-label">또는 방향키</span>
          <span className="or-label">대화</span><kbd>E</kbd>
        </div>
        <p className="game-disclaimer">개발용 테스트 맵입니다. 마을과 외곽 길 사이를 이동할 수 있으며, 실제 포켓몬 데이터와 전투는 아직 연결되지 않았습니다.</p>
      </section>
    </main>
  );
}

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
        <div className="eyebrow">CORE SYSTEM TEST · PHASE 3</div>
        <h1>탐험과 야생 조우</h1>
        <p>외곽 길의 키 큰 풀숲을 지나면 야생 생명체와 조우할 수 있습니다. 공격, 포획, 도주를 선택하세요.</p>
        <GameCanvas />
        <div className="game-help">
          <span>이동</span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
          <span className="or-label">대화</span><kbd>E</kbd>
          <span className="or-label">전투</span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd>
        </div>
        <p className="game-disclaimer">현재 전투는 시스템 확인용 프로토타입이며, 임시 창작 생명체와 임시 능력치를 사용합니다. 데이터 저장과 서버 검증은 아직 연결되지 않았습니다.</p>
      </section>
    </main>
  );
}

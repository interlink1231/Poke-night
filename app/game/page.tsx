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
        <div className="eyebrow">CORE SYSTEM TEST · PHASE 6</div>
        <h1>탐험 · 전투 · 저장</h1>
        <p>외곽 길의 키 큰 풀숲을 지나면 야생 생명체와 조우할 수 있습니다. 공격, 포획, 도주를 선택하고 전투 승리로 경험치를 획득하세요. P 키로 파티를 열어 선두 포켓몬을 교체할 수 있습니다. H 키로 파티를 회복할 수 있습니다. 진행 상황은 브라우저에 자동 저장되며, 다른 기기와는 공유되지 않습니다. 전투에서는 1~4번 기술, 5번 포획, 6번 도주를 선택하세요.</p>
        <GameCanvas />
        <div className="game-help">
          <span>이동</span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
          <span className="or-label">대화</span><kbd>E</kbd>
          <span className="or-label">파티</span><kbd>P</kbd><span className="or-label">회복</span><kbd>H</kbd><span className="or-label">전투 기술</span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd><span className="or-label">포획/도주</span><kbd>5</kbd><kbd>6</kbd>
        </div>
        <p className="game-disclaimer">현재 전투는 시스템 확인용 프로토타입이며, 임시 창작 생명체와 임시 능력치를 사용합니다. 저장 데이터는 현재 사용 중인 브라우저에만 보관되며 서버 계정 저장은 아직 지원하지 않습니다.</p>
      </section>
    </main>
  );
}

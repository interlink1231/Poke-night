const regions = ["관동", "성도", "호연", "신오", "하나", "칼로스", "알로라", "가라르", "팔데아"];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">P</span>
          <span>POKE-NIGHT</span>
        </a>
        <span className="status"><span className="status-dot" /> DEVELOPMENT BUILD</span>
      </header>

      <section className="hero">
        <div className="eyebrow">A WORLDWIDE JOURNEY</div>
        <h1>모든 여행은<br /><span>하나의 세계</span>로 이어진다.</h1>
        <p className="intro">여러 지방을 자유롭게 탐험하고, 동료를 만나고, 새로운 여정을 기록하는 픽셀 월드 RPG를 만들어 갑니다.</p>
        <div className="hero-actions">
          <a className="primary-button" href="#world">월드 살펴보기 <span>↗</span></a>
          <a className="text-button" href="https://github.com/interlink1231/Poke-night">GitHub 저장소</a>
        </div>
      </section>

      <section className="world-section" id="world">
        <div className="section-heading">
          <div><div className="eyebrow">THE WORLD</div><h2>하나로 이어지는 지방</h2></div>
          <span className="section-count">09 REGIONS</span>
        </div>
        <div className="region-grid">
          {regions.map((region, index) => (
            <article className="region-card" key={region}>
              <span className="region-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{region}</h3>
              <span className="region-state">기획 단계</span>
            </article>
          ))}
        </div>
        <p className="world-note">히스이는 별도의 시대 콘텐츠로 기획 중입니다.</p>
      </section>

      <footer className="footer"><span>POKE-NIGHT · PROJECT IN DEVELOPMENT</span><span>비공식 팬 프로젝트 구상</span></footer>
    </main>
  );
}

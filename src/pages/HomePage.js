import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  const goToShop = () => navigate('/shop?tab=shop')
  const goToTodayProducts = () => navigate('/shop?tab=today')

  return (
    <div className="home-page">
      <style>{homePageCSS}</style>

      {/* Hero 區塊 */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">WNAP TCG</h1>
          <p className="hero-subtitle">精選卡牌交流平台</p>
        </div>
      </section>

      {/* 快捷功能按鈕 */}
      <section className="quick-actions">
        <div className="actions-grid">

          {/* 今日商品 */}
          <button className="action-card accent" onClick={goToTodayProducts}>
            <span className="action-icon">🃏</span>
            <span className="action-label">今日商品</span>
            <span className="action-desc">每日限量，現在上架</span>
          </button>

          {/* 商城 */}
          <button className="action-card" onClick={goToShop}>
            <span className="action-icon">🏪</span>
            <span className="action-label">商城</span>
            <span className="action-desc">點數兌換好物</span>
          </button>

          {/* 以下保留原有其他功能按鈕，依實際專案調整 */}
          {/* 範例：排行榜、抽卡記錄等 */}

        </div>
      </section>
    </div>
  )
}

const homePageCSS = `
.home-page {
  min-height: 100vh;
  background: var(--bg, #0f0f0f);
  color: var(--text, #f0f0f0);
}

/* ── Hero ── */
.hero {
  padding: 48px 20px 32px;
  text-align: center;
}
.hero-title {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--accent, #f5c518);
  margin: 0 0 8px;
}
.hero-subtitle {
  font-size: 15px;
  color: var(--text-muted, #888);
  margin: 0;
}

/* ── 快捷功能 ── */
.quick-actions {
  padding: 0 16px 40px;
  max-width: 600px;
  margin: 0 auto;
}
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.action-card {
  background: var(--card, #1e1e1e);
  border: 1px solid var(--border, #2a2a2a);
  border-radius: 14px;
  padding: 20px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  border-color: var(--accent, #f5c518);
}
.action-card.accent {
  border-color: var(--accent, #f5c518);
  background: #1a1500;
}
.action-card.accent:hover {
  background: #221c00;
}

.action-icon { font-size: 28px; }
.action-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--text, #f0f0f0);
}
.action-desc {
  font-size: 12px;
  color: var(--text-muted, #888);
  text-align: center;
}
`

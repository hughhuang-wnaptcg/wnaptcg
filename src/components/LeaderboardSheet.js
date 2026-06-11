import React, { useEffect, useState } from 'react'
import { supabase, RARITY_COLORS } from '../lib/supabase'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'

// ── 等級會員卡主題（與 ProfilePage 一致）──
const LEVEL_THEME = {
  精靈球: { bg: 'linear-gradient(135deg,#FFFFFF,#FFE3E3)', border: '#E24B4A', name: '#9A1F1F', sub: '#C06A6A', accent: '#E24B4A', glow: 'rgba(226,75,74,0.20)', dark: false },
  超級球: { bg: 'linear-gradient(135deg,#EAF2FC,#D6E6F8)', border: '#AFCDEE', name: '#13355C', sub: '#4C6E96', accent: '#2F6FB5', glow: 'rgba(55,138,221,0.22)', dark: false },
  高級球: { bg: 'linear-gradient(135deg,#FFF0B8,#F5D04A)', border: '#1A1A1A', name: '#1A1A1A', sub: '#6B5A12', accent: '#5A4A0A', glow: 'rgba(245,200,24,0.30)', dark: false },
  豪華球: { bg: 'linear-gradient(135deg,#2A1B10,#3A2415)', border: '#BA7517', name: '#F7E4C0', sub: '#C9A06A', accent: '#EF9F27', glow: 'rgba(239,159,39,0.30)', dark: true },
  貴重球: { bg: 'linear-gradient(135deg,#2A1414,#3B1C1C)', border: '#A32D2D', name: '#F7D6D0', sub: '#C98A82', accent: '#E24B4A', glow: 'rgba(226,75,74,0.30)', dark: true },
  究極球: { bg: 'linear-gradient(135deg,#10204A,#1B2F66)', border: '#4466DD', name: '#CFE0FF', sub: '#8FA8DD', accent: '#6E9BFF', glow: 'rgba(110,155,255,0.32)', dark: true },
  大師球: { bg: 'linear-gradient(135deg,#1A1A1A,#2A2030)', border: '#B8860B', name: '#F5D060', sub: '#B6A06A', accent: '#F5D060', glow: 'rgba(245,208,96,0.38)', dark: true },
}
function levelTheme(level) {
  return LEVEL_THEME[level] || LEVEL_THEME['精靈球']
}

// ── 會員卡華麗英文（與 ProfilePage 一致）──
const LEVEL_EN = {
  精靈球: 'POKE BALL',
  超級球: 'GREAT BALL',
  高級球: 'ULTRA BALL',
  豪華球: 'LUXURY BALL',
  貴重球: 'PREMIER BALL',
  究極球: 'BEAST BALL',
  大師球: 'MASTER BALL',
}
function levelEn(level) {
  return LEVEL_EN[level] || 'POKE BALL'
}
const FONT_CINZEL = "'Cinzel', 'Times New Roman', serif"
const FONT_PLAYFAIR = "'Playfair Display', 'Times New Roman', serif"

// ── 展示卡光暈（與 ProfilePage 一致）──
// 統一淡暖金柔光，僅高級球以上會員可使用（依被檢視的會員等級判斷）。
const GLOW_ALLOWED_LEVELS = ['高級球', '豪華球', '貴重球', '究極球', '大師球']
function canGlow(level) {
  return GLOW_ALLOWED_LEVELS.includes(level)
}

// 會員主頁背景：高級球以上加一抹球種色漸層底（上方一抹色、往下漸隱到白），
// 其餘維持白底。用 LEVEL_THEME 的 glow（半透明球種色）疊在白底上，淡而不打架。
function profileBg(level) {
  const t = LEVEL_THEME[level] || LEVEL_THEME['精靈球']
  if (!GLOW_ALLOWED_LEVELS.includes(level)) return '#fff'
  return `linear-gradient(180deg, ${t.glow} 0%, rgba(255,255,255,0) 38%), #fff`
}

export default function LeaderboardSheet({ onClose, currentMemberId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // 點進去的會員
  const [showcaseCards, setShowcaseCards] = useState([])
  const [showcaseLoading, setShowcaseLoading] = useState(false)

  useEffect(() => { fetchLeaderboard() }, [])

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('members')
      .select('id, display_name, level, points, avatar_url, member_no, showcase_cards, created_at')
      .eq('is_hidden', false)
      .order('points', { ascending: false })
      .limit(50)
    setMembers(data || [])
    setLoading(false)
  }

  async function openProfile(member) {
    setSelected(member)
    setShowcaseCards([])
    if (!member.showcase_cards?.length) return
    setShowcaseLoading(true)
    const { data } = await supabase
      .from('card_owners')
      .select('id, cards(id, name, rarity, series, image_url)')
      .in('id', member.showcase_cards)
    // 保持順序
    const ordered = member.showcase_cards.map(coid => data?.find(d => d.id === coid) || null)
    setShowcaseCards(ordered)
    setShowcaseLoading(false)
  }

  const medalColor = (i) => {
    if (i === 0) return { bg: 'linear-gradient(135deg,#FFD700,#FFA500)', color: '#7A4A00' }
    if (i === 1) return { bg: 'linear-gradient(135deg,#C0C0C0,#A0A0A0)', color: '#444' }
    if (i === 2) return { bg: 'linear-gradient(135deg,#CD7F32,#A0522D)', color: '#fff' }
    return { bg: '#f5f0e8', color: '#999' }
  }

  const theme = selected ? levelTheme(selected.level) : null

  return (
    <>
      <style>{`
        @keyframes lbMemberCardGlow{0%,100%{box-shadow:0 6px 22px rgba(0,0,0,0.10)}50%{box-shadow:0 8px 30px var(--mc-glow)}}
        @keyframes lbPodiumBeam{0%,100%{opacity:0.85}50%{opacity:1}}
      `}</style>

      {/* 排行榜 Sheet */}
      <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
      <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="fa-solid fa-ranking-star" style={{ fontSize: 14, color: '#E07B00' }}></i>
          積分排行榜
        </div>
        <span onClick={onClose} style={{ fontSize: 20, color: '#ccc', cursor: 'pointer', lineHeight: 1 }}>✕</span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 14 }}>載入中...</div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 14 }}>尚無資料</div>
        ) : members.map((m, i) => {
          const medal = medalColor(i)
          const isMe = m.id === currentMemberId
          return (
            <div
              key={m.id}
              onClick={() => openProfile(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 20px',
                background: isMe ? 'linear-gradient(135deg,#FFF8EE,#FFFBF2)' : '#fff',
                borderBottom: '0.5px solid #f5f0e8',
                cursor: 'pointer',
                borderLeft: isMe ? '3px solid #E07B00' : '3px solid transparent',
              }}>
              {/* 名次 */}
              <div style={{ width: 28, height: 28, borderRadius: 8, background: medal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i === 0 ? <i className="fa-solid fa-trophy" style={{ fontSize: 12, color: '#7A4A00' }}></i>
                  : i === 1 ? <i className="fa-solid fa-medal" style={{ fontSize: 12, color: '#444' }}></i>
                  : i === 2 ? <i className="fa-solid fa-award" style={{ fontSize: 12, color: '#fff' }}></i>
                  : <span style={{ fontSize: 11, fontWeight: 700, color: medal.color }}>{i + 1}</span>}
              </div>

              {/* 頭像 */}
              {m.avatar_url
                ? <img src={m.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775', flexShrink: 0 }} />
                : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#633806', border: '1.5px solid #FAC775', flexShrink: 0 }}>
                    {m.display_name?.[0]?.toUpperCase()}
                  </div>
              }

              {/* 名稱 & 等級 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2D1A00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.display_name}</span>
                  {isMe && <span style={{ fontSize: 9, background: '#FFF3E0', color: '#E07B00', padding: '1px 6px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>我</span>}
                </div>
                <LevelBadge level={m.level} size='sm' />
              </div>

              {/* 積分 */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#E07B00' }}>{m.points?.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: '#bbb' }}>積分</div>
              </div>

              <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: '#ddd', flexShrink: 0 }}></i>
            </div>
          )
        })}
      </div>

      {/* 會員主頁 Sheet（疊在排行榜上） */}
      {selected && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
          <div style={{ padding: '12px 20px 10px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid #f0e8d0', background: '#f8f5f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-arrow-left" style={{ fontSize: 11, color: '#888' }}></i>
            </button>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2D1A00' }}>會員主頁</div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 32px', background: profileBg(selected.level) }}>
            {/* 會員資訊（等級主題卡） */}
            <div style={{ '--mc-glow': theme.glow, position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '16px 18px', background: theme.bg, border: `1.5px solid ${theme.border}`, marginBottom: 20, animation: 'lbMemberCardGlow 3.2s ease-in-out infinite' }}>
              <div style={{ position: 'absolute', top: -50, right: -40, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow} 0%, transparent 68%)`, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: -10, bottom: -18, opacity: theme.dark ? 0.16 : 0.10, transform: 'rotate(-8deg)', pointerEvents: 'none' }}>
                <PokeballIcon level={selected.level} size={92} />
              </div>

              {/* 頂部華麗球種標 */}
              <div style={{ position: 'relative', fontFamily: FONT_CINZEL, fontWeight: 600, fontSize: 10, letterSpacing: '0.26em', color: theme.accent, opacity: theme.dark ? 0.9 : 0.75, marginBottom: 12 }}>
                {levelEn(selected.level)}&nbsp;MEMBER
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.dark ? 'rgba(255,255,255,0.06)' : '#FAEEDA', boxShadow: `0 0 0 4px ${theme.glow}` }}>
                    {selected.avatar_url
                      ? <img src={selected.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 22, fontWeight: 700, color: theme.dark ? theme.name : '#633806' }}>{selected.display_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: theme.dark ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
                    <PokeballIcon level={selected.level} size={20} />
                  </div>
                </div>

                {/* 名稱 + 稱號 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: theme.name, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.display_name}</div>
                  {/* ── 稱號預留位（稱號系統未來填入；目前顯示等級膠囊） ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: theme.accent, background: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', border: `0.5px solid ${theme.accent}55`, borderRadius: 99, padding: '2px 9px 2px 6px' }}>
                      <PokeballIcon level={selected.level} size={14} />
                      {selected.level}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: theme.accent, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{selected.points?.toLocaleString()}</div>
                  <div style={{ fontFamily: FONT_CINZEL, fontSize: 9, letterSpacing: '0.15em', color: theme.sub, marginTop: 3 }}>POINTS</div>
                </div>
              </div>

              {/* 分隔線 + 華麗底列：編號 · 加入日期 */}
              <div style={{ position: 'relative', height: 1, background: theme.dark ? 'rgba(255,255,255,0.12)' : `${theme.accent}33`, margin: '13px 0 10px' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONT_CINZEL, fontWeight: 500, fontSize: 11, letterSpacing: '0.1em', color: theme.accent, opacity: theme.dark ? 0.95 : 0.85 }}>NO.&nbsp;{String(selected.member_no || '0').padStart(4, '0')}</span>
                <span style={{ fontFamily: FONT_PLAYFAIR, fontStyle: 'italic', fontSize: 12, color: theme.sub }}>since {new Date(selected.created_at).toLocaleDateString('zh-TW')}</span>
              </div>
            </div>

            {/* 展示卡 */}
            <div style={{ fontSize: 14, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ width: 26, height: 26, borderRadius: 10, background: 'linear-gradient(135deg,#BA7517,#EF9F27)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>
                <i className="fa-solid fa-id-card"></i>
              </span>
              展示卡
            </div>

            {showcaseLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13 }}>載入中...</div>
            ) : !selected.showcase_cards?.length ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#ccc', fontSize: 13 }}>
                <i className="fa-solid fa-id-card" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.3 }}></i>
                尚未設置展示卡
              </div>
            ) : canGlow(selected.level) ? (
              /* ── 黑金頒獎台（高級球以上，純展示） ── */
              <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2a2218 0%, #1a1510 45%, #0e0c0a 100%)', border: '1.5px solid #B8860B', padding: '20px 14px 16px', boxShadow: '0 6px 26px rgba(0,0,0,0.4)' }}>
                {/* 交叉掃射聚光燈 */}
                <div style={{ position: 'absolute', top: -6, left: '8%', width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle,#FFF6D8,#F5D060 60%,transparent)', boxShadow: '0 0 8px rgba(245,208,96,0.7)', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: '9%', width: 200, height: 230, background: 'linear-gradient(180deg,rgba(245,222,140,0.22) 0%,rgba(245,222,140,0.06) 50%,transparent 78%)', clipPath: 'polygon(0% 0%, 5% 0%, 70% 100%, 30% 100%)', animation: 'lbPodiumBeam 3.4s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: -6, right: '8%', width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle,#FFF6D8,#F5D060 60%,transparent)', boxShadow: '0 0 8px rgba(245,208,96,0.7)', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, right: '9%', width: 200, height: 230, background: 'linear-gradient(180deg,rgba(245,222,140,0.22) 0%,rgba(245,222,140,0.06) 50%,transparent 78%)', clipPath: 'polygon(95% 0%, 100% 0%, 70% 100%, 30% 100%)', animation: 'lbPodiumBeam 3.4s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: 'radial-gradient(circle,#FFFBEA,#F5D060 60%,transparent)', boxShadow: '0 0 12px rgba(255,240,190,0.8)', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 140, height: 215, background: 'linear-gradient(180deg,rgba(255,240,190,0.26) 0%,rgba(245,222,140,0.06) 55%,transparent 80%)', clipPath: 'polygon(40% 0%, 60% 0%, 90% 100%, 10% 100%)', animation: 'lbPodiumBeam 3.4s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />

                {/* 三張卡 + 金屬圓柱座｜正常文檔流 */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 7, zIndex: 2 }}>
                  {[
                    { idx: 0, w: '30%', cardW: '90%', base: 26, border: '1.5px solid #E0B868', cardGlow: 'none', topBg: 'linear-gradient(180deg,#f5f2ea,#cfcabd)', bodyBg: 'linear-gradient(90deg,#8a857a 0%,#d8d3c6 22%,#f2efe8 40%,#c8c3b6 60%,#9a958a 80%,#787469 100%)' },
                    { idx: 1, w: '34%', cardW: '92%', base: 42, border: '1.5px solid #F5D060', cardGlow: '0 0 16px rgba(245,208,96,0.3)', topBg: 'linear-gradient(180deg,#FDF0C0,#E8C75A)', bodyBg: 'linear-gradient(90deg,#9c7a1c 0%,#E8C75A 22%,#FDF0C0 40%,#D4A82A 60%,#a8801e 80%,#7a5c14 100%)' },
                    { idx: 2, w: '30%', cardW: '90%', base: 26, border: '1.5px solid #E0B868', cardGlow: 'none', topBg: 'linear-gradient(180deg,#f3cba8,#d08a58)', bodyBg: 'linear-gradient(90deg,#8a4f22 0%,#c47a40 22%,#f3cba8 40%,#bd7038 60%,#9a5a2a 80%,#723f1a 100%)' },
                  ].map(p => {
                    const slot = showcaseCards[p.idx]
                    const rc = slot?.cards ? (RARITY_COLORS[slot.cards.rarity] || RARITY_COLORS.Other) : null
                    return (
                      <div key={p.idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: p.w }}>
                        <div style={{ aspectRatio: '0.72', width: p.cardW, borderRadius: 5, overflow: 'hidden', background: slot?.cards ? '#1a1a1a' : 'rgba(255,255,255,0.05)', border: slot?.cards ? p.border : '1.5px dashed rgba(245,208,96,0.3)', boxShadow: slot?.cards ? `0 5px 12px rgba(0,0,0,0.6),${p.cardGlow}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          {slot?.cards?.image_url
                            ? <img src={slot.cards.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : slot
                              ? <i className="fa-solid fa-id-card" style={{ fontSize: 20, color: 'rgba(245,208,96,0.5)' }}></i>
                              : <i className="fa-solid fa-minus" style={{ fontSize: 12, color: 'rgba(245,208,96,0.4)' }}></i>
                          }
                          {slot?.cards && rc && (
                            <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 6, fontWeight: 700, padding: '1px 4px', borderRadius: 20, background: rc.bg, color: rc.color }}>{slot.cards.rarity}</span>
                          )}
                        </div>
                        {/* 金屬圓柱座 */}
                        <div style={{ position: 'relative', width: '100%', height: p.base, marginTop: 5 }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: p.idx === 1 ? 7 : 6, borderRadius: '50%', background: p.topBg, boxShadow: '0 1px 2px rgba(0,0,0,0.3)', zIndex: 2 }} />
                          <div style={{ position: 'absolute', top: 3, left: 0, right: 0, bottom: 0, borderRadius: '0 0 5px 5px', background: p.bodyBg }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* ── 原本卡格（精靈球／超級球）── 鎖死高度讓三張齊 ── */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, alignItems: 'start' }}>
                {[0,1,2].map(i => {
                  const slot = showcaseCards[i]
                  const rc = slot?.cards ? (RARITY_COLORS[slot.cards.rarity] || RARITY_COLORS.Other) : null
                  return (
                    <div key={i} style={{ minWidth: 0, maxWidth: '100%' }}>
                      <div style={{ aspectRatio: '3/4', width: '100%', borderRadius: 14, overflow: 'hidden', background: slot ? '#fff' : '#f5f0e8', border: slot ? 'none' : '2px dashed #F5E8C8', boxShadow: slot ? '0 4px 14px rgba(186,117,23,.12)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {slot?.cards?.image_url
                          ? <img src={slot.cards.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : slot
                            ? <i className="fa-solid fa-id-card" style={{ fontSize: 28, color: '#D4A94A', opacity: 0.4 }}></i>
                            : <i className="fa-solid fa-minus" style={{ fontSize: 14, color: '#D4A94A', opacity: 0.3 }}></i>
                        }
                        {slot?.cards && rc && (
                          <span style={{ position: 'absolute', top: 5, left: 5, fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 20, background: rc.bg, color: rc.color }}>{slot.cards.rarity}</span>
                        )}
                      </div>
                      {/* 文字區固定高度，避免長系列名把欄位撐高造成三張不齊 */}
                      <div style={{ marginTop: 5, height: 28, overflow: 'hidden' }}>
                        {slot?.cards && (
                          <>
                            <div style={{ fontSize: 9, color: '#7a5c2e', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{slot.cards.name}</div>
                            <div style={{ fontSize: 8, color: '#bbb', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{slot.cards.series}</div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

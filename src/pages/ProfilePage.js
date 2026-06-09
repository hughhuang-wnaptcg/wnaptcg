// ── ProfilePage.js 音效整合 ──────────────────────────────
// 在現有 import 區塊加入：
import { playSound, SoundToggle } from '../lib/sounds'

// ── 需要加入 playSound 的位置 ──────────────────────────

// 1. Tab 切換
// 位置：兩個 tabBtn 的 onClick
onClick={() => { setProfileTab('home'); playSound('tab_switch') }}
onClick={() => { setProfileTab('mine'); playSound('tab_switch') }}

// 2. 設定彈窗開啟
// 位置：齒輪按鈕的 onClick
onClick={() => { setEditName(member.display_name || ''); setShowSettings(true); playSound('modal_open') }}

// 3. 設定彈窗關閉
// 位置：取消按鈕和 backdrop 的 onClick
onClick={() => { setShowSettings(false); playSound('modal_close') }}

// 4. 暱稱儲存成功
// 位置：handleSaveName() 成功後
await supabase.from('members').update({ display_name: editName.trim() }).eq('id', member.id)
setMember({ ...member, display_name: editName.trim() })
playSound('checkin_success')  // ← 加入
setSaving(false)
setShowSettings(false)

// 5. 頭貼上傳成功
// 位置：handleAvatarUpload() 成功後
await supabase.from('members').update({ avatar_url: newUrl }).eq('id', member.id)
setMember({ ...member, avatar_url: newUrl })
playSound('shop_redeem_success')  // ← 加入

// ── SoundToggle 放在設定彈窗內 ────────────────────────
// 位置：設定彈窗（showSettings）內，登出按鈕之前加入：
<div style={{ height: '0.5px', background: '#f0e8d0', margin: '6px 0 14px' }} />

<SoundToggle />  {/* ← 加入這一行 */}

<div style={{ height: '0.5px', background: '#f0e8d0', margin: '14px 0' }} />

<button onClick={signOut} ...>登出</button>

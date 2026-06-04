// src/pages/HomePage.js
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, LEVELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'
import LeaderboardSheet from '../components/LeaderboardSheet'
import {
  playWeekCompleteSound, playMakeUpSound, playErrorSound,
  vibrate, VIBRATE,
} from '../lib/haptics'

const CDN = 'https://cdn.jsdelivr.net/gh/duiker101/pokemon-type-svg-icons@master/icons'

const TYPE_BY_WEEKDAY = {
  1: { type: 'water',    color: '#6890F0', name: '水',  label: '一' },
  2: { type: 'fire',     color: '#F08030', name: '火',  label: '二' },
  3: { type: 'grass',    color: '#78C850', name: '草',  label: '三' },
  4: { type: 'electric', color: '#F8D030', name: '電',  label: '四' },
  5: { type: 'psychic',  color: '#F85888', name: '超能', label: '五' },
  6: { type: 'fighting', color: '#C03028', name: '鬥',  label: '六' },
  0: { type: 'dragon',   color: '#7038F8', name: '龍',  label: '日' },
}

function usePullToRefresh(onRefresh) {
  const scrollRef = useRef(null)
  const startY = useRef(0)
  const pulling = useRef(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const THRESHOLD = 72

  const onTouchStart = useCallback((e) => {
    const el = scrollRef.current
    if (!el || el.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }, [])

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return
    const el = scrollRef.current
    if (!el || el.scrollTop > 0) { pulling.current = false; setPullDistance(0); return }
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) { e.preventDefault(); setPullDistance(Math.min(delta * 0.45, THRESHOLD + 20)) }
  }, [refreshing])

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true); setPullDistance(THRESHOLD)
      await onRefresh()
      setRefreshing(false)
    }
    setPullDistance(0)
  }, [pullDistance, onRefresh])

  return { scrollRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd, THRESHOLD }
}

const STATUS_COLOR = {
  pending:   { bg: '#FAEEDA', color: '#8B5A00' },
  completed: { bg: '#EAF3DE', color: '#173404' },
  cancelled: { bg: '#f5f5f5', color: '#999' },
}

export default function HomePage() {
  const { member, setMember, loginResult } = useAuth()
  const navigate = useNavigate()
  const [boss, setBoss] = useState(null)
  const [recentCards, setRecentCards] = useState([])
  const [liveItemCount, setLiveItemCount] = useState(0)
  const [weekLogins, setWeekLogins] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const [news, setNews] = useState(null)
  const [newsModal, setNewsModal] = useState(false)
  const [todayPoints, setTodayPoints] = useState(0)
  const [showWeekCelebration, setShowWeekCelebration] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const [shippingModal, setShippingModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [cannotOrderUntil, setCannotOrderUntil] = useState(null)
  const [shippingForm, setShippingForm] = useState({ store_name: '', recipient_name: '', phone: '', note: '' })
  const [shippingSaving, setShippingSaving] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const [makeUpModal, setMakeUpModal] = useState(null)
  const [makeUpSaving, setMakeUpSaving] = useState(false)
  const [makeUpError, setMakeUpError] = useState('')

  useEffect(() => {
    if (loginResult?.weekComplete) {
      setTimeout(() => {
        setShowWeekCelebration(true)
        playWeekCompleteSound()
        vibrate(VIBRATE.weekComplete)
        setTimeout(() => setShowWeekCelebration(false), 4000)
      }, 2800)
    }
  }, [loginResult])

  const fetchData = useCallback(async () => {
    const [{ data: bossData }, { data: cardsData }, { data: settingsData }, { count: liveCount }] = await Promise.all([
      supabase.from('boss_challenges').select('*').eq('is_active', true).single(),
      supabase.from('cards').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('settings').select('*'),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])
    setBoss(bossData)
    setRecentCards(cardsData || [])
    setLiveItemCount(liveCount || 0)
    if (settingsData) {
      const s = {}
      settingsData.forEach(d => { try { s[d.key] = JSON.parse(d.value) } catch(e) { s[d.key] = d.value } })
      if (s.announcement) setAnnouncement(s.announcement)
      if (s.news) setNews(s.news)
    }
    if (member) {
      const today = new Date().toISOString().split('T')[0]
      const { data: loginData } = await supabase.from('point_logs')
        .select('points').eq('member_id', member.id)
        .gte('created_at', today).in('type', ['login', 'streak_bonus'])
      setTodayPoints((loginData || []).reduce((s, l) => s + l.points, 0))
      await fetchWeekLogins(member.id)
      await fetchShippingStatus(member.id)
    }
  }, [member])

  async function fetchWeekLogins(memberId) {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const weekday = d.getDay()
      days.push({ date: dateStr, weekday })
    }
    const dateStrs = days.map(d => d.date)
    const { data: weekData } = await supabase.from('daily_logins')
      .select('login_date').eq('member_id', memberId).in('login_date', dateStrs)
    const loginDates = new Set((weekData || []).map(l => l.login_date))
    setWeekLogins(days.map(d => ({
      date: d.date, weekday: d.weekday,
      done: loginDates.has(d.date),
      typeConfig: TYPE_BY_WEEKDAY[d.weekday],
      isFuture: d.date > todayStr,
    })))
  }

  async function fetchShippingStatus(memberId) {
    const { data } = await supabase.from('shipping_orders')
      .select('*').eq('member_id', memberId)
      .order('created_at', { ascending: false }).limit(5)
    if (!data) return
    const pending = data.find(o => o.status === 'pending')
    setCurrentOrder(pending || null)
    const lastCancelled = data.find(o => o.status === 'cancelled' && o.cancelled_at)
    if (lastCancelled && !pending) {
      const unblockAt = new Date(new Date(lastCancelled.cancelled_at).getTime() + 7 * 24 * 60 * 60 * 1000)
      setCannotOrderUntil(unblockAt > new Date() ? unblockAt : null)
    } else {
      setCannotOrderUntil(null)
    }
    const lastOrder = data[0]
    if (lastOrder) {
      setShippingForm({ store_name: lastOrder.store_name || '', recipient_name: lastOrder.recipient_name || '', phone: lastOrder.phone || '', note: '' })
    }
  }

  useEffect(() => { fetchData() }, [fetchData])

  const { scrollRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd, THRESHOLD } = usePullToRefresh(fetchData)

  async function handleSubmitShipping() {
    if (!shippingForm.store_name.trim() || !shippingForm.recipient_name.trim() || !shippingForm.phone.trim()) {
      setShippingError('請填寫所有必填欄位'); return
    }
    setShippingSaving(true); setShippingError('')
    const { error } = await supabase.from('shipping_orders').insert({
      member_id: member.id, store_name: shippingForm.store_name.trim(),
      recipient_name: shippingForm.recipient_name.trim(), phone: shippingForm.phone.trim(),
      note: shippingForm.note.trim(), status: 'pending',
    })
    if (error) setShippingError('申請失敗，請稍後再試')
    else { setShippingModal(false); await fetchShippingStatus(member.id) }
    setShippingSaving(false)
  }

  async function handleCancelShipping() {
    if (!currentOrder) return
    setShippingSaving(true)
    await supabase.from('shipping_orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', currentOrder.id)
    setCancelModal(false); await fetchShippingStatus(member.id)
    setShippingSaving(false)
  }

  function openMakeUp(day) {
    const today = new Date().toISOString().split('T')[0]
    if (day.done || day.date >= today) return
    setMakeUpError(''); setMakeUpModal(day)
  }

  async function handleMakeUp() {
    if (!makeUpModal || !member) return
    if (member.points < 10) {
      setMakeUpError('積分不足 10 點，無法補簽'); playErrorSound(); vibrate(VIBRATE.error); return
    }
    setMakeUpSaving(true); setMakeUpError('')
    try {
      const { error: insertErr } = await supabase.from('daily_logins').insert({ member_id: member.id, login_date: makeUpModal.date })
      if (insertErr && !insertErr.message?.includes('duplicate')) throw insertErr
      const newPoints = member.points - 10
      const { getLevel } = await import('../lib/supabase')
      const newLevel = getLevel(newPoints)
      await supabase.from('members').update({ points: newPoints, level: newLevel }).eq('id', member.id)
      await supabase.from('point_logs').insert({ member_id: member.id, type: 'makeup', points: -10, note: 補簽 ${makeUpModal.date} })
      setMember({ ...member, points: newPoints, level: newLevel })
      playMakeUpSound(); vibrate(VIBRATE.makeUp)
      setMakeUpModal(null); await fetchWeekLogins(member.id)
    } catch { setMakeUpError('補簽失敗，請稍後再試') }
    setMakeUpSaving(false)
  }

  const bossProgress = boss ? Math.round((boss.current_amount / boss.target_amount) * 100) : 0
  const today = new Date().toIS

import React, { useEffect, useRef, useState } from 'react'
import { supabase, LEVELS, getNextLevel, RARITY_COLORS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'

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
const GRADING_STATUS = {
  submitted: { label: '已送出', color: '#E07B00', bg: '#FFF3E0' },
  grading:   { label: '鑑定中', color: '#1976D2', bg: '#E3F2FD' },
  returned:  { label: '已取回', color: '#388E3C', bg: '#E8F5E9' },
  sold:      { label: '已售出', color: '#757575', bg: '#F5F5F5' },
}

export default function ProfilePage() {
  const { member, setMember, signOut } = useAuth()
  const [profileTab, setProfileTab] = useState('home') // 'home' | 'mine'
  const [logs, setLogs] = useState([])
  const [weekLogins, setWeekLogins] = useState([])
  const [shippingOrders, setShippingOrders] = useState([])
  const [gradings, setGradings] = useState([])
  const [myCards, setMyCards] = useState([]) // 持有卡片，供選展示用
  const [showcaseCards, setShowcaseCards] = useState([]) // 展示卡詳情
  const [showSettings, setShowSettings] = useState(false)
  const [showBenefits, setShowBenefits] = useState(false)
  const [showShipping, setShowShipping] = useState(false)
  const [showGrading, setShowGrading] = useState(false)
  const [showCardPicker, setShowCardPicker] = useState(null) // slot index 0~2
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [defaultAvatars, setDefaultAvatars] = useState([])
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const avatarFileRef = useRef()

  useEffect(() => { if (member) fetchData() }, [member])

  async function fetchData() {
    const { data: logData } = await supabase.from('point_logs')
      .select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(15)
    setLogs(logData || [])

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
      days.push({ date: dateStr, weekday: d.getDay(), isFuture: dateStr > todayStr })
    }
    const { data: loginData } = await supabase.from('daily_logins')
      .select('login_date').eq('member_id', member.id).in('login_date', days.map(d => d.date))
    const loginDates = new Set((loginData || []).map(l => l.login_date))
    setWeekLogins(days.map(d => ({
      ...d, done: loginDates.has(d.date), typeConfig: TYPE_BY_WEEKDAY[d.weekday],
    })))

    const { data: shippingData } = await supabase.from('shipping_orders')
      .select('*').eq('member_id', member.id).order('created_at', { ascending: false })
    setShippingOrders(shippingData || [])

    const { data: gradingData } = await supabase.from('grading_submissions')
      .select('*').eq('member_id', member.id).order('created_at', { ascending: false })
    setGradings(gradingData || [])

    const { data: avatarSetting } = await supabase.from('settings')
      .select('value').eq('key', 'default_avatars').maybeSingle()
    if (avatarSetting?.value) {
      try { setDefaultAvatars(JSON.parse(avatarSetting.value) || []) } catch (e) { setDefaultAvatars([]) }
    }

    // 持有卡片
    const { data: ownedData } = await supabase.from('card_owners')
      .select('id, card_id, cards(id, name, rarity, series, image_url)')
      .eq('member_id', member.id)
    setMyCards(ownedData || [])

    // 展示卡
    await fetchShowcase(member.showcase_cards || [])
  }

  async function fetchShowcase(cardOwnerIds) {
    if (!cardOwnerIds || cardOwnerIds.length === 0) { setShowcaseCards([]); return }
    const { data } = await supabase.from('card_owners')
      .select('id, card_id, cards(id, name, rarity, series, image_url)')
      .in('id', cardOwnerIds)

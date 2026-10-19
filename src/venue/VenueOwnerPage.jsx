import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config.js'
import '../admin/admin.css'
import '../admin/hq.css'
import './venue-owner.css'

// A venue owner's private page (hcm.thealetrail.app/venue/<token>). Read-only, no login.
// Shows that venue's own numbers from GET /api/venue/<token>: customers only, no personal details.
// Labels are English with Vietnamese underneath. Looks like the venue dashboard (.hq-theme).

function Label({ en, vi }) {
  return (
    <div className="admin-kpi-label vo-label">
      <span>{en}</span>
      <span className="vo-vi" lang="vi">{vi}</span>
    </div>
  )
}

function Stat({ en, vi, value, tone }) {
  return (
    <div className="admin-kpi-card vo-stat">
      <Label en={en} vi={vi} />
      <div className={`admin-kpi-value ${tone || ''}`}>{value}</div>
    </div>
  )
}

export default function VenueOwnerPage({ token }) {
  const [state, setState] = useState({ loading: true })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Private link: keep it out of search engines, and follow the phone's light/dark setting.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    return () => meta.remove()
  }, [])

  useEffect(() => {
    let alive = true
    fetch(`${API_BASE}/venue/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }))
      .then(({ status, body }) => {
        if (!alive) return
        if (status === 200 && body.ok) setState({ data: body })
        else setState({ error: status === 404 ? 'notfound' : 'failed' })
      })
      .catch(() => alive && setState({ error: 'failed' }))
    return () => { alive = false }
  }, [token])

  useEffect(() => {
    if (state.data?.venue?.name) document.title = `${state.data.venue.name} · Ale Trail`
  }, [state.data])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.data.groupUpdate)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked: the text is still selectable */ }
  }

  if (state.loading) {
    return <div className="admin-app hq-theme vo-page"><div className="admin-loading"><div className="admin-spinner" /></div></div>
  }
  if (state.error) {
    return (
      <div className="admin-app hq-theme vo-page">
        <div className="vo-wrap">
          <div className="admin-card vo-message">
            {state.error === 'notfound' ? (
              <>
                <h1 className="vo-title">This link doesn't work</h1>
                <p className="vo-vi" lang="vi">Đường dẫn này không còn hiệu lực</p>
                <p className="vo-muted">Ask the Ale Trail team for your venue's current link.<br /><span lang="vi">Vui lòng liên hệ đội Ale Trail để nhận đường dẫn mới của quán.</span></p>
              </>
            ) : (
              <>
                <h1 className="vo-title">Couldn't load your numbers</h1>
                <p className="vo-vi" lang="vi">Chưa tải được số liệu</p>
                <button className="admin-btn admin-btn-primary" onClick={() => window.location.reload()}>Try again · Thử lại</button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const d = state.data
  const updated = new Date(`${d.day}T12:00:00+07:00`)
  const enDay = updated.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Ho_Chi_Minh' })

  return (
    <div className="admin-app hq-theme vo-page">
      <div className="vo-wrap">
        <header className="vo-head">
          <div className="vo-eyebrow">Ho Chi Minh Ale Trail</div>
          <h1 className="vo-title">{d.venue.name}</h1>
          <div className="vo-muted">Your venue's numbers · {enDay}<br /><span lang="vi">Số liệu của quán bạn</span></div>
        </header>

        {d.highlight && (
          <div className="vo-highlight">
            <span className="vo-highlight-icon" aria-hidden="true">🏆</span>
            <div>
              <div className="vo-highlight-en">{d.highlight.en}</div>
              <div className="vo-vi" lang="vi">{d.highlight.vi}</div>
            </div>
          </div>
        )}

        <section aria-label="Stamps">
          <h2 className="vo-section">Stamps at your venue <span className="vo-vi" lang="vi">Lượt đóng dấu tại quán</span></h2>
          <div className="vo-grid3">
            <Stat en="Yesterday" vi="Hôm qua" value={d.stamps.yesterday} tone="primary" />
            <Stat en="This week" vi="Tuần này" value={d.stamps.week} />
            <Stat en="Total" vi="Tổng" value={d.stamps.total} />
          </div>
        </section>

        <section aria-label="Trail and hats">
          <div className="vo-grid2">
            <Stat en="New trail sign-ups this week" vi="Đăng ký mới tuần này (toàn hành trình)" value={d.trailSignupsWeek} />
            <Stat en="Hats claimed here" vi="Mũ đã trao tại quán" value={d.hats.claimedHere} tone="success" />
            <Stat en="Hats left at your venue" vi="Mũ còn lại tại quán" value={d.hats.left} />
          </div>
        </section>

        <section className="admin-card vo-update" aria-label="Group update">
          <div className="vo-update-head">
            <h2 className="vo-section vo-section-flat">Trail update <span className="vo-vi" lang="vi">Cập nhật hành trình</span></h2>
            <button className="admin-btn admin-btn-primary admin-btn-small" onClick={copy}>{copied ? 'Copied · Đã chép' : 'Copy · Sao chép'}</button>
          </div>
          <pre className="vo-update-text">{d.groupUpdate}</pre>
        </section>

        <p className="vo-foot vo-muted">
          Customers only: staff and test accounts are not counted. Private link, please don't share it publicly.
          <br /><span lang="vi">Chỉ tính khách thật, không tính nhân viên và tài khoản thử. Đây là đường dẫn riêng, vui lòng không chia sẻ công khai.</span>
        </p>
      </div>
    </div>
  )
}

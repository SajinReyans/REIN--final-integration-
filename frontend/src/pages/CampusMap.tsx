import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildings, statusColor } from '../data';
import type { Building } from '../data';

function MiniStat({ label, val, unit }: { label: string; val: string | number; unit: string }) {
  return (
    <div style={{ background: 'var(--surface-alt)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{val}{unit}</div>
    </div>
  );
}

function BuildingDetailCard({ b, onClose }: { b: Building; onClose: () => void }) {
  const col = statusColor(b.status);
  const badgeClass = b.status === 'good' ? 'good' : b.status === 'warn' ? 'warn' : 'bad';
  const badgeLabel = b.status === 'good' ? 'Healthy' : b.status === 'warn' ? 'Caution' : 'Critical';

  return (
    <motion.div
      className="card card-flush"
      role="dialog"
      aria-modal="true"
      aria-label={b.name}
      initial={{ opacity: 0, scale: 0.86, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 16 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.12 }}
      style={{
        width: 'min(400px, calc(100% - 32px))',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(15, 23, 42, 0.28)',
        position: 'relative',
        zIndex: 2,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          height: 110,
          background: `linear-gradient(160deg,${col}33,${col}0d)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={1.5}>
          <path d="M4 21V7l8-4 8 4v14" />
          <path d="M9 21v-6h6v6" />
        </svg>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close building details"
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--ink-soft)',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: 'var(--card-pad)' }}>
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', paddingRight: 10 }}>{b.name}</div>
          <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="flex-between" style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 5 }}>
            <span>Health Score</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: col }}>{b.health}/100</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'var(--border)' }}>
            <div style={{ height: '100%', borderRadius: 6, width: `${b.health}%`, background: col, transition: 'width .4s' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MiniStat label="AQI" val={b.aqi} unit="" />
          <MiniStat label="Temperature" val={b.temp.toFixed(1)} unit="°C" />
          <MiniStat label="Humidity" val={b.hum} unit="%" />
          <MiniStat label="Noise" val={b.noise} unit=" dB" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8, fontSize: 12.5, color: 'var(--ink-soft)' }}>
          <div>Sensors: <b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{8 + (b.id.charCodeAt(0) % 4)}</b></div>
          <div>Active: <b style={{ color: 'var(--green-deep)', fontFamily: 'var(--font-mono)' }}>{6 + (b.id.charCodeAt(0) % 3)}</b></div>
          <div>Offline: <b style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{b.status === 'bad' ? 2 : b.status === 'warn' ? 1 : 0}</b></div>
          <div>Updated: <b style={{ fontFamily: 'var(--font-mono)' }}>2m ago</b></div>
        </div>
      </div>
    </motion.div>
  );
}

export const CampusMap: React.FC = () => {
  const [selected, setSelected] = useState<Building | null>(null);

  const close = () => setSelected(null);

  return (
    <div className="page-anim">
      <div className="flex-between mb-14">
        <div>
          <div className="section-title">Campus Map</div>
          <div className="section-sub" style={{ marginBottom: 0 }}>Live building-level environmental status</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span className="tag-row" style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}><span className="pulse-node on" />Healthy</span>
          <span className="tag-row" style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}><span className="pulse-node warn" />Caution</span>
          <span className="tag-row" style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}><span className="pulse-node off" />Critical</span>
        </div>
      </div>

      <div className="card card-flush" style={{ overflow: 'hidden', position: 'relative' }}>
        <motion.div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3/2',
            transformOrigin: selected ? `${selected.x}% ${selected.y}%` : '50% 50%',
          }}
          animate={{
            scale: selected ? 1.55 : 1,
            x: selected ? `${(50 - selected.x) * 0.35}%` : '0%',
            y: selected ? `${(50 - selected.y) * 0.35}%` : '0%',
          }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        >
          <img
            src="/campus-map.jpg"
            alt="Campus aerial"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: selected ? 'blur(6px) brightness(0.78)' : 'none',
              transition: 'filter 0.35s ease',
            }}
            draggable={false}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg,rgba(15,36,57,.04),rgba(15,36,57,.15) 85%)',
              pointerEvents: 'none',
            }}
          />

          {buildings.map((b) => {
            const col = statusColor(b.status);
            const nodeClass = b.status === 'good' ? 'on' : b.status === 'warn' ? 'warn' : 'off';
            const isActive = selected?.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelected((prev) => (prev?.id === b.id ? null : b))}
                title={b.name}
                style={{
                  position: 'absolute',
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  transform: `translate(-50%,-50%)${isActive ? ' scale(1.15)' : ''}`,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'transform .2s',
                  zIndex: isActive ? 3 : 1,
                  opacity: selected && !isActive ? 0.35 : 1,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: col + '30',
                    backdropFilter: 'blur(2px)',
                    border: `2px solid ${col}`,
                    outline: isActive ? `3px solid ${col}` : 'none',
                    outlineOffset: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,.35)',
                    position: 'relative',
                  }}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2}>
                    <path d="M4 21V7l8-4 8 4v14" />
                    <path d="M9 21v-6h6v6" />
                    <path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
                  </svg>
                  <span className={`pulse-node ${nodeClass}`} style={{ position: 'absolute', top: -3, right: -3 }} />
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    marginTop: 5,
                    background: 'rgba(255,255,255,.95)',
                    color: 'var(--ink)',
                    padding: '2px 8px',
                    borderRadius: 8,
                    boxShadow: '0 2px 6px rgba(0,0,0,.2)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.name}
                </div>
              </button>
            );
          })}

          {!selected && (
            <div
              style={{
                position: 'absolute',
                bottom: 18,
                left: 18,
                background: 'rgba(255,255,255,.92)',
                backdropFilter: 'blur(6px)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 12,
                color: 'var(--ink-soft)',
              }}
            >
              Live aerial view of REC campus · click a marker for building readings
            </div>
          )}
        </motion.div>

        {/* Blur overlay + centered detail card */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              onClick={close}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.28)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                cursor: 'pointer',
              }}
            >
              <BuildingDetailCard b={selected} onClose={close} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

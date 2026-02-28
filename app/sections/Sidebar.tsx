'use client'

import React from 'react'
import { FiPhone, FiShoppingBag, FiPhoneCall, FiSettings, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { cn } from '@/lib/utils'

type ActiveSection = 'orders' | 'calls' | 'settings'

interface SidebarProps {
  activeSection: ActiveSection
  onSectionChange: (section: ActiveSection) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isCallActive: boolean
}

const navItems: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
  { id: 'orders', label: 'Orders', icon: <FiShoppingBag className="w-5 h-5" /> },
  { id: 'calls', label: 'Call History', icon: <FiPhoneCall className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
]

export default function Sidebar({ activeSection, onSectionChange, isCollapsed, onToggleCollapse, isCallActive }: SidebarProps) {
  return (
    <aside
      className={cn(
        "h-screen flex flex-col border-r border-border/50 transition-all duration-300 relative",
        isCollapsed ? "w-[72px]" : "w-[240px]"
      )}
      style={{
        background: 'hsl(350 28% 95% / 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255,255,255,0.18)',
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border/30">
        <div className="w-9 h-9 rounded-[0.875rem] bg-primary flex items-center justify-center flex-shrink-0">
          <FiPhone className="w-4 h-4 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <h1 className="font-semibold text-sm tracking-[-0.01em] text-foreground truncate">Voice Receptionist</h1>
            <p className="text-xs text-muted-foreground leading-[1.55]">AI Phone Agent</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-[0.875rem] text-sm font-medium transition-all duration-200",
              activeSection === item.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {item.icon}
            {!isCollapsed && <span className="tracking-[-0.01em]">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-border/30">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full flex-shrink-0",
            isCallActive ? "bg-green-500 animate-pulse" : "bg-green-500"
          )} />
          {!isCollapsed && (
            <span className="text-xs font-medium text-muted-foreground tracking-[-0.01em]">
              {isCallActive ? 'On Call' : 'Agent Active'}
            </span>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
      >
        {isCollapsed ? <FiChevronRight className="w-3 h-3" /> : <FiChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}

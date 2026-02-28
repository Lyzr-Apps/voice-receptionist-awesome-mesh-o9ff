'use client'

import React, { useState, useCallback } from 'react'
import { FiPhone, FiActivity } from 'react-icons/fi'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import Sidebar from './sections/Sidebar'
import OrdersDashboard from './sections/OrdersDashboard'
import CallHistory from './sections/CallHistory'
import SettingsPage from './sections/SettingsPage'
import VoiceAgent from './sections/VoiceAgent'
import type { Order } from './sections/OrdersDashboard'
import type { CallRecord } from './sections/CallHistory'
import type { ProductItem } from './sections/SettingsPage'
import type { TranscriptEntry } from './sections/VoiceAgent'

// ---- Error Boundary ----
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ---- Initial Data (loaded into state so mutations work) ----
function getInitialOrders(): Order[] {
  return [
    { id: 'ORD-001', phone: '+1 (555) 123-4567', items: [{ name: 'Margherita Pizza', qty: 2, price: 14.99 }, { name: 'Caesar Salad', qty: 1, price: 8.99 }], total: 38.97, status: 'completed', timestamp: new Date('2026-02-28T10:30:00') },
    { id: 'ORD-002', phone: '+1 (555) 234-5678', items: [{ name: 'Pasta Carbonara', qty: 1, price: 16.99 }, { name: 'Garlic Bread', qty: 2, price: 5.99 }], total: 28.97, status: 'in_progress', timestamp: new Date('2026-02-28T11:15:00') },
    { id: 'ORD-003', phone: '+1 (555) 345-6789', items: [{ name: 'Grilled Salmon', qty: 1, price: 22.99 }, { name: 'House Salad', qty: 1, price: 7.99 }, { name: 'Lemonade', qty: 2, price: 3.99 }], total: 38.96, status: 'new', timestamp: new Date('2026-02-28T12:00:00') },
    { id: 'ORD-004', phone: '+1 (555) 456-7890', items: [{ name: 'BBQ Chicken Wings', qty: 3, price: 12.99 }], total: 38.97, status: 'completed', timestamp: new Date('2026-02-28T09:45:00') },
    { id: 'ORD-005', phone: '+1 (555) 567-8901', items: [{ name: 'Veggie Burger', qty: 2, price: 13.99 }, { name: 'Sweet Potato Fries', qty: 2, price: 6.99 }], total: 41.96, status: 'new', timestamp: new Date('2026-02-28T13:20:00') },
  ]
}

function getInitialCalls(): CallRecord[] {
  return [
    {
      id: 'CALL-001', phone: '+1 (555) 123-4567', duration: '3:42', date: new Date('2026-02-28T10:30:00'), starred: false,
      transcript: [
        { role: 'agent', text: 'Hi, thanks for calling! What can I get started for you today?', time: '0:00' },
        { role: 'user', text: 'Hi, I would like to order two Margherita pizzas and a Caesar salad.', time: '0:05' },
        { role: 'agent', text: 'Great choices! That will be two Margherita pizzas at $14.99 each and one Caesar salad at $8.99. Your total comes to $38.97. Can I confirm that order for you?', time: '0:12' },
        { role: 'user', text: 'Yes, that sounds right. How long will it take?', time: '0:22' },
        { role: 'agent', text: 'Your order should be ready in about 25-30 minutes. Is there anything else I can help you with?', time: '0:28' },
        { role: 'user', text: 'No, that is all. Thank you!', time: '0:35' },
        { role: 'agent', text: 'Thank you for your order! Have a wonderful day!', time: '0:38' },
      ],
      orderSummary: { items: [{ name: 'Margherita Pizza', qty: 2, price: 14.99 }, { name: 'Caesar Salad', qty: 1, price: 8.99 }], total: 38.97 },
    },
    {
      id: 'CALL-002', phone: '+1 (555) 234-5678', duration: '2:15', date: new Date('2026-02-28T11:15:00'), starred: true,
      transcript: [
        { role: 'agent', text: 'Hello! Welcome to our restaurant. How may I assist you today?', time: '0:00' },
        { role: 'user', text: 'I would like one Pasta Carbonara and two orders of Garlic Bread please.', time: '0:06' },
        { role: 'agent', text: 'One Pasta Carbonara at $16.99 and two Garlic Breads at $5.99 each. Total of $28.97. Shall I place that order?', time: '0:14' },
        { role: 'user', text: 'Yes please.', time: '0:22' },
        { role: 'agent', text: 'Order placed! It will be ready in about 20 minutes. Thank you for calling!', time: '0:25' },
      ],
      orderSummary: { items: [{ name: 'Pasta Carbonara', qty: 1, price: 16.99 }, { name: 'Garlic Bread', qty: 2, price: 5.99 }], total: 28.97 },
    },
    {
      id: 'CALL-003', phone: '+1 (555) 345-6789', duration: '4:10', date: new Date('2026-02-28T12:00:00'), starred: false,
      transcript: [
        { role: 'agent', text: 'Hi there! Thank you for calling. What would you like to order?', time: '0:00' },
        { role: 'user', text: 'What do you recommend for lunch?', time: '0:05' },
        { role: 'agent', text: 'Our Grilled Salmon is very popular and pairs wonderfully with our House Salad. We also have fresh lemonade!', time: '0:10' },
        { role: 'user', text: 'That sounds perfect. I will take one Grilled Salmon, one House Salad, and two lemonades.', time: '0:20' },
        { role: 'agent', text: 'Excellent! One Grilled Salmon at $22.99, one House Salad at $7.99, and two Lemonades at $3.99 each. Your total is $38.96. Confirmed?', time: '0:28' },
        { role: 'user', text: 'Yes, confirmed.', time: '0:38' },
        { role: 'agent', text: 'Your order is confirmed! It will be ready in approximately 30 minutes. Have a great day!', time: '0:42' },
      ],
      orderSummary: { items: [{ name: 'Grilled Salmon', qty: 1, price: 22.99 }, { name: 'House Salad', qty: 1, price: 7.99 }, { name: 'Lemonade', qty: 2, price: 3.99 }], total: 38.96 },
    },
    {
      id: 'CALL-004', phone: '+1 (555) 456-7890', duration: '1:50', date: new Date('2026-02-28T09:45:00'), starred: false,
      transcript: [
        { role: 'agent', text: 'Good morning! What can I get for you today?', time: '0:00' },
        { role: 'user', text: 'Three orders of BBQ Chicken Wings, please.', time: '0:04' },
        { role: 'agent', text: 'Three BBQ Chicken Wings at $12.99 each, total of $38.97. Should I confirm?', time: '0:10' },
        { role: 'user', text: 'Yes, go ahead!', time: '0:15' },
        { role: 'agent', text: 'Done! Ready in 15 minutes. Thanks for calling!', time: '0:18' },
      ],
      orderSummary: { items: [{ name: 'BBQ Chicken Wings', qty: 3, price: 12.99 }], total: 38.97 },
    },
    {
      id: 'CALL-005', phone: '+1 (555) 567-8901', duration: '2:55', date: new Date('2026-02-28T13:20:00'), starred: true,
      transcript: [
        { role: 'agent', text: 'Hi! Thanks for calling. How can I help you?', time: '0:00' },
        { role: 'user', text: 'I am looking for vegetarian options. What do you have?', time: '0:05' },
        { role: 'agent', text: 'We have a delicious Veggie Burger and Sweet Potato Fries that are both vegetarian-friendly!', time: '0:10' },
        { role: 'user', text: 'Great, I will take two of each.', time: '0:18' },
        { role: 'agent', text: 'Two Veggie Burgers at $13.99 each and two Sweet Potato Fries at $6.99 each. Total is $41.96. Order confirmed?', time: '0:24' },
        { role: 'user', text: 'Confirmed, thank you.', time: '0:30' },
        { role: 'agent', text: 'Your order has been placed! Enjoy your meal!', time: '0:33' },
      ],
      orderSummary: { items: [{ name: 'Veggie Burger', qty: 2, price: 13.99 }, { name: 'Sweet Potato Fries', qty: 2, price: 6.99 }], total: 41.96 },
    },
  ]
}

function getInitialProducts(): ProductItem[] {
  return [
    { id: 'P001', name: 'Margherita Pizza', price: 14.99, description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil', available: true },
    { id: 'P002', name: 'Pasta Carbonara', price: 16.99, description: 'Creamy pasta with pancetta, egg, and parmesan cheese', available: true },
    { id: 'P003', name: 'Grilled Salmon', price: 22.99, description: 'Fresh Atlantic salmon with lemon butter sauce', available: true },
    { id: 'P004', name: 'Caesar Salad', price: 8.99, description: 'Crispy romaine with classic Caesar dressing and croutons', available: true },
    { id: 'P005', name: 'BBQ Chicken Wings', price: 12.99, description: 'Smoky BBQ glazed chicken wings with ranch dip', available: true },
    { id: 'P006', name: 'Veggie Burger', price: 13.99, description: 'Plant-based patty with fresh toppings on brioche bun', available: true },
    { id: 'P007', name: 'Garlic Bread', price: 5.99, description: 'Toasted bread with garlic butter and herbs', available: true },
    { id: 'P008', name: 'House Salad', price: 7.99, description: 'Mixed greens with seasonal vegetables and vinaigrette', available: true },
    { id: 'P009', name: 'Sweet Potato Fries', price: 6.99, description: 'Crispy sweet potato fries with chipotle mayo', available: true },
    { id: 'P010', name: 'Lemonade', price: 3.99, description: 'Freshly squeezed lemonade with a hint of mint', available: true },
  ]
}

// ---- Main Page ----
type ActiveSection = 'orders' | 'calls' | 'settings'

export default function Page() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('orders')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showVoiceWidget, setShowVoiceWidget] = useState(true)
  const [isCallActive, setIsCallActive] = useState(false)

  // All data lives in state so mutations (status change, star toggle) work on every item
  const [orders, setOrders] = useState<Order[]>(getInitialOrders)
  const [calls, setCalls] = useState<CallRecord[]>(getInitialCalls)
  const [products, setProducts] = useState<ProductItem[]>(getInitialProducts)

  const handleStatusChange = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const safeArr = Array.isArray(prev) ? prev : []
      return safeArr.map(o => o.id === orderId ? { ...o, status } : o)
    })
  }, [])

  const handleToggleStar = useCallback((callId: string) => {
    setCalls(prev => {
      const safeArr = Array.isArray(prev) ? prev : []
      return safeArr.map(c => c.id === callId ? { ...c, starred: !c.starred } : c)
    })
  }, [])

  const handleCallEnd = useCallback((transcript: TranscriptEntry[]) => {
    if (!Array.isArray(transcript) || transcript.length === 0) return

    setOrders(prev => {
      const safeArr = Array.isArray(prev) ? prev : []
      const orderId = `ORD-${String(safeArr.length + 1).padStart(3, '0')}`
      const newOrder: Order = {
        id: orderId,
        phone: 'Voice Caller',
        items: [{ name: 'Voice Order', qty: 1, price: 0 }],
        total: 0,
        status: 'new',
        timestamp: new Date(),
      }
      return [newOrder, ...safeArr]
    })

    setCalls(prev => {
      const safeArr = Array.isArray(prev) ? prev : []
      const callId = `CALL-${String(safeArr.length + 1).padStart(3, '0')}`
      const newCall: CallRecord = {
        id: callId,
        phone: 'Voice Caller',
        duration: '0:00',
        date: new Date(),
        starred: false,
        transcript: transcript.map((t, i) => ({
          role: t.role,
          text: t.text,
          time: `${Math.floor(i * 5 / 60)}:${String((i * 5) % 60).padStart(2, '0')}`,
        })),
      }
      return [newCall, ...safeArr]
    })
  }, [])

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          isCallActive={isCallActive}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-h-screen">
          {/* Top bar */}
          <header
            className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between border-b border-border/30"
            style={{
              background: 'hsl(350 35% 97% / 0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-[-0.01em]">
                {activeSection === 'orders' && 'Orders'}
                {activeSection === 'calls' && 'Call History'}
                {activeSection === 'settings' && 'Settings'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowVoiceWidget(prev => !prev)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  isCallActive
                    ? "bg-green-100 text-green-700"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                )}
              >
                <FiPhone className="w-3.5 h-3.5" />
                {isCallActive ? 'On Call' : 'Voice Agent'}
              </button>
            </div>
          </header>

          {/* Content area */}
          <div className="p-6">
            {activeSection === 'orders' && (
              <OrdersDashboard
                orders={orders}
                onStatusChange={handleStatusChange}
                isCallActive={isCallActive}
              />
            )}
            {activeSection === 'calls' && (
              <CallHistory
                calls={calls}
                onToggleStar={handleToggleStar}
              />
            )}
            {activeSection === 'settings' && (
              <SettingsPage
                products={products}
                onProductUpdate={setProducts}
              />
            )}
          </div>

          {/* Agent info footer */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-4 p-3 rounded-[0.875rem] bg-muted/30 border border-border/30">
              <FiActivity className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground">Voice Receptionist Agent</span>
                <span className="text-xs text-muted-foreground ml-2">ID: 69a27a68d56a3c78b8262a31</span>
              </div>
              <Badge variant={isCallActive ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                {isCallActive ? 'Active' : 'Idle'}
              </Badge>
            </div>
          </div>
        </main>

        {/* Voice Agent floating widget */}
        {showVoiceWidget && (
          <div className="fixed bottom-6 right-6 z-50 w-[340px]">
            <VoiceAgent
              onCallEnd={handleCallEnd}
              isCallActive={isCallActive}
              setIsCallActive={setIsCallActive}
            />
          </div>
        )}
      </div>
    </PageErrorBoundary>
  )
}

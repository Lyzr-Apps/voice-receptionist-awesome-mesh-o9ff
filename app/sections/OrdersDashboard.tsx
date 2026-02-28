'use client'

import React, { useState } from 'react'
import { FiShoppingBag, FiDollarSign, FiTrendingUp, FiPhoneIncoming, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  phone: string
  items: OrderItem[]
  total: number
  status: 'new' | 'in_progress' | 'completed'
  timestamp: Date
}

interface OrdersDashboardProps {
  orders: Order[]
  onStatusChange: (orderId: string, status: Order['status']) => void
  isCallActive: boolean
}

const statusStyles: Record<Order['status'], string> = {
  new: 'bg-primary/15 text-primary border-primary/30',
  in_progress: 'bg-accent/15 text-accent border-accent/30',
  completed: 'bg-green-100 text-green-700 border-green-300',
}

const statusLabels: Record<Order['status'], string> = {
  new: 'New',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function OrdersDashboard({ orders, onStatusChange, isCallActive }: OrdersDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const safeOrders = Array.isArray(orders) ? orders : []

  const filteredOrders = statusFilter === 'all'
    ? safeOrders
    : safeOrders.filter(o => o.status === statusFilter)

  const todayOrders = safeOrders.length
  const totalRevenue = safeOrders.reduce((sum, o) => sum + (o?.total ?? 0), 0)
  const avgOrderValue = todayOrders > 0 ? totalRevenue / todayOrders : 0

  const stats = [
    { label: "Today's Orders", value: todayOrders.toString(), icon: <FiShoppingBag className="w-5 h-5" />, color: 'text-primary' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <FiDollarSign className="w-5 h-5" />, color: 'text-accent' },
    { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}`, icon: <FiTrendingUp className="w-5 h-5" />, color: 'text-primary' },
    { label: 'Active Call', value: isCallActive ? 'Yes' : 'No', icon: <FiPhoneIncoming className="w-5 h-5" />, color: isCallActive ? 'text-green-600' : 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.01em]">Orders Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-[1.55]">Manage incoming orders and track performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border border-border/50 bg-card/75 backdrop-blur-[16px] shadow-md" style={{ borderRadius: '0.875rem' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground tracking-[-0.01em]">{stat.label}</span>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold tracking-[-0.01em]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="border border-border/50 bg-card/75 backdrop-blur-[16px] shadow-md" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg font-semibold tracking-[-0.01em]">Recent Orders</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9 rounded-[0.875rem]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No orders found. Incoming calls will generate orders here.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filteredOrders.map((order) => (
                  <div key={order.id}>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="w-full px-6 py-3.5 flex items-center gap-4 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-primary w-24 flex-shrink-0">{order.id}</span>
                      <span className="text-sm text-foreground flex-1 min-w-0 truncate">{order?.phone ?? 'Unknown'}</span>
                      <span className="text-sm text-muted-foreground hidden md:block w-40">
                        {Array.isArray(order?.items) ? order.items.map(i => `${i?.qty ?? 1}x ${i?.name ?? ''}`).join(', ') : 'No items'}
                      </span>
                      <span className="text-sm font-semibold w-20 text-right">${(order?.total ?? 0).toFixed(2)}</span>
                      <Badge variant="outline" className={cn("text-xs border", statusStyles[order.status])}>
                        {statusLabels[order.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden lg:block w-32">
                        {order?.timestamp ? new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {expandedOrder === order.id ? <FiChevronUp className="w-4 h-4 text-muted-foreground" /> : <FiChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {expandedOrder === order.id && (
                      <div className="px-6 pb-4 bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Order Items</h4>
                            <div className="space-y-1.5">
                              {Array.isArray(order?.items) && order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span>{item?.qty ?? 1}x {item?.name ?? 'Item'}</span>
                                  <span className="font-medium">${((item?.price ?? 0) * (item?.qty ?? 1)).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-border/30">
                                <span>Total</span>
                                <span>${(order?.total ?? 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Update Status</h4>
                            <Select value={order.status} onValueChange={(v) => onStatusChange(order.id, v as Order['status'])}>
                              <SelectTrigger className="w-full h-9 rounded-[0.875rem]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

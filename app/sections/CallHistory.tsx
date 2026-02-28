'use client'

import React, { useState } from 'react'
import { FiSearch, FiStar, FiPhone } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface TranscriptLine {
  role: 'agent' | 'user'
  text: string
  time: string
}

export interface CallRecord {
  id: string
  phone: string
  duration: string
  date: Date
  starred: boolean
  transcript: TranscriptLine[]
  orderSummary?: {
    items: { name: string; qty: number; price: number }[]
    total: number
  }
}

interface CallHistoryProps {
  calls: CallRecord[]
  onToggleStar: (callId: string) => void
}

export default function CallHistory({ calls, onToggleStar }: CallHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)

  const safeCalls = Array.isArray(calls) ? calls : []

  const filteredCalls = searchQuery.trim()
    ? safeCalls.filter(c => {
        const q = searchQuery.toLowerCase()
        return (c?.phone ?? '').toLowerCase().includes(q) ||
          (Array.isArray(c?.transcript) && c.transcript.some(t => (t?.text ?? '').toLowerCase().includes(q)))
      })
    : safeCalls

  const selectedCall = safeCalls.find(c => c.id === selectedCallId) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.01em]">Call History</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-[1.55]">Review past calls and transcripts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Left panel - call list */}
        <Card className="lg:col-span-2 border border-border/50 bg-card/75 backdrop-blur-[16px] shadow-md flex flex-col overflow-hidden" style={{ borderRadius: '0.875rem' }}>
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-[0.875rem]"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {filteredCalls.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm px-4">
                  No calls found. Call transcripts will appear here after voice sessions.
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredCalls.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCallId(call.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors",
                        selectedCallId === call.id && "bg-secondary/70"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <FiPhone className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm font-medium tracking-[-0.01em]">{call?.phone ?? 'Unknown'}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleStar(call.id) }}
                          className="p-1 hover:bg-muted rounded-md transition-colors"
                        >
                          <FiStar className={cn("w-3.5 h-3.5", call.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{call?.duration ?? '0:00'}</span>
                        <span>{call?.date ? new Date(call.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right panel - transcript */}
        <Card className="lg:col-span-3 border border-border/50 bg-card/75 backdrop-blur-[16px] shadow-md flex flex-col overflow-hidden" style={{ borderRadius: '0.875rem' }}>
          {selectedCall ? (
            <>
              <CardHeader className="pb-3 flex-shrink-0 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold tracking-[-0.01em]">{selectedCall?.phone ?? 'Unknown'}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedCall?.date ? new Date(selectedCall.date).toLocaleString() : ''} -- Duration: {selectedCall?.duration ?? '0:00'}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleStar(selectedCall.id)}
                    className="p-2 hover:bg-muted rounded-[0.875rem] transition-colors"
                  >
                    <FiStar className={cn("w-4 h-4", selectedCall.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                  </button>
                </div>

                {/* Order summary */}
                {selectedCall?.orderSummary && (
                  <div className="mt-3 p-3 rounded-[0.875rem] bg-primary/5 border border-primary/10">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Order Summary</h4>
                    <div className="space-y-1">
                      {Array.isArray(selectedCall.orderSummary?.items) && selectedCall.orderSummary.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item?.qty ?? 1}x {item?.name ?? 'Item'}</span>
                          <span className="font-medium">${((item?.price ?? 0) * (item?.qty ?? 1)).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold pt-1 border-t border-primary/10">
                        <span>Total</span>
                        <span>${(selectedCall.orderSummary?.total ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-3">
                    {Array.isArray(selectedCall?.transcript) && selectedCall.transcript.map((line, i) => (
                      <div key={i} className={cn("flex", line.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[80%] p-3 rounded-[0.875rem] text-sm leading-[1.55]",
                          line.role === 'agent'
                            ? "bg-primary/10 text-foreground rounded-tl-sm"
                            : "bg-secondary text-secondary-foreground rounded-tr-sm"
                        )}>
                          <span className="block text-xs font-medium text-muted-foreground mb-1">
                            {line.role === 'agent' ? 'Receptionist' : 'Caller'} -- {line?.time ?? ''}
                          </span>
                          {line?.text ?? ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FiPhone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a call to view transcript</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

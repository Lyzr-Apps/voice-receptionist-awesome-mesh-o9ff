'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { FiPhone, FiPhoneOff, FiMic, FiMicOff } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const AGENT_ID = '69a27a68d56a3c78b8262a31'

export interface TranscriptEntry {
  role: 'agent' | 'user'
  text: string
  timestamp: Date
}

interface VoiceAgentProps {
  onCallStart?: () => void
  onCallEnd?: (transcript: TranscriptEntry[]) => void
  isCallActive: boolean
  setIsCallActive: (active: boolean) => void
}

export default function VoiceAgent({ onCallStart, onCallEnd, isCallActive, setIsCallActive }: VoiceAgentProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [agentThinking, setAgentThinking] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const nextPlayTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sampleRateRef = useRef(24000)
  const playbackGainRef = useRef<GainNode | null>(null)
  const transcriptRef = useRef<TranscriptEntry[]>([])
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  // Sync refs
  useEffect(() => { transcriptRef.current = transcript }, [transcript])
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])

  // Call duration timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isCallActive])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const float32ToBase64PCM16 = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    const bytes = new Uint8Array(int16Array.buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    try {
      const binaryStr = atob(base64Audio)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }
      const int16 = new Int16Array(bytes.buffer)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 0x8000
      }
      const buffer = ctx.createBuffer(1, float32.length, sampleRateRef.current)
      buffer.getChannelData(0).set(float32)
      const source = ctx.createBufferSource()
      source.buffer = buffer

      if (!playbackGainRef.current) {
        playbackGainRef.current = ctx.createGain()
        playbackGainRef.current.gain.value = 1
        playbackGainRef.current.connect(ctx.destination)
      }
      source.connect(playbackGainRef.current)

      // Schedule sequentially to prevent overlapping garbled speech
      const now = ctx.currentTime
      const startTime = Math.max(now, nextPlayTimeRef.current)
      source.start(startTime)
      nextPlayTimeRef.current = startTime + buffer.duration
    } catch (e) {
      // Ignore audio decode errors
    }
  }, [])

  const startCall = useCallback(async () => {
    setError(null)
    setIsConnecting(true)
    setTranscript([])
    setCallDuration(0)

    try {
      // 1. Start voice session
      const res = await fetch('https://voice-sip.studio.lyzr.ai/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: AGENT_ID })
      })

      if (!res.ok) throw new Error('Failed to start voice session')

      const data = await res.json()
      const wsUrl = data?.wsUrl
      sampleRateRef.current = data?.audioConfig?.sampleRate || 24000

      if (!wsUrl) throw new Error('No WebSocket URL received')

      // 2. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      // 3. Set up AudioContext
      const ctx = new AudioContext({ sampleRate: sampleRateRef.current })
      audioContextRef.current = ctx
      nextPlayTimeRef.current = 0
      playbackGainRef.current = null

      // 4. Connect WebSocket
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsCallActive(true)
        setIsConnecting(false)
        onCallStart?.()

        // Set up mic audio processing
        const source = ctx.createMediaStreamSource(stream)
        const processor = ctx.createScriptProcessor(4096, 1, 1)
        processorRef.current = processor

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current) return
          const inputData = e.inputBuffer.getChannelData(0)
          const base64 = float32ToBase64PCM16(inputData)
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'audio',
              audio: base64,
              sampleRate: sampleRateRef.current
            }))
          }
        }

        source.connect(processor)
        // Connect to silent gain node to prevent mic echo
        const silentNode = ctx.createGain()
        silentNode.gain.value = 0
        silentNode.connect(ctx.destination)
        processor.connect(silentNode)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'audio' && msg.audio) {
            playAudioChunk(msg.audio)
            setAgentThinking(false)
          } else if (msg.type === 'transcript') {
            const entry: TranscriptEntry = {
              role: msg.role === 'agent' ? 'agent' : 'user',
              text: msg.text || msg.content || '',
              timestamp: new Date()
            }
            if (entry.text.trim()) {
              setTranscript(prev => [...prev, entry])
            }
            setAgentThinking(false)
          } else if (msg.type === 'thinking') {
            setAgentThinking(true)
          } else if (msg.type === 'clear') {
            setAgentThinking(false)
          } else if (msg.type === 'error') {
            setError(msg.message || 'Voice error occurred')
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      ws.onerror = () => {
        setError('WebSocket connection error')
        setIsConnecting(false)
      }

      ws.onclose = () => {
        setIsCallActive(false)
        setIsConnecting(false)
        setAgentThinking(false)
        if (transcriptRef.current.length > 0) {
          onCallEnd?.(transcriptRef.current)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start call')
      setIsConnecting(false)
    }
  }, [onCallStart, onCallEnd, setIsCallActive, playAudioChunk])

  const endCall = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    playbackGainRef.current = null
    nextPlayTimeRef.current = 0
    setIsCallActive(false)
    setIsConnecting(false)
    setAgentThinking(false)
  }, [setIsCallActive])

  const toggleMute = () => setIsMuted(prev => !prev)

  // Cleanup on unmount
  useEffect(() => {
    return () => { endCall() }
  }, [endCall])

  return (
    <Card className="border border-border/50 bg-card/75 backdrop-blur-[16px] shadow-md" style={{ borderRadius: '0.875rem' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold tracking-[-0.01em]">Voice Assistant</CardTitle>
          <Badge variant={isCallActive ? 'default' : 'secondary'} className="text-xs">
            {isCallActive ? 'On Call' : isConnecting ? 'Connecting...' : 'Ready'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-[0.875rem] bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-destructive/60 hover:text-destructive">
              <FiMicOff className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Call timer */}
        {isCallActive && (
          <div className="text-center py-2">
            <div className="text-3xl font-bold tracking-tight text-primary">{formatDuration(callDuration)}</div>
            <div className="text-sm text-muted-foreground mt-1 leading-[1.55]">
              {agentThinking ? 'Agent is thinking...' : 'Call in progress'}
            </div>
          </div>
        )}

        {/* Live transcript */}
        {isCallActive && transcript.length > 0 && (
          <ScrollArea className="max-h-48">
            <div className="space-y-2 p-3 rounded-[0.875rem] bg-muted/30">
              {transcript.map((entry, i) => (
                <div key={i} className={cn(
                  "text-sm p-2.5 rounded-[0.75rem] max-w-[85%]",
                  entry.role === 'agent'
                    ? "bg-primary/10 text-foreground mr-auto rounded-tl-sm"
                    : "bg-secondary text-secondary-foreground ml-auto rounded-tr-sm"
                )}>
                  <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                    {entry.role === 'agent' ? 'Receptionist' : 'Caller'}
                  </span>
                  {entry.text}
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Connecting */}
        {isConnecting && (
          <div className="text-center py-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-pulse">
              <FiPhone className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Connecting to receptionist...</p>
          </div>
        )}

        {/* Idle state */}
        {!isCallActive && !isConnecting && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground leading-[1.55]">Press the call button to start a voice session with the AI receptionist.</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {!isCallActive && !isConnecting ? (
            <Button
              onClick={startCall}
              className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              <FiPhone className="w-6 h-6" />
            </Button>
          ) : isCallActive ? (
            <>
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'secondary'}
                className="rounded-full w-12 h-12"
              >
                {isMuted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
              </Button>
              <Button
                onClick={endCall}
                variant="destructive"
                className="rounded-full w-14 h-14 shadow-lg shadow-destructive/25"
              >
                <FiPhoneOff className="w-6 h-6" />
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { FiUploadCloud, FiFile, FiTrash2, FiCheck, FiX, FiEdit2, FiLoader } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRAGKnowledgeBase } from '@/lib/ragKnowledgeBase'
import type { RAGDocument } from '@/lib/ragKnowledgeBase'
import { cn } from '@/lib/utils'

const RAG_ID = '69a27a5400c2d274880f6c77'

export interface ProductItem {
  id: string
  name: string
  price: number
  description: string
  available: boolean
}

interface SettingsPageProps {
  products: ProductItem[]
  onProductUpdate: (products: ProductItem[]) => void
}

export default function SettingsPage({ products, onProductUpdate }: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', price: '', description: '' })
  const [deleteStatus, setDeleteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { documents, loading, error, fetchDocuments, uploadDocument, removeDocuments } = useRAGKnowledgeBase()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDocuments(RAG_ID)
  }, []) // intentionally run once on mount

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadStatus(null)
    const file = files[0]
    const result = await uploadDocument(RAG_ID, file)
    if (result.success) {
      setUploadStatus({ type: 'success', message: `"${file.name}" uploaded and training started.` })
    } else {
      setUploadStatus({ type: 'error', message: result.error ?? 'Upload failed.' })
    }
  }, [uploadDocument])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files) }

  const handleDeleteDoc = async (fileName: string) => {
    setDeleteStatus(null)
    const result = await removeDocuments(RAG_ID, [fileName])
    if (result.success) {
      setDeleteStatus({ type: 'success', message: `"${fileName}" deleted.` })
    } else {
      setDeleteStatus({ type: 'error', message: result.error ?? 'Delete failed.' })
    }
  }

  const startEdit = (product: ProductItem) => {
    setEditingId(product.id)
    setEditForm({ name: product.name, price: product.price.toString(), description: product.description })
  }

  const saveEdit = (id: string) => {
    const safeProducts = Array.isArray(products) ? products : []
    const updated = safeProducts.map(p =>
      p.id === id
        ? { ...p, name: editForm.name, price: parseFloat(editForm.price) || p.price, description: editForm.description }
        : p
    )
    onProductUpdate(updated)
    setEditingId(null)
  }

  const toggleAvailability = (id: string) => {
    const safeProducts = Array.isArray(products) ? products : []
    const updated = safeProducts.map(p => p.id === id ? { ...p, available: !p.available } : p)
    onProductUpdate(updated)
  }

  const safeProducts = Array.isArray(products) ? products : []
  const safeDocs = Array.isArray(documents) ? documents : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.01em]">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-[1.55]">Manage knowledge base and product catalog</p>
      </div>

      {/* File Upload */}
      <Card className="border border-border/50 bg-card/75 backdrop-blur-[16px] shadow-md" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold tracking-[-0.01em]">Knowledge Base Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-[0.875rem] p-8 text-center cursor-pointer transition-all duration-200",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <FiUploadCloud className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">Drag and drop or click to upload</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiLoader className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}

          {uploadStatus && (
            <div className={cn(
              "p-3 rounded-[0.875rem] text-sm flex items-center gap-2",
              uploadStatus.type === 'success' ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"
            )}>
              {uploadStatus.type === 'success' ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
              {uploadStatus.message}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-[0.875rem] text-sm bg-destructive/10 text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KB Documents */}
      <Card className="border border-border/50 bg-card/75 backdrop-blur-[16px] shadow-md" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold tracking-[-0.01em]">Knowledge Base Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {deleteStatus && (
            <div className={cn(
              "p-3 rounded-[0.875rem] text-sm mb-3 flex items-center gap-2",
              deleteStatus.type === 'success' ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"
            )}>
              {deleteStatus.type === 'success' ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
              {deleteStatus.message}
            </div>
          )}
          {safeDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No documents in knowledge base yet.</p>
          ) : (
            <div className="space-y-2">
              {safeDocs.map((doc: RAGDocument, i: number) => (
                <div key={doc?.id ?? i} className="flex items-center justify-between p-3 rounded-[0.875rem] bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FiFile className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc?.fileName ?? 'Unknown file'}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc?.fileType ?? ''} {doc?.uploadedAt ? `-- ${new Date(doc.uploadedAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {doc?.status ?? 'unknown'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDoc(doc?.fileName ?? '')}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card className="border border-border/50 bg-card/75 backdrop-blur-[16px] shadow-md" style={{ borderRadius: '0.875rem' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold tracking-[-0.01em]">Product / Menu Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y divide-border/30">
              {safeProducts.map((product) => (
                <div key={product.id} className="px-6 py-3 flex items-center gap-4">
                  {editingId === product.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="h-8 text-sm rounded-[0.875rem]"
                        placeholder="Name"
                      />
                      <Input
                        value={editForm.price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                        className="h-8 text-sm rounded-[0.875rem]"
                        type="number"
                        step="0.01"
                        placeholder="Price"
                      />
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="h-8 text-sm rounded-[0.875rem]"
                        placeholder="Description"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{product?.name ?? 'Unknown'}</span>
                        <span className="text-sm font-semibold text-primary">${(product?.price ?? 0).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate leading-[1.55]">{product?.description ?? ''}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={product?.available ?? false}
                      onCheckedChange={() => toggleAvailability(product.id)}
                    />
                    {editingId === product.id ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => saveEdit(product.id)}>
                          <FiCheck className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                          <FiX className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(product)}>
                        <FiEdit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

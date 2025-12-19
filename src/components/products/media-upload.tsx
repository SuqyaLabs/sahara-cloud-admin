'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Upload, X, ImagePlus, Loader2, AlertCircle } from 'lucide-react'

interface MediaUploadProps {
  onFilesSelected: (files: File[]) => void
  isUploading?: boolean
  uploadProgress?: number
  error?: string | null
  maxFiles?: number
  currentCount?: number
  disabled?: boolean
}

export function MediaUpload({
  onFilesSelected,
  isUploading = false,
  uploadProgress = 0,
  error,
  maxFiles = 10,
  currentCount = 0,
  disabled = false,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const remainingSlots = maxFiles - currentCount

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, remainingSlots)
    
    // Create previews
    const previews = fileArray.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    
    setPreviewFiles(previews)
  }, [remainingSlots])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }, [disabled, isUploading, processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [processFiles])

  const handleUpload = useCallback(() => {
    if (previewFiles.length > 0) {
      onFilesSelected(previewFiles.map(p => p.file))
    }
  }, [previewFiles, onFilesSelected])

  const handleClearPreviews = useCallback(() => {
    previewFiles.forEach(p => URL.revokeObjectURL(p.preview))
    setPreviewFiles([])
  }, [previewFiles])

  const removePreview = useCallback((index: number) => {
    setPreviewFiles(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index].preview)
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }, [])

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={previewFiles.length === 0 ? openFilePicker : undefined}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          'flex flex-col items-center justify-center gap-3',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-border hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          previewFiles.length === 0 && !disabled && 'cursor-pointer',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {previewFiles.length === 0 ? (
          <>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging ? 'Déposez les images ici' : 'Glissez-déposez des images'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ou cliquez pour sélectionner • JPG, PNG, WebP, GIF • Max 5MB
              </p>
              {remainingSlots < maxFiles && (
                <p className="text-xs text-muted-foreground mt-1">
                  {remainingSlots} emplacement{remainingSlots > 1 ? 's' : ''} disponible{remainingSlots > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="w-full space-y-4">
            {/* Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {previewFiles.map((item, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={item.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removePreview(index)
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 right-1">
                    <p className="text-xs text-white bg-black/50 rounded px-1 py-0.5 truncate">
                      {item.file.name}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Add More Button */}
              {previewFiles.length < remainingSlots && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    openFilePicker()
                  }}
                  className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors"
                >
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearPreviews()
                }}
                disabled={isUploading}
              >
                <X className="w-4 h-4 mr-1" />
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpload()
                }}
                disabled={isUploading || previewFiles.length === 0}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger ({previewFiles.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}

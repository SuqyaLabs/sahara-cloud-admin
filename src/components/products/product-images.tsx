'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { MediaUpload } from './media-upload'
import { useProductMedia, type ProductMedia } from '@/hooks/use-product-media'
import { 
  Trash2, 
  Star, 
  GripVertical, 
  Loader2, 
  ImageOff,
  Maximize2
} from 'lucide-react'

interface ProductImagesProps {
  images: ProductMedia[]
  productId: string
  tenantId: string
  onImagesChange: (images: ProductMedia[]) => void
  maxImages?: number
}

export function ProductImages({
  images,
  productId,
  tenantId,
  onImagesChange,
  maxImages = 10,
}: ProductImagesProps) {
  const { 
    isUploading, 
    uploadProgress, 
    error, 
    uploadMultiple,
    deleteMedia,
    setPrimary,
    updatePositions,
  } = useProductMedia()

  const [deleteConfirm, setDeleteConfirm] = useState<ProductMedia | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewImage, setPreviewImage] = useState<ProductMedia | null>(null)

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (!tenantId || !productId) return

    const results = await uploadMultiple({ files, tenantId, productId })
    
    if (results.length > 0) {
      onImagesChange([...images, ...results])
    }
  }, [tenantId, productId, images, uploadMultiple, onImagesChange])

  const handleSetPrimary = useCallback(async (image: ProductMedia) => {
    const success = await setPrimary(productId, image.id)
    if (success) {
      const updatedImages = images.map(img => ({
        ...img,
        is_primary: img.id === image.id,
      }))
      onImagesChange(updatedImages)
    }
  }, [images, productId, setPrimary, onImagesChange])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return

    setIsDeleting(true)
    const success = await deleteMedia(deleteConfirm)
    
    if (success) {
      const updatedImages = images.filter(img => img.id !== deleteConfirm.id)
      
      // If we deleted the primary image, make the first remaining image primary
      if (deleteConfirm.is_primary && updatedImages.length > 0) {
        await setPrimary(productId, updatedImages[0].id)
        updatedImages[0].is_primary = true
      }
      
      onImagesChange(updatedImages)
    }
    
    setIsDeleting(false)
    setDeleteConfirm(null)
  }, [deleteConfirm, deleteMedia, images, productId, setPrimary, onImagesChange])

  const handleMoveImage = useCallback(async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return
    
    const newImages = [...images]
    const [moved] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, moved)
    
    // Update positions in database
    const updates = newImages.map((img, index) => ({
      id: img.id,
      position: index,
    }))
    
    await updatePositions(updates)
    
    // Update local state with new positions
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      position: index,
    }))
    onImagesChange(reorderedImages)
  }, [images, updatePositions, onImagesChange])

  return (
    <div className="space-y-6">
      {/* Current Images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Images ({images.length}/{maxImages})
            </h4>
            <p className="text-xs text-muted-foreground">
              Glissez pour réorganiser • Cliquez sur ★ pour définir l&apos;image principale
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  'relative aspect-square group rounded-lg overflow-hidden border-2',
                  image.is_primary ? 'border-primary' : 'border-transparent'
                )}
              >
                <Image
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  unoptimized
                />
                
                {/* Primary Badge */}
                {image.is_primary && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                    Principal
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Drag Handle */}
                  <button
                    type="button"
                    className="p-1.5 bg-white/20 rounded hover:bg-white/30 transition-colors cursor-grab"
                    title="Réorganiser"
                  >
                    <GripVertical className="w-4 h-4 text-white" />
                  </button>

                  {/* Set Primary */}
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image)}
                      className="p-1.5 bg-white/20 rounded hover:bg-white/30 transition-colors"
                      title="Définir comme image principale"
                    >
                      <Star className="w-4 h-4 text-white" />
                    </button>
                  )}

                  {/* Preview */}
                  <button
                    type="button"
                    onClick={() => setPreviewImage(image)}
                    className="p-1.5 bg-white/20 rounded hover:bg-white/30 transition-colors"
                    title="Aperçu"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(image)}
                    className="p-1.5 bg-destructive/80 rounded hover:bg-destructive transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Order Controls */}
                <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, index - 1)}
                      className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded"
                    >
                      ←
                    </button>
                  )}
                  <span className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded mx-auto">
                    {index + 1}
                  </span>
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, index + 1)}
                      className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <ImageOff className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Aucune image</p>
        </div>
      )}

      {/* Upload Component */}
      {images.length < maxImages && (
        <MediaUpload
          onFilesSelected={handleFilesSelected}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          error={error}
          maxFiles={maxImages}
          currentCount={images.length}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;image</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirm && (
            <div className="relative aspect-video w-full max-w-[200px] mx-auto rounded-lg overflow-hidden">
              <Image
                src={deleteConfirm.url}
                alt="Image to delete"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Aperçu de l&apos;image</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden">
              <Image
                src={previewImage.url}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/hooks/use-tenant'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield,
  Save,
  Check
} from 'lucide-react'

export default function SettingsPage() {
  const { currentTenant, refreshTenants } = useTenant()
  const [user, setUser] = useState<{ email: string; id: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ email: user.email || '', id: user.id })
      }
    })
  }, [])

  const handlePasswordChange = async () => {
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordForm.new.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new,
    })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setPasswordForm({ current: '', new: '', confirm: '' })
    }

    setIsLoading(false)
  }

  const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
    active: { label: 'Actif', variant: 'success' },
    trial: { label: 'Essai', variant: 'warning' },
    suspended: { label: 'Suspendu', variant: 'destructive' },
    cancelled: { label: 'Annulé', variant: 'destructive' },
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm">
          Gérez les paramètres de votre compte et restaurant
        </p>
      </div>

      {/* Restaurant Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Informations du restaurant</CardTitle>
          </div>
          <CardDescription>
            Détails de votre établissement (lecture seule)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTenant ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom du restaurant</Label>
                  <Input value={currentTenant.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Identifiant</Label>
                  <Input value={currentTenant.slug} disabled />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom commercial</Label>
                  <Input value={currentTenant.business_name || '-'} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input value={currentTenant.business_address || '-'} disabled />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <Badge variant={statusConfig[currentTenant.status]?.variant || 'secondary'}>
                    {statusConfig[currentTenant.status]?.label || currentTenant.status}
                  </Badge>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Aucun restaurant sélectionné</p>
          )}
        </CardContent>
      </Card>

      {/* Owner Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Propriétaire</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTenant ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nom
                </Label>
                <Input value={currentTenant.business_name || '-'} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input value={currentTenant.owner_email || '-'} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone
                </Label>
                <Input value={currentTenant.owner_phone || '-'} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse
                </Label>
                <Input value={currentTenant.business_address || '-'} disabled />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Aucun restaurant sélectionné</p>
          )}
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Sécurité du compte</CardTitle>
          </div>
          <CardDescription>
            Modifier votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email du compte</Label>
            <Input value={user?.email || ''} disabled />
          </div>

          {passwordError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Mot de passe modifié avec succès
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmer le mot de passe</Label>
              <Input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handlePasswordChange}
                disabled={isLoading || !passwordForm.new || !passwordForm.confirm}
              >
                <Save className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

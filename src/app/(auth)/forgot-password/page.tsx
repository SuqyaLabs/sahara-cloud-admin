'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Store, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setIsLoading(false)
      return
    }

    setIsSuccess(true)
    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <div className="animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold">SaharaOS</span>
          </div>
        </div>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Email envoyé!</h2>
                <p className="text-muted-foreground text-sm">
                  Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot de passe.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-semibold">SaharaOS</span>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Mot de passe oublié?</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Envoyer le lien
            </Button>

            <Link href="/login" className="block">
              <Button type="button" variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

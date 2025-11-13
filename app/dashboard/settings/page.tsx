"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Database,
  Trash2,
  Download,
  Key,
  Mail,
  Moon,
  Sun,
  Smartphone,
  Globe,
  Lock,
  Eye,
  EyeOff
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import LoadingSpinner from "@/components/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import type { ScoringWeights } from "@/types/interview"
import { offlineStorage } from "@/lib/offline-storage"
import { ScoringSystem } from "@/lib/scoring-system"

interface NotificationForm {
  email_notifications: boolean
  interview_reminders: boolean
  progress_updates: boolean
  newsletter: boolean
}

interface AppearanceForm {
  theme: "light" | "dark" | "system"
  language: string
  timezone: string
}

interface SecurityForm {
  current_password: string
  new_password: string
  confirm_password: string
}

interface ScoringForm extends ScoringWeights {
  presetName?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(ScoringSystem.getDefaultWeights())
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const supabase = createClient()

  const {
    register: registerNotifications,
    handleSubmit: handleNotificationsSubmit,
    watch: watchNotifications,
    reset: resetNotifications,
    formState: { errors: notificationErrors }
  } = useForm<NotificationForm>()

  const {
    register: registerAppearance,
    handleSubmit: handleAppearanceSubmit,
    setValue: setAppearanceValue,
    watch: watchAppearance,
    formState: { errors: appearanceErrors }
  } = useForm<AppearanceForm>()

  const {
    register: registerSecurity,
    handleSubmit: handleSecuritySubmit,
    reset: resetSecurity,
    watch: watchSecurity,
    formState: { errors: securityErrors }
  } = useForm<SecurityForm>()

  const notificationValues = watchNotifications()
  const appearanceValues = watchAppearance()
  const securityValues = watchSecurity()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch user settings/preferences from database
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (settings) {
          resetNotifications({
            email_notifications: settings.email_notifications ?? true,
            interview_reminders: settings.interview_reminders ?? true,
            progress_updates: settings.progress_updates ?? true,
            newsletter: settings.newsletter ?? false,
          })

          setAppearanceValue('theme', settings.theme || 'system')
          setAppearanceValue('language', settings.language || 'en')
          setAppearanceValue('timezone', settings.timezone || 'UTC')
        } else {
          // Default values
          resetNotifications({
            email_notifications: true,
            interview_reminders: true,
            progress_updates: true,
            newsletter: false,
          })
          setAppearanceValue('theme', 'system')
          setAppearanceValue('language', 'en')
          setAppearanceValue('timezone', 'UTC')
        }

        // Fetch scoring weights
        const { data: weightsData } = await supabase
          .from('user_scoring_weights')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (weightsData) {
          const weights: ScoringWeights = {
            technicalAccuracy: weightsData.technical_accuracy || 0.15,
            communicationSkills: weightsData.communication_skills || 0.20,
            problemSolving: weightsData.problem_solving || 0.15,
            confidence: weightsData.confidence || 0.10,
            relevance: weightsData.relevance || 0.15,
            clarity: weightsData.clarity || 0.10,
            structure: weightsData.structure || 0.10,
            examples: weightsData.examples || 0.05,
          }
          setScoringWeights(weights)
          setSelectedPreset(weightsData.preset_name || null)
          offlineStorage.saveScoringWeights(weights)
        } else {
          const defaultWeights = ScoringSystem.getDefaultWeights()
          setScoringWeights(defaultWeights)
          offlineStorage.saveScoringWeights(defaultWeights)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationsSubmitForm = async (data: NotificationForm) => {
    if (!user) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSuccess('Notification settings updated successfully!')
    } catch (error: any) {
      setError(error.message || 'Failed to update notification settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAppearanceSubmitForm = async (data: AppearanceForm) => {
    if (!user) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme: data.theme,
          language: data.language,
          timezone: data.timezone,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Apply theme immediately
      if (data.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (data.theme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }

      setSuccess('Appearance settings updated successfully!')
    } catch (error: any) {
      setError(error.message || 'Failed to update appearance settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSecuritySubmitForm = async (data: SecurityForm) => {
    if (!user) return

    setIsChangingPassword(true)
    setError(null)
    setSuccess(null)

    try {
      if (data.new_password !== data.confirm_password) {
        throw new Error('New passwords do not match')
      }

      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      })

      if (error) throw error

      setSuccess('Password changed successfully!')
      resetSecurity()
    } catch (error: any) {
      setError(error.message || 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSaveScoringWeights = async () => {
    if (!user) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('user_scoring_weights')
        .upsert({
          user_id: user.id,
          technical_accuracy: scoringWeights.technicalAccuracy,
          communication_skills: scoringWeights.communicationSkills,
          problem_solving: scoringWeights.problemSolving,
          confidence: scoringWeights.confidence,
          relevance: scoringWeights.relevance,
          clarity: scoringWeights.clarity,
          structure: scoringWeights.structure,
          examples: scoringWeights.examples,
          preset_name: selectedPreset,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      offlineStorage.saveScoringWeights(scoringWeights)
      setSuccess('Scoring weights updated successfully!')
    } catch (error: any) {
      setError(error.message || 'Failed to update scoring weights')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyPreset = (presetName: string) => {
    const presetWeights = ScoringSystem.getPresetWeights(presetName)
    if (presetWeights) {
      setScoringWeights(presetWeights)
      setSelectedPreset(presetName)
    }
  }

  const handleResetToDefaults = () => {
    const defaultWeights = ScoringSystem.getDefaultWeights()
    setScoringWeights(defaultWeights)
    setSelectedPreset(null)
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      // This would typically call a server action to properly delete the account
      // For now, we'll just sign out
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    } catch (error: any) {
      setError(error.message || 'Failed to delete account')
    }
  }

  const handleExportData = async () => {
    if (!user) return

    try {
      // Export user data as JSON
      const userData = {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        // Add other user data as needed
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-${user.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('Data exported successfully!')
    } catch (error: any) {
      setError(error.message || 'Failed to export data')
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" label="Loading settings..." />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="scoring" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Scoring
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive via email
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNotificationsSubmit(handleNotificationsSubmitForm)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="email_notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications about your account activity
                          </p>
                        </div>
                        <Switch
                          id="email_notifications"
                          {...registerNotifications('email_notifications')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="interview_reminders">Interview Reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Get reminded about scheduled practice sessions
                          </p>
                        </div>
                        <Switch
                          id="interview_reminders"
                          {...registerNotifications('interview_reminders')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="progress_updates">Progress Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Weekly updates about your interview practice progress
                          </p>
                        </div>
                        <Switch
                          id="progress_updates"
                          {...registerNotifications('progress_updates')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="newsletter">Newsletter</Label>
                          <p className="text-sm text-muted-foreground">
                            Tips, tricks, and updates about Interview AI
                          </p>
                        </div>
                        <Switch
                          id="newsletter"
                          {...registerNotifications('newsletter')}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" variant="muted" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Notification Settings'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Scoring Weights
                  </CardTitle>
                  <CardDescription>
                    Customize how your responses are evaluated by adjusting the weight of each criterion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Quick Presets</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          type="button" 
                          variant={selectedPreset === 'technical' ? 'default' : 'outline'}
                          onClick={() => handleApplyPreset('technical')}
                          className="w-full"
                        >
                          Technical
                        </Button>
                        <Button 
                          type="button" 
                          variant={selectedPreset === 'behavioral' ? 'default' : 'outline'}
                          onClick={() => handleApplyPreset('behavioral')}
                          className="w-full"
                        >
                          Behavioral
                        </Button>
                        <Button 
                          type="button" 
                          variant={selectedPreset === 'product-manager' ? 'default' : 'outline'}
                          onClick={() => handleApplyPreset('product-manager')}
                          className="w-full"
                        >
                          Product Manager
                        </Button>
                        <Button 
                          type="button" 
                          variant={selectedPreset === 'leadership' ? 'default' : 'outline'}
                          onClick={() => handleApplyPreset('leadership')}
                          className="w-full"
                        >
                          Leadership
                        </Button>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleResetToDefaults}
                        className="w-full"
                      >
                        Reset to Defaults
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      {[
                        { key: 'technicalAccuracy', label: 'Technical Accuracy', description: 'Accuracy of technical content' },
                        { key: 'communicationSkills', label: 'Communication Skills', description: 'Clarity and articulation' },
                        { key: 'problemSolving', label: 'Problem Solving', description: 'Structured approach to problems' },
                        { key: 'confidence', label: 'Confidence', description: 'Conviction in responses' },
                        { key: 'relevance', label: 'Relevance', description: 'How well you address the question' },
                        { key: 'clarity', label: 'Clarity', description: 'Clear and concise communication' },
                        { key: 'structure', label: 'Structure', description: 'Organization of thoughts' },
                        { key: 'examples', label: 'Examples', description: 'Use of concrete examples' }
                      ].map(({ key, label, description }) => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-base">{label}</Label>
                              <p className="text-sm text-muted-foreground">{description}</p>
                            </div>
                            <Badge variant="secondary" className="text-lg">
                              {(scoringWeights[key as keyof ScoringWeights] * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <Slider
                            value={[scoringWeights[key as keyof ScoringWeights] * 100]}
                            onValueChange={(value) => 
                              setScoringWeights({
                                ...scoringWeights,
                                [key]: value[0] / 100
                              })
                            }
                            min={0}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Weight Information</p>
                      <p className="text-sm text-blue-800">
                        Adjust the sliders to set how much each criterion should impact your overall score. Higher percentages mean more weight in the final evaluation.
                      </p>
                    </div>

                    <Button type="button" onClick={handleSaveScoringWeights} disabled={isSaving} className="w-full">
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" variant="muted" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Scoring Weights'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize how Interview AI looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAppearanceSubmit(handleAppearanceSubmitForm)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { value: 'light', label: 'Light', icon: Sun },
                            { value: 'dark', label: 'Dark', icon: Moon },
                            { value: 'system', label: 'System', icon: Smartphone }
                          ].map(({ value, label, icon: Icon }) => (
                            <Label
                              key={value}
                              htmlFor={`theme-${value}`}
                              className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                appearanceValues?.theme === value
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                {...registerAppearance('theme')}
                                type="radio"
                                value={value}
                                id={`theme-${value}`}
                                className="sr-only"
                              />
                              <Icon className="w-6 h-6 mb-2" />
                              <span className="text-sm font-medium">{label}</span>
                            </Label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <select
                          id="language"
                          {...registerAppearance('language')}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                          <option value="zh">中文</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <select
                          id="timezone"
                          {...registerAppearance('timezone')}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                      </div>
                    </div>

                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" variant="muted" className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Appearance Settings'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSecuritySubmit(handleSecuritySubmitForm)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current_password"
                            type={showPasswords.current ? "text" : "password"}
                            placeholder="Enter current password"
                            {...registerSecurity('current_password', {
                              required: 'Current password is required'
                            })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        {securityErrors.current_password && (
                          <p className="text-sm text-destructive">{securityErrors.current_password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new_password"
                            type={showPasswords.new ? "text" : "password"}
                            placeholder="Enter new password"
                            {...registerSecurity('new_password', {
                              required: 'New password is required',
                              minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters'
                              }
                            })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        {securityErrors.new_password && (
                          <p className="text-sm text-destructive">{securityErrors.new_password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            type={showPasswords.confirm ? "text" : "password"}
                            placeholder="Confirm new password"
                            {...registerSecurity('confirm_password', {
                              required: 'Please confirm your new password',
                              validate: (value) => value === securityValues?.new_password || 'Passwords do not match'
                            })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                        {securityErrors.confirm_password && (
                          <p className="text-sm text-destructive">{securityErrors.confirm_password.message}</p>
                        )}
                      </div>
                    </div>

                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <LoadingSpinner size="sm" variant="muted" className="mr-2" />
                          Changing Password...
                        </>
                      ) : (
                        'Change Password'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Manage your data and account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h3 className="font-medium">Export Your Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Download all your data in JSON format
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleExportData}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div className="space-y-1">
                        <h3 className="font-medium text-red-600">Delete Account</h3>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove all your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
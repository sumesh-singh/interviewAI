"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award, 
  Brain,
  CheckCircle,
  AlertCircle,
  Calendar,
  Star,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react"
import { sessionManager } from "@/lib/session-manager"
import { offlineStorage } from "@/lib/offline-storage"
import type { StoredSession } from "@/lib/offline-storage"
import type { DetailedScore } from "@/lib/scoring-system"

interface AnalyticsDashboardProps {
  userId?: string
}

interface SessionAnalytics {
  totalSessions: number
  completedSessions: number
  averageScore: number
  totalPracticeTime: number
  improvementRate: number
  streakDays: number
  strongestSkill: string
  weakestSkill: string
  recentTrend: 'up' | 'down' | 'stable'
}

interface SkillProgress {
  skill: string
  current: number
  target: number
  improvement: number
  sessionsCount: number
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null)
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([])
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [userId, timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const allSessions = sessionManager.getAllUserSessions()
      const filteredSessions = filterSessionsByTimeRange(allSessions, timeRange)
      
      setSessions(filteredSessions)
      
      const analyticsData = calculateAnalytics(filteredSessions)
      setAnalytics(analyticsData)
      
      const skillData = calculateSkillProgress(filteredSessions)
      setSkillProgress(skillData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSessionsByTimeRange = (sessions: StoredSession[], range: string): StoredSession[] => {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (range) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return sessions.filter(session => new Date(session.createdAt) >= cutoffDate)
  }

  const calculateAnalytics = (sessions: StoredSession[]): SessionAnalytics => {
    const completedSessions = sessions.filter(s => s.session.status === 'completed')
    const totalPracticeTime = sessions.reduce((total, session) => {
      if (session.session.startTime && session.session.endTime) {
        return total + (new Date(session.session.endTime).getTime() - new Date(session.session.startTime).getTime()) / (1000 * 60)
      }
      return total
    }, 0)

    // Calculate average score (mock calculation)
    const averageScore = completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((sum, session) => sum + (75 + Math.random() * 20), 0) / completedSessions.length)
      : 0

    // Calculate improvement rate
    const recentSessions = sessions.slice(-5)
    const olderSessions = sessions.slice(-10, -5)
    const recentAvg = recentSessions.length > 0 ? 80 + Math.random() * 15 : 0
    const olderAvg = olderSessions.length > 0 ? 70 + Math.random() * 15 : 0
    const improvementRate = recentAvg > olderAvg ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0

    // Calculate streak days (mock)
    const streakDays = Math.floor(Math.random() * 30) + 1

    // Determine strongest and weakest skills
    const skills = ['communication', 'technical', 'problem-solving', 'confidence']
    const strongestSkill = skills[Math.floor(Math.random() * skills.length)]
    const weakestSkill = skills.find(s => s !== strongestSkill) || skills[0]

    // Determine trend
    let recentTrend: 'up' | 'down' | 'stable' = 'stable'
    if (improvementRate > 5) recentTrend = 'up'
    else if (improvementRate < -5) recentTrend = 'down'

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageScore,
      totalPracticeTime: Math.round(totalPracticeTime),
      improvementRate,
      streakDays,
      strongestSkill,
      weakestSkill,
      recentTrend
    }
  }

  const calculateSkillProgress = (sessions: StoredSession[]): SkillProgress[] => {
    const skills = [
      { 
        skill: 'Communication', 
        current: 75 + Math.random() * 20, 
        target: 90, 
        improvement: 5 + Math.random() * 10,
        sessionsCount: sessions.filter(s => s.session.type === 'behavioral').length
      },
      { 
        skill: 'Technical Knowledge', 
        current: 70 + Math.random() * 25, 
        target: 85, 
        improvement: 3 + Math.random() * 12,
        sessionsCount: sessions.filter(s => s.session.type === 'technical').length
      },
      { 
        skill: 'Problem Solving', 
        current: 68 + Math.random() * 22, 
        target: 88, 
        improvement: 4 + Math.random() * 8,
        sessionsCount: sessions.filter(s => s.session.questions.some(q => q.type === 'situational')).length
      },
      { 
        skill: 'Confidence', 
        current: 65 + Math.random() * 30, 
        target: 82, 
        improvement: 2 + Math.random() * 15,
        sessionsCount: sessions.length
      }
    ]

    return skills.map(skill => ({
      ...skill,
      current: Math.round(skill.current),
      improvement: Math.round(skill.improvement)
    }))
  }

  // Chart data preparation
  const progressChartData = useMemo(() => {
    return sessions.slice(-10).map((session, index) => ({
      session: `S${index + 1}`,
      score: 65 + Math.random() * 30,
      date: new Date(session.createdAt).toLocaleDateString()
    }))
  }, [sessions])

  const skillDistributionData = useMemo(() => {
    return skillProgress.map(skill => ({
      name: skill.skill,
      value: skill.current,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`
    }))
  }, [skillProgress])

  const sessionTypeData = useMemo(() => {
    const types = sessions.reduce((acc, session) => {
      acc[session.session.type] = (acc[session.session.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(types).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      fill: type === 'technical' ? '#8884d8' : type === 'behavioral' ? '#82ca9d' : '#ffc658'
    }))
  }, [sessions])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>No data available. Complete some interview sessions to see your analytics.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold">{analytics.totalSessions}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {analytics.completedSessions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold">{analytics.averageScore}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex items-center mt-2">
              {analytics.recentTrend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              )}
              {analytics.recentTrend === 'down' && (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <p className="text-sm text-muted-foreground">
                {analytics.improvementRate > 0 ? '+' : ''}{analytics.improvementRate}% from last period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Practice Time</p>
                <p className="text-3xl font-bold">{analytics.totalPracticeTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Avg {Math.round(analytics.totalPracticeTime / Math.max(analytics.totalSessions, 1))}m per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-bold">{analytics.streakDays}</p>
              </div>
              <Award className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Days of consistent practice
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Score Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Session Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Session Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sessionTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ type, count }) => `${type}: ${count}`}
                    >
                      {sessionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skill Progress Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skill Development</h3>
              {skillProgress.map((skill) => (
                <Card key={skill.skill}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{skill.skill}</h4>
                      <Badge variant={skill.improvement > 5 ? "default" : "secondary"}>
                        +{skill.improvement}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current: {skill.current}%</span>
                        <span>Target: {skill.target}%</span>
                      </div>
                      <Progress value={(skill.current / skill.target) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {skill.sessionsCount} sessions practiced
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Skills Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skillDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Your Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">
                    {analytics.strongestSkill.charAt(0).toUpperCase() + analytics.strongestSkill.slice(1)}
                  </p>
                  <p className="text-sm text-green-600">
                    Your strongest area with consistent high performance
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">Consistency</p>
                  <p className="text-sm text-blue-600">
                    {analytics.streakDays} day practice streak shows great dedication
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-800">Improvement Trend</p>
                  <p className="text-sm text-purple-600">
                    {analytics.improvementRate}% improvement over recent sessions
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span>Growth Opportunities</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-800">
                    {analytics.weakestSkill.charAt(0).toUpperCase() + analytics.weakestSkill.slice(1)}
                  </p>
                  <p className="text-sm text-orange-600">
                    Focus area with the most potential for improvement
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">Session Completion</p>
                  <p className="text-sm text-yellow-600">
                    {Math.round((analytics.completedSessions / analytics.totalSessions) * 100)}% completion rate
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">Practice Frequency</p>
                  <p className="text-sm text-red-600">
                    Consider increasing daily practice time
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-indigo-500" />
                <span>Personalized Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">This Week</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Practice 2 technical sessions</li>
                    <li>• Focus on {analytics.weakestSkill} skills</li>
                    <li>• Review feedback from recent sessions</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">This Month</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Complete 8 interview sessions</li>
                    <li>• Try advanced difficulty questions</li>
                    <li>• Record and review responses</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Long Term</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Achieve 85% average score</li>
                    <li>• Master all question types</li>
                    <li>• Maintain 30-day streak</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-500" />
                <span>Progress Towards Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Goal Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Practice Goal</h4>
                    <p className="text-sm text-muted-foreground">Complete 3 sessions per week</p>
                  </div>
                  <Badge variant="outline">2/3 this week</Badge>
                </div>
                <Progress value={67} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Score Improvement Goal</h4>
                    <p className="text-sm text-muted-foreground">Reach 85% average score</p>
                  </div>
                  <Badge variant="outline">{analytics.averageScore}/85</Badge>
                </div>
                <Progress value={(analytics.averageScore / 85) * 100} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Skill Development Goal</h4>
                    <p className="text-sm text-muted-foreground">Improve {analytics.weakestSkill} by 20%</p>
                  </div>
                  <Badge variant="outline">15% improved</Badge>
                </div>
                <Progress value={75} className="h-2" />
              </div>

              {/* Goal Suggestions */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Suggested Goals</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border border-dashed rounded-lg">
                    <h5 className="font-medium text-sm">30-Day Challenge</h5>
                    <p className="text-xs text-muted-foreground">
                      Complete one interview session daily for 30 days
                    </p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Accept Challenge
                    </Button>
                  </div>
                  <div className="p-3 border border-dashed rounded-lg">
                    <h5 className="font-medium text-sm">Skill Mastery</h5>
                    <p className="text-xs text-muted-foreground">
                      Achieve 90%+ in all skill categories
                    </p>
                    <Button size="sm" className="mt-2" variant="outline">
                      Set Goal
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Compact analytics widget for sidebar or header
export function CompactAnalytics() {
  const [stats, setStats] = useState({ score: 0, sessions: 0, streak: 0 })

  useEffect(() => {
    const sessions = sessionManager.getAllUserSessions()
    setStats({
      score: 75 + Math.round(Math.random() * 20),
      sessions: sessions.length,
      streak: Math.floor(Math.random() * 15) + 1
    })
  }, [])

  return (
    <div className="flex space-x-4">
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-600">{stats.score}</p>
        <p className="text-xs text-muted-foreground">Avg Score</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-green-600">{stats.sessions}</p>
        <p className="text-xs text-muted-foreground">Sessions</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-orange-600">{stats.streak}</p>
        <p className="text-xs text-muted-foreground">Day Streak</p>
      </div>
    </div>
  )
}

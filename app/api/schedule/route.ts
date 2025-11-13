import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const from_date = searchParams.get("from_date")
    const to_date = searchParams.get("to_date")

    let query = supabase
      .from("scheduled_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: true })

    if (status) {
      query = query.eq("status", status)
    }

    if (from_date) {
      query = query.gte("scheduled_date", from_date)
    }

    if (to_date) {
      query = query.lte("scheduled_date", to_date)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error("Error fetching scheduled sessions:", error)
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error in GET /api/schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { template_id, scheduled_date, notes } = body

    if (!template_id || !scheduled_date) {
      return NextResponse.json(
        { error: "Missing required fields: template_id, scheduled_date" },
        { status: 400 }
      )
    }

    const { data: templates } = await import("@/data/interview-templates").then(
      (mod) => ({ data: mod.interviewTemplates })
    )
    const template = templates.find((t) => t.id === template_id)

    if (!template) {
      return NextResponse.json({ error: "Invalid template_id" }, { status: 400 })
    }

    const sessionData = {
      user_id: user.id,
      template_id,
      template_name: template.name,
      scheduled_date,
      duration: template.duration,
      difficulty: template.difficulty,
      interview_type: template.category,
      status: "scheduled",
      reminder_sent: false,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: session, error } = await supabase
      .from("scheduled_sessions")
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error("Error creating scheduled session:", error)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/schedule:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

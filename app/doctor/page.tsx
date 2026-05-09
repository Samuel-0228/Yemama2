'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { SAMPLE_DOCTORS, SAMPLE_LABS, SampleDoctor, SampleLab } from '@/lib/mock/doctor-lab-data'

type Appointment = {
  id: string
  title: string
  scheduled_at: string
  notes: string | null
  reminder_minutes: number | null
}

type FinderMode = 'online' | 'in-person'

export default function DoctorPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [mode, setMode] = useState<FinderMode>('online')
  const [userId, setUserId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctorToBook, setDoctorToBook] = useState<SampleDoctor | null>(null)
  const [selectedLabId, setSelectedLabId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0])
  const [appointmentTime, setAppointmentTime] = useState('09:00')
  const [notes, setNotes] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [savingAppointment, setSavingAppointment] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoadingAppointments(false)
        return
      }

      setUserId(user.id)
      await refreshAppointments(user.id)
    }
    init()
  }, [])

  const refreshAppointments = async (uid: string) => {
    setLoadingAppointments(true)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', uid)
        .order('scheduled_at', { ascending: true })
        .limit(20)
      if (error) throw error
      setAppointments((data || []) as Appointment[])
    } catch (err: any) {
      toast({
        title: 'Unable to load appointments',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoadingAppointments(false)
    }
  }

  const doctors = useMemo(
    () => SAMPLE_DOCTORS.filter((doctor) => doctor.contactType === mode),
    [mode]
  )

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((a) => new Date(a.scheduled_at).getTime() >= Date.now())
        .slice(0, 8),
    [appointments]
  )

  const selectedLab: SampleLab | undefined = useMemo(
    () => SAMPLE_LABS.find((lab) => lab.id === selectedLabId),
    [selectedLabId]
  )

  const startBooking = (doctor: SampleDoctor) => {
    setDoctorToBook(doctor)
    setSelectedLabId('')
    setAppointmentDate(new Date().toISOString().split('T')[0])
    setAppointmentTime('09:00')
    setNotes('')
    setUploadFile(null)
    setUploadedFileUrl('')
    setActionMessage('')
  }

  const uploadResult = async () => {
    if (!uploadFile || !userId) return
    setUploadingFile(true)
    try {
      const ext = uploadFile.name.split('.').pop() || 'bin'
      const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('medical-results')
        .upload(filePath, uploadFile, { upsert: false })
      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage.from('medical-results').getPublicUrl(filePath)
      setUploadedFileUrl(publicUrl.publicUrl)
      const { error: insertError } = await supabase.from('medical_results').insert({
        user_id: userId,
        file_url: publicUrl.publicUrl,
        file_type: uploadFile.type.includes('pdf') ? 'pdf' : 'image',
        notes: doctorToBook
          ? `Uploaded for ${doctorToBook.name} (${doctorToBook.specialty})`
          : 'Uploaded from Doctor and Lab Finder',
      })
      if (insertError) throw insertError
      setActionMessage('File uploaded and linked to your booking.')
      toast({ title: 'Upload complete' })
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description:
          err?.message ||
          'Unable to upload now. Confirm your Supabase storage bucket is named "medical-results".',
        variant: 'destructive',
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const saveAppointment = async () => {
    if (!userId || !doctorToBook) return
    setSavingAppointment(true)
    setActionMessage('')
    try {
      const scheduledAt = new Date(`${appointmentDate}T${appointmentTime}:00`)
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new Error('Please choose a valid date and time.')
      }

      const noteParts = [
        `Doctor: ${doctorToBook.name}`,
        `Specialty: ${doctorToBook.specialty}`,
        `Mode: ${doctorToBook.contactType}`,
        selectedLab ? `Lab: ${selectedLab.name}` : null,
        uploadedFileUrl ? `File: ${uploadedFileUrl}` : null,
        notes.trim() ? `Notes: ${notes.trim()}` : null,
      ].filter(Boolean)

      const { error } = await supabase.from('appointments').insert({
        user_id: userId,
        title: `${doctorToBook.name} (${doctorToBook.specialty})`,
        scheduled_at: scheduledAt.toISOString(),
        notes: noteParts.join(' | '),
        reminder_minutes: 30,
      })
      if (error) throw error

      await refreshAppointments(userId)
      setActionMessage('Appointment saved and added to Upcoming Appointments.')
      toast({ title: 'Appointment saved' })
    } catch (err: any) {
      toast({
        title: 'Unable to save appointment',
        description: err?.message || 'Try again.',
        variant: 'destructive',
      })
    } finally {
      setSavingAppointment(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl space-y-5 px-4 py-6">
      <Card className="p-5">
        <h1 className="text-xl font-semibold">Doctor and Lab Finder</h1>
        <p className="text-sm text-muted-foreground">
          Book online consultations or in-person visits, pick a lab, and upload test files in one place.
        </p>
      </Card>

      <div className="flex gap-2">
        <Button variant={mode === 'online' ? 'default' : 'outline'} onClick={() => setMode('online')}>
          Online doctors
        </Button>
        <Button variant={mode === 'in-person' ? 'default' : 'outline'} onClick={() => setMode('in-person')}>
          In-person doctors
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="p-4">
            <p className="font-semibold">{doctor.name}</p>
            <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            <p className="mt-1 text-xs text-muted-foreground">{doctor.location}</p>
            <div className="mt-3">
              <Button size="sm" onClick={() => startBooking(doctor)}>
                {mode === 'online' ? 'Contact / Book Appointment' : 'Book Visit'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {doctorToBook ? (
        <Card className="space-y-4 p-5">
          <div>
            <p className="text-sm font-semibold">Booking details</p>
            <p className="text-xs text-muted-foreground">
              Booking with {doctorToBook.name} ({doctorToBook.specialty}).
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
            <Input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
          </div>

          {doctorToBook.contactType === 'online' ? (
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-medium">Choose nearby lab</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {SAMPLE_LABS.map((lab) => (
                    <button
                      key={lab.id}
                      onClick={() => setSelectedLabId(lab.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedLabId === lab.id ? 'border-primary bg-primary/5' : 'border-border bg-background'
                      }`}
                    >
                      <p className="text-sm font-semibold">{lab.name}</p>
                      <p className="text-xs text-muted-foreground">{lab.location}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{lab.services.join(' • ')}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Upload ultrasound or test result</p>
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={uploadResult}
                  disabled={!uploadFile || uploadingFile || !userId}
                >
                  {uploadingFile ? 'Uploading...' : 'Upload file'}
                </Button>
              </div>
            </div>
          ) : null}

          <Input
            placeholder="Notes for this appointment (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button onClick={saveAppointment} disabled={savingAppointment || !userId}>
            {savingAppointment ? 'Saving appointment...' : 'Save appointment'}
          </Button>

          {actionMessage ? <p className="text-sm text-emerald-700">{actionMessage}</p> : null}
          {!userId ? <p className="text-sm text-amber-700">Sign in to save bookings and upload files.</p> : null}
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-sm font-semibold">Upcoming Appointments</p>
        {loadingAppointments ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading appointments...</p>
        ) : upcomingAppointments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No upcoming appointments yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="rounded-xl border bg-white p-3">
                <p className="text-sm font-semibold">{appointment.title}</p>
                <p className="text-xs text-muted-foreground">
                  Date: {new Date(appointment.scheduled_at).toLocaleDateString()} • Time:{' '}
                  {new Date(appointment.scheduled_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

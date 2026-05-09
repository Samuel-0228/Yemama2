'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Plus, Phone, Trash2 } from 'lucide-react'

export default function EmergencyPage() {
  const supabase = createClient()
  const [isLatePregnancy, setIsLatePregnancy] = useState(false)
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; phone: string }>>([])
  const [loadingContacts, setLoadingContacts] = useState(true)

  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setPhone('')
  }

  const loadContacts = async (uid: string) => {
    setLoadingContacts(true)
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('id,name,phone')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Unable to load contacts', description: error.message, variant: 'destructive' })
    } else {
      setContacts((data || []) as any)
    }
    setLoadingContacts(false)
  }

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('pregnancy_data').select('current_week').eq('user_id', user.id).maybeSingle()
      setIsLatePregnancy((data?.current_week || 0) >= 32)
      await loadContacts(user.id)
    }
    run()
  }, [])

  const startAdd = () => {
    resetForm()
    setOpen(true)
  }

  const startEdit = (c: { id: string; name: string; phone: string }) => {
    setEditingId(c.id)
    setName(c.name)
    setPhone(c.phone)
    setOpen(true)
  }

  const saveContact = async () => {
    const uid = userId
    if (!uid) {
      toast({ title: 'Please log in first', variant: 'destructive' })
      return
    }

    const cleanName = name.trim()
    const cleanPhone = phone.trim()
    if (!cleanName) {
      toast({ title: 'Contact name is required', variant: 'destructive' })
      return
    }
    if (!cleanPhone) {
      toast({ title: 'Phone number is required', variant: 'destructive' })
      return
    }

    const payload = { user_id: uid, name: cleanName, phone: cleanPhone }

    const { error } = editingId
      ? await supabase.from('emergency_contacts').update(payload).eq('id', editingId).eq('user_id', uid)
      : await supabase.from('emergency_contacts').insert(payload)

    if (error) {
      toast({ title: 'Unable to save contact', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: editingId ? 'Contact updated' : 'Contact added' })
    setOpen(false)
    resetForm()
    await loadContacts(uid)
  }

  const deleteContact = async (id: string) => {
    const uid = userId
    if (!uid) return
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', id).eq('user_id', uid)
    if (error) {
      toast({ title: 'Unable to delete contact', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Contact deleted' })
    await loadContacts(uid)
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl space-y-4 px-4 py-6">
      {isLatePregnancy ? (
        <Card className="border-red-500 bg-red-50 p-4">
          <p className="font-semibold text-red-700">Labor Mode Priority Active</p>
          <p className="text-sm text-red-600">Emergency controls are highlighted for late-stage pregnancy.</p>
        </Card>
      ) : null}
      <Card className="p-4">
        <h1 className="text-xl font-semibold">Emergency Assistance</h1>
        <p className="text-sm text-muted-foreground">One tap access to emergency services and saved contacts.</p>
      </Card>
      <div className="grid gap-3">
        <a href="tel:911">
          <Button className="w-full bg-red-600 hover:bg-red-700">Call Emergency Services</Button>
        </a>
        <a href="tel:939">
          <Button className="w-full" variant="outline">Call Ambulance</Button>
        </a>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Emergency Contacts</p>
            <p className="text-xs text-muted-foreground">Add the people you want to reach fast.</p>
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
              <Button onClick={startAdd} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit contact' : 'Add contact'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (e.g. +2519...)" />
                <Button onClick={saveContact} className="w-full">
                  {editingId ? 'Save changes' : 'Save contact'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4 space-y-2">
          {loadingContacts ? (
            <p className="text-sm text-muted-foreground">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts yet. Add one above.</p>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${c.phone}`}>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                  </a>
                  <Button size="icon" variant="outline" onClick={() => startEdit(c)} title="Edit contact">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => deleteContact(c.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete contact"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

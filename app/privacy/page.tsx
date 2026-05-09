import { Card } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl space-y-4 px-4 py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Yemama respects your privacy and protects your health information.
        </p>
      </Card>

      <Card className="space-y-4 p-6 text-sm text-muted-foreground">
        <section>
          <h2 className="font-semibold text-foreground">1. Data we collect</h2>
          <p>We collect account details, health logs, appointments, and files you upload to provide app features.</p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">2. How we use data</h2>
          <p>We use your data to show tracking insights, enable reminders, and support doctor/lab workflows you initiate.</p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">3. Security</h2>
          <p>We use authenticated access controls and database policies to limit data access to your own account.</p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">4. Your choices</h2>
          <p>You can update or delete your records at any time from your account where supported by app features.</p>
        </section>
      </Card>
    </div>
  )
}

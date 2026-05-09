import { Card } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl space-y-4 px-4 py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold">Terms of Use</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          By using Yemama, you agree to these terms.
        </p>
      </Card>

      <Card className="space-y-4 p-6 text-sm text-muted-foreground">
        <section>
          <h2 className="font-semibold text-foreground">1. Purpose of service</h2>
          <p>Yemama provides wellness tracking tools and educational guidance for health support.</p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">2. Medical disclaimer</h2>
          <p>The app does not provide medical diagnosis. Always consult licensed clinicians for medical decisions.</p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">3. User responsibilities</h2>
          <p>You are responsible for maintaining account security and entering accurate information.</p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">4. Availability and updates</h2>
          <p>We may improve, modify, or discontinue features as part of ongoing product updates.</p>
        </section>
      </Card>
    </div>
  )
}

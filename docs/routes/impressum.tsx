/** Impressum (Legal Notice) — required by German law (§ 5 DDG). */
export default function ImpressumPage() {
  return (
    <>
      <h1 class="text-3xl font-bold text-[var(--denote-text)] mb-8 font-[var(--denote-font-heading)]">
        Impressum
      </h1>

      <div class="prose prose-lg text-[var(--denote-text-secondary)] space-y-6">
        <section class="text-sm text-[var(--denote-text-muted)] italic space-y-3">
          <p>
            If you don't speak German or live in Germany, this page is
            irrelevant to you. German law requires every website to have one.
            Yes, even a developer documentation framework.
          </p>
          <p>
            Falls du Deutsch sprichst: Ja, ein Impressum. Für ein
            Developer-Docs-Framework. Dass so ein Gesetz existiert, hat eine
            ganze Abmahnindustrie hervorgebracht, die nur existiert, weil das
            Gesetz existiert. Ein sich selbst erhaltendes Bürokratie-Ökosystem.
            Willkommen in Deutschland.
          </p>
        </section>

        <hr class="border-[var(--denote-border)]" />

        <section>
          <h2 class="text-xl font-semibold text-[var(--denote-text)] mb-3">
            Angaben gemäß § 5 DDG
          </h2>
          <p>
            Reed von Redwitz<br />
            c/o COCENTER<br />
            Koppoldstr. 1<br />
            86551 Aichach
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--denote-text)] mb-3">
            Kontakt
          </h2>
          <p>
            E-Mail:{" "}
            <a
              href="mailto:legal@denote.sh"
              class="text-[var(--denote-primary-text)] hover:underline"
            >
              legal@denote.sh
            </a>
          </p>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-[var(--denote-text)] mb-3">
            Haftungsausschluss
          </h2>

          <h3 class="text-lg font-medium text-[var(--denote-text)] mb-2">
            Haftung für Inhalte
          </h3>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für
            die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können
            wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir
            gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir
            als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
            gespeicherte fremde Informationen zu überwachen.
          </p>

          <h3 class="text-lg font-medium text-[var(--denote-text)] mb-2 mt-4">
            Haftung für Links
          </h3>
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten
            Seiten ist stets der jeweilige Anbieter verantwortlich.
          </p>
        </section>
      </div>
    </>
  );
}

import Hero from "@/features/hero/Hero";

import CursorReadout from "@/features/lab/CursorReadout";

/**
 * Phase 0 cursor review. The real hero is at the top (bright crests, huge
 * type), a light capture follows, then every role: view, play, link, disabled,
 * range, text input, textarea and select. The readout shows the live role.
 */
export default function CursorLabPage() {
  return (
    <>
      <main>
        <Hero />

        <section className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-8)]">
          <p className="ui-label m-0">01 / Project card — view</p>

          <a
            href="#cursor-controls"
            data-cursor="view"
            className="group relative mt-[var(--space-4)] block overflow-hidden bg-ink no-underline"
          >
            <img
              src="/work/anom-creative/hero.webp"
              alt="Anom Creative homepage"
              width={1440}
              height={900}
              className="block aspect-[16/10] w-full object-cover object-top"
            />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 bg-lime px-3 py-2 font-label text-t-12 uppercase tracking-[var(--track)] text-ink">
              View project
            </span>
          </a>
        </section>

        <section className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-8)]">
          <p className="ui-label m-0">02 / Light capture — contrast</p>

          <div
            data-cursor="view"
            className="group relative mt-[var(--space-4)] block overflow-hidden bg-bone"
          >
            <img
              src="/work/fambam/hero.webp"
              alt="FamBam homepage, a light layout"
              width={1440}
              height={900}
              className="block aspect-[16/10] w-full object-cover object-top"
            />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 bg-ink px-3 py-2 font-label text-t-12 uppercase tracking-[var(--track)] text-bone">
              View project
            </span>
          </div>
        </section>

        <section className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-8)]">
          <p className="ui-label m-0">03 / Video — play</p>

          <div
            data-cursor="play"
            className="relative mt-[var(--space-4)] overflow-hidden bg-ink"
          >
            <img
              src="/work/anom-creative/mid-1.webp"
              alt="Anom Creative case study frame"
              width={1440}
              height={900}
              className="block aspect-[16/10] w-full object-cover object-top opacity-70"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-bone font-label text-t-12 uppercase tracking-[var(--track)] text-ink">
                Play
              </span>
            </span>
          </div>
        </section>

        <section
          id="cursor-controls"
          className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-8)]"
        >
          <p className="ui-label m-0">04 / Controls and text</p>

          <div className="mt-[var(--space-4)] grid gap-[var(--space-6)] md:grid-cols-2">
            <div className="grid content-start gap-[var(--space-3)]">
              <a href="#cursor-controls" className="link-line w-fit text-t-16">
                A normal link
              </a>

              <button
                type="button"
                className="w-fit border border-[var(--line-strong)] px-5 py-3 font-label text-t-12 uppercase tracking-[var(--track)] transition-colors duration-200 hover:border-lime hover:text-lime"
              >
                A normal button
              </button>

              <div
                role="button"
                aria-disabled="true"
                data-cursor="disabled"
                className="w-fit cursor-not-allowed border border-[var(--line-hairline)] px-5 py-3 font-label text-t-12 uppercase tracking-[var(--track)] text-fg-subtle"
              >
                Unavailable
              </div>

              <label className="grid gap-2">
                <span className="ui-label">Range</span>
                <input type="range" min={0} max={100} defaultValue={40} className="accent-lime" />
              </label>
            </div>

            <div className="grid content-start gap-[var(--space-3)]">
              <label className="grid gap-2">
                <span className="ui-label">Name</span>
                <input
                  type="text"
                  placeholder="Type here — the OS I-beam returns"
                  className="border border-[var(--line-strong)] bg-transparent px-4 py-3 text-t-16 text-bone placeholder:text-fg-subtle"
                />
              </label>

              <label className="grid gap-2">
                <span className="ui-label">Message</span>
                <textarea
                  rows={3}
                  placeholder="A textarea keeps the I-beam"
                  className="border border-[var(--line-strong)] bg-transparent px-4 py-3 text-t-16 text-bone placeholder:text-fg-subtle"
                />
              </label>

              <label className="grid gap-2">
                <span className="ui-label">Select</span>
                <select className="border border-[var(--line-strong)] bg-black px-4 py-3 text-t-16 text-bone">
                  <option>First option</option>
                  <option>Second option</option>
                </select>
              </label>
            </div>
          </div>

          <p className="mt-[var(--space-6)] max-w-[var(--measure-body)] text-t-14 uppercase tracking-[var(--track)] text-fg-subtle">
            Move through every block: the role readout follows. Keyboard focus
            rings are untouched; the custom cursor is aria-hidden and never
            receives a pointer.
          </p>
        </section>
      </main>

      <CursorReadout />
    </>
  );
}

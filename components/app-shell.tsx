export function AppShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-4rem] top-16 h-40 w-40 rounded-full bg-[var(--gold)]/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 right-[-3rem] h-52 w-52 rounded-[2.5rem] bg-[var(--cream)]/70"
      />
      <main className={`relative mx-auto flex min-h-screen flex-col gap-8 px-6 py-12 ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
        {children}
      </main>
    </div>
  );
}

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
      <main
        className="relative mx-auto flex min-h-screen w-full flex-col gap-10 px-8 py-12 sm:px-12 lg:px-16 xl:px-20 lg:py-16"
      >
        {children}
      </main>
    </div>
  );
}

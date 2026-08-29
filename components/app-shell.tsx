export function AppShell({
  children,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-3.5rem] top-14 h-36 w-36 rounded-full bg-[var(--accent)]/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-2.5rem] top-28 h-28 w-28 rounded-[2rem] bg-[var(--mint)]/35"
      />
      <div
        aria-hidden
        className="sticker-smile pointer-events-none absolute bottom-12 left-[12%]"
      />
      <main className="relative mx-auto flex min-h-screen w-full flex-col gap-10 px-8 py-12 sm:px-12 lg:px-16 xl:px-20 lg:py-16">
        {children}
      </main>
    </div>
  );
}

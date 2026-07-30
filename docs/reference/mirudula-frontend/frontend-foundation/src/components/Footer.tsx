export function Footer() {
  return (
    <footer className="bg-brand-navy px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold">NRITAX 2.0</p>
          <p className="mt-1 text-sm text-blue-100">
            Frontend foundation for the NRI income tax filing platform.
          </p>
        </div>
        <p className="text-sm text-blue-100">Frontend foundation. Backend integrations pending.</p>
      </div>
    </footer>
  );
}

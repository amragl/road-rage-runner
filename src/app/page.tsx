export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <main className="flex flex-col items-center justify-center gap-8 p-8 text-center">
        <h1
          className="text-2xl text-[#00E5FF]"
          style={{ fontFamily: "var(--font-press-start)" }}
        >
          Road Rage Runner
        </h1>
        <p className="text-lg text-zinc-400">
          Coming soon — an endless driving game
        </p>
      </main>
    </div>
  );
}

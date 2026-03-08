export default function LobbyPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="text-center">
        <h1 className="font-mono text-2xl text-primary sm:text-3xl">
          {'> LOBBY'}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Waiting for players...
        </p>
      </div>
    </main>
  )
}

import Link from 'next/link'
import { MAX_PROMPT_WORDS, AI_SKILLS, TOTAL_ROUNDS } from '@/lib/constants'

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary touch-manipulation"
      >
        &larr; Back
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-primary sm:text-4xl">
          HOW TO PLAY
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jailnabi — the AI accusation party game
        </p>
      </div>

      {/* Game loop */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">How It Works</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              1
            </span>
            <p>
              <strong>Create a room</strong> — Pick a name, write an absurd
              crime, and make your opening accusation. Share the room code with
              friends.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              2
            </span>
            <p>
              <strong>Join & start</strong> — 2-6 players join the lobby. The
              host starts the game. One random player is initially accused.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              3
            </span>
            <p>
              <strong>Play {TOTAL_ROUNDS} rounds</strong> — Each round, write
              one prompt (max {MAX_PROMPT_WORDS} words). Defend yourself AND/OR
              accuse someone else. AI generates fake evidence from your prompt.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              4
            </span>
            <p>
              <strong>Vote & score</strong> — After all evidence is revealed,
              vote on the most convincing. AI scores guilt (60%) + player votes
              (40%). Leaderboard updates.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
              5
            </span>
            <p>
              <strong>Verdict</strong> — Most guilty player is convicted. Get a
              shareable jail card with your sentence!
            </p>
          </li>
        </ol>
      </section>

      {/* AI Skills */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">AI Skills</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Each room features an AI skill. Use it in your prompt for better
          results!
        </p>
        <div className="space-y-2">
          {AI_SKILLS.map((skill) => (
            <div key={skill.id} className="card p-3">
              <p className="font-semibold text-primary">{skill.name}</p>
              <p className="text-sm text-muted-foreground">{skill.tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

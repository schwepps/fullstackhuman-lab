'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { GameCanvas } from '@/components/game/game-canvas'
import { ChatBubble } from '@/components/game/chat-bubble'
import { ChatInput } from '@/components/game/chat-input'
import { TopicBanner } from '@/components/game/topic-banner'
import { LobbyPanel } from '@/components/game/lobby-panel'
import { VotePanel } from '@/components/game/vote-panel'
import { EliminationScreen } from '@/components/game/elimination-screen'
import { RevealScreen } from '@/components/game/reveal-screen'
import { useGameSocket } from '@/hooks/game/use-game-socket'
import type { PlayerType } from '@/lib/game/types'

export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const {
    status,
    myPlayerId,
    myColor,
    socket,
    currentZone,
    messages,
    isChatFocused,
    typingPlayers,
    phase,
    round,
    topic,
    roundStartedAt,
    lobbyPlayers,
    isHost,
    roundDuration,
    voteCount,
    totalVoters,
    voteStartedAt,
    eliminatedName,
    isEliminated,
    revealResult,
    revealPlayers,
    revealRoundResults,
    isSpectator,
    lobbyError,
    myDisplayName,
    setCurrentZone,
    setIsChatFocused,
    clearEliminatedName,
  } = useGameSocket(roomId)

  const handlePositionUpdate = useCallback(() => {}, [])

  const handleSendChat = useCallback(
    (content: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({ type: 'chat', content, zone: currentZone })
        )
      }
    },
    [socket, currentZone]
  )

  const handleVote = useCallback(
    (targetId: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'vote', targetId }))
      }
    },
    [socket]
  )

  const handleLobbyReady = useCallback(
    (displayName: string, playerType: PlayerType, customPrompt?: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'ready',
            displayName,
            playerType,
            customPrompt,
          })
        )
      }
    },
    [socket]
  )

  if (status !== 'connected' || !myPlayerId) {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-mono text-2xl text-primary sm:text-3xl">
            {status === 'error' ? (
              '> CONNECTION_ERROR'
            ) : (
              <>
                {'> INITIALIZING'}
                <span className="animate-pulse">_</span>
              </>
            )}
          </h1>
        </div>
      </main>
    )
  }

  // Reveal phase
  if (phase === 'reveal' && revealResult) {
    return (
      <RevealScreen
        result={revealResult}
        allPlayers={revealPlayers}
        roundResults={revealRoundResults}
      />
    )
  }

  // Lobby phase
  if (phase === 'lobby') {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-background p-2 sm:p-4">
        <LobbyPanel
          roomId={roomId}
          isHost={isHost}
          players={lobbyPlayers}
          lobbyError={lobbyError}
          onReady={handleLobbyReady}
        />
      </main>
    )
  }

  // Filter messages and typing indicators for current zone
  const zoneMessages = messages.filter((m) => m.zone === currentZone)
  const zoneTyping = typingPlayers
    .filter((t) => t.zone === currentZone)
    .map((t) => ({ playerId: t.playerId, displayName: t.displayName }))

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-2 sm:p-4">
      {phase === 'round' && topic && (
        <div className="w-full max-w-300">
          <TopicBanner
            round={round}
            topic={topic}
            roundDuration={roundDuration}
            roundStartedAt={roundStartedAt}
          />
        </div>
      )}
      <div className="relative w-full max-w-300">
        <GameCanvas
          socket={socket}
          myPlayerId={isSpectator ? null : myPlayerId}
          myDisplayName={myDisplayName}
          myColor={myColor}
          isChatFocused={isChatFocused}
          onPositionUpdate={handlePositionUpdate}
          onZoneChange={setCurrentZone}
        />
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-mono text-xs text-accent">
            {isSpectator ? 'SPECTATING' : 'LIVE'}
          </span>
        </div>
      </div>
      <div className="mt-2 w-full max-w-300">
        <ChatBubble messages={zoneMessages} typingPlayers={zoneTyping} />
        <div className="mt-1 pb-safe">
          {isSpectator ? (
            <div className="flex h-11 w-full items-center gap-1 border border-border px-3 font-mono text-base text-muted-foreground sm:text-sm">
              <span>{'>'}</span>
              <span>SPECTATING — watching the game</span>
            </div>
          ) : (
            <ChatInput
              onSend={handleSendChat}
              onFocusChange={setIsChatFocused}
              disabled={phase !== 'round'}
              placeholder={phase === 'vote' ? 'VOTING...' : undefined}
            />
          )}
        </div>
      </div>
      {phase === 'vote' && myPlayerId && !isEliminated && !isSpectator && (
        <VotePanel
          candidates={lobbyPlayers}
          myPlayerId={myPlayerId}
          onVote={handleVote}
          voteCount={voteCount}
          totalVoters={totalVoters}
          voteStartedAt={voteStartedAt}
        />
      )}

      {eliminatedName && (
        <EliminationScreen
          displayName={eliminatedName}
          onComplete={clearEliminatedName}
        />
      )}
    </main>
  )
}

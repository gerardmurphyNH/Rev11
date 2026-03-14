'use client'

interface ShareButtonsProps {
  score: number
  opponent: string
  matchId: string
}

export default function ShareButtons({ score, opponent, matchId }: ShareButtonsProps) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${appUrl}/share/${matchId}`
  const text = `I scored ${score}/11 on Rev11 for #NERevs vs ${opponent}! Can you beat me?`

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=NERevs,Rev11`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const redditUrl = `https://www.reddit.com/r/newenglandrevolution/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`

  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-xs uppercase tracking-widest text-[#C5A55A] text-center"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        Brag to The Fort
      </p>
      <div className="flex gap-2 justify-center">
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          𝕏 Post
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0d6de0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Facebook
        </a>
        <a
          href={redditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#FF4500] hover:bg-[#e03d00] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Reddit
        </a>
      </div>
    </div>
  )
}

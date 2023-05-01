import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Link from 'next/link'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <nav className='border-b p-6'>
        <p className='text-4xl font-bold'>Metavarse NFT Store</p>
        <div className="flex mt-4"></div>
        <Link href="/" className='mr-4 text-teal-950'>
          Home
        </Link>
        <Link href="/create-nft" className='mr-4 text-teal-950'>
          Sell NFT
        </Link>
        <Link href="/my-nfts" className='mr-4 text-teal-950'>
          My NFTs
        </Link>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

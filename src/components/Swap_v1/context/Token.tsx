import React, { useContext, useState, useEffect } from 'react'
import * as assert from 'assert'
import { useAsync } from 'react-async-hook'
import { Provider, BN } from '@project-serum/anchor'
import { PublicKey, Account } from '@solana/web3.js'
import { MintInfo, AccountInfo as TokenAccount, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getOwnedAssociatedTokenAccounts, parseTokenAccountData } from '../utils/tokens'
import { SOL_MINT } from '../utils/pubkeys'
import moment from 'moment'
import { useInterval } from '../../../utils/useInterval'

export type TokenContext = {
  provider: Provider
  ownedTokenAccounts: Array<{
    publicKey: PublicKey
    account: TokenAccount
  }>
  balanceRefresh
}
const _TokenContext = React.createContext<TokenContext | null>(null)

// balanceRefresh Null => none exists.
// balanceRefresh Undefined => loading.
export function TokenContextProvider(props: any) {
  const provider = props.provider
  const [, setRefresh] = useState(0)
  const [balanceRefresh, setBalanceRefresh] = useState<number | undefined | null>(undefined)
  const [ownedTokenAccounts, setOwnedTokenAccounts] = useState<
    Array<{
      publicKey: PublicKey
      account: TokenAccount
    }>
  >([])

  useInterval(() => {
    if (provider.wallet.publicKey && provider.wallet.publicKey.toBase58() !== '11111111111111111111111111111111') {
      setBalanceRefresh(moment.now())
    }
  }, 3000)

  // Fetch all the owned token accounts for the wallet.
  useEffect(() => {
    async function getSplWalletBalance() {
      if (!provider.wallet.publicKey || provider.wallet.publicKey.toBase58() === '11111111111111111111111111111111') {
        setOwnedTokenAccounts([])
        setRefresh((r) => r + 1)
        return
      }

      const tokensAccounts: Array<{
        publicKey: PublicKey
        account: TokenAccount
      }> = []

      // Fetch SPL tokens.
      const splTokenAccounts = await getOwnedAssociatedTokenAccounts(provider.connection, provider.wallet.publicKey)
      if (splTokenAccounts) {
        // @ts-ignore
        tokensAccounts.push(...splTokenAccounts)
      }
      const solBlanace = await provider.connection.getAccountInfo(provider.wallet.publicKey)
      if (solBlanace) {
        const newAccount = {
          publicKey: provider.wallet.publicKey,
          // @ts-ignore
          account: {
            amount: new BN(solBlanace.lamports),
            mint: SOL_MINT,
          },
        } as any
        tokensAccounts.push(newAccount)
      }

      // @ts-ignore
      setOwnedTokenAccounts([...tokensAccounts])
      setRefresh((r) => r + 1)
    }

    getSplWalletBalance()
  }, [provider.wallet.publicKey, provider.connection, balanceRefresh])

  return (
    <_TokenContext.Provider
      value={{
        provider,
        ownedTokenAccounts,
        balanceRefresh,
      }}
    >
      {props.children}
    </_TokenContext.Provider>
  )
}

function useTokenContext() {
  const ctx = useContext(_TokenContext)
  if (ctx === null) {
    throw new Error('Context not available')
  }
  return ctx
}

// Null => none exists.
// Undefined => loading.
export function useOwnedTokenAccount(
  mint?: PublicKey,
): { publicKey: PublicKey; account: TokenAccount } | null | undefined {
  const { provider, ownedTokenAccounts, balanceRefresh } = useTokenContext()
  const [, setRefresh] = useState(0)

  const tokenAccounts = ownedTokenAccounts.filter((account) => mint && account.account.mint.equals(mint)) ?? []

  // Take the account with the most tokens in it.
  tokenAccounts.sort((a, b) => (a.account.amount > b.account.amount ? -1 : a.account.amount < b.account.amount ? 1 : 0))

  let tokenAccount = tokenAccounts[0]
  const isSol = mint?.equals(SOL_MINT)

  // Stream updates when the balance changes.
  useEffect(() => {
    let listener: number
    // SOL is special cased since it's not an SPL token.
    if (tokenAccount && isSol) {
      listener = provider.connection.onAccountChange(provider.wallet.publicKey, (info: { lamports: number }) => {
        const token = {
          amount: new BN(info.lamports),
          mint: SOL_MINT,
        } as TokenAccount
        if (token.amount !== tokenAccount.account.amount) {
          const index = ownedTokenAccounts.indexOf(tokenAccount)
          assert.ok(index >= 0)
          ownedTokenAccounts[index].account = token
          setRefresh((r) => r + 1)
        }
      })
    }
    // SPL tokens.
    else if (tokenAccount) {
      listener = provider.connection.onAccountChange(tokenAccount.publicKey, (info) => {
        if (info.data.length !== 0) {
          try {
            const token = parseTokenAccountData(info.data)
            if (token.amount !== tokenAccount.account.amount) {
              const index = ownedTokenAccounts.indexOf(tokenAccount)
              assert.ok(index >= 0)
              ownedTokenAccounts[index].account = token
              setRefresh((r) => r + 1)
            }
          } catch (error) {
            console.log('Failed to decode token AccountInfo')
          }
        }
      })
    }
    return () => {
      if (listener) {
        provider.connection.removeAccountChangeListener(listener)
      }
    }
  }, [provider.connection, tokenAccount])

  if (mint === undefined) {
    return undefined
  }

  if (!isSol && tokenAccounts.length === 0) {
    return null
  }

  if (!balanceRefresh) {
    return undefined
  }

  return tokenAccount
}

export function useMint(mint?: PublicKey): MintInfo | undefined | null {
  const { provider } = useTokenContext()
  // Lazy load the mint account if needeed.
  const asyncMintInfo = useAsync(async () => {
    if (!mint) {
      return undefined
    }
    if (_MINT_CACHE.get(mint.toString())) {
      return _MINT_CACHE.get(mint.toString())
    }

    const mintClient = new Token(provider.connection, mint, TOKEN_PROGRAM_ID, new Account())
    const mintInfo = mintClient.getMintInfo()
    _MINT_CACHE.set(mint.toString(), mintInfo)
    return mintInfo
  }, [provider.connection, mint])

  if (asyncMintInfo.result) {
    return asyncMintInfo.result
  }
  return undefined
}

export function setMintCache(pk: PublicKey, account: MintInfo) {
  _MINT_CACHE.set(pk.toString(), new Promise((resolve) => resolve(account)))
}

// Cache storing all previously fetched mint infos.
// @ts-ignore
const _MINT_CACHE = new Map<string, Promise<MintInfo>>([[SOL_MINT.toString(), { decimals: 9 }]])
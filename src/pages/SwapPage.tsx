import React, { useState, useEffect, useMemo } from "react";
import { Button, Grid, makeStyles } from "@material-ui/core";
import { Provider } from "@project-serum/anchor";
import { useSnackbar } from "notistack";
import TokenMints from "../config/token-mints.json"
// @ts-ignore
import Wallet from "@project-serum/sol-wallet-adapter";
import { WalletAdapter } from '../wallet-adapters';
import { useWallet } from "../utils/wallet";
import {
  Signer,
  ConfirmOptions,
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  TokenListContainer,
  TokenListProvider
} from "@solana/spl-token-registry";
import Swap from "../components/SwapWidget";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: "775px",
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    background: 'url(/images/ape-bg.svg) 162px -25px no-repeat;',
    marginBottom: 80,
  },
  widget: {
    paddingTop: 56,
    paddingLeft: 112,
    paddingRight: 112,
    width: "100%",
  }
}));

export default function SwapPage() {
  const styles = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const [tokenList, setTokenList] = useState<TokenListContainer | null>(null);
  let { wallet, connected } = useWallet();

  const network = "https://solape.genesysgo.net";
  if (!wallet) {
    wallet = new Wallet("https://www.sollet.io", network);
  }

  const [provider] = useMemo(() => {
    const opts: ConfirmOptions = {
      preflightCommitment: "recent",
      commitment: "recent",
    };
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new NotifyingProvider(
      connection,
      // @ts-ignore
      wallet,
      opts,
      (tx, err) => {
        if (err) {
          enqueueSnackbar(`Error: ${err.toString()}`, {
            variant: "error",
          });
        } else {
          enqueueSnackbar("Transaction sent", {
            variant: "success",
            action: (
              <Button
                color="inherit"
                component="a"
                target="_blank"
                rel="noopener"
                href={`https://explorer.solana.com/tx/${tx}`}
              >
                View on Solana Explorer
              </Button>
            ),
          });
        }
      }
    );
    return [provider];
  }, [enqueueSnackbar, wallet]);

  const sol = new PublicKey("Ejmc1UB4EsES5oAaRN63SpoxMJidt3ZGBrqrZk49vjTZ");
  const ref = process.env.REACT_APP_SOL_REFERRAL_FEES_ADDRESS  ? 
    new PublicKey(process.env.REACT_APP_SOL_REFERRAL_FEES_ADDRESS) 
    : undefined;

  useEffect(() => {
    const solapeTokens = {}
    TokenMints.forEach(t => {
      solapeTokens[t.name] = true
    })

    // Only show SolApe supported tokens
    new TokenListProvider().resolve().then((tokenList) => {
      const filteredList = tokenList.getList().filter(t => solapeTokens[t.symbol] && t.chainId === 101)
      setTokenList(new TokenListContainer(filteredList))
    });

  }, [setTokenList]);

  return (
    <Grid
      container
      justifyContent="flex-start"
      alignItems="flex-start"
      className={styles.root}
    >
      <div className={styles.widget}>
        {tokenList &&
          <Swap 
            containerStyle={{ 
              backgroundColor: '#1C2222',
              width: 424,
              borderRadius: 8,
              boxShadow: "0px 0px 30px 5px rgba(0,0,0,0.075)",
              padding: 0,
              background: "#1C2222",
              color: "#fff",
              "& button:hover": {
                opacity: 0.8,
              },
             }}
            swapTokenContainerStyle={{ 
              display: "flex",
              justifyContent: "space-between",
            }}
            contentStyle={{
              
            }} 
            referral={ref} 
            toMint={sol} 
            provider={provider} 
            tokenList={tokenList} />
        }
      </div>
    </Grid>
  );
}

// Custom provider to display notifications whenever a transaction is sent.
//
// Note that this is an Anchor wallet/network provider--not a React provider,
// so all transactions will be flowing through here, which allows us to
// hook in to display all transactions sent from the `Swap` component
// as notifications in the parent app.
class NotifyingProvider extends Provider {
  // Function to call whenever the provider sends a transaction;
  private onTransaction: (
    tx: TransactionSignature | undefined,
    err?: Error
  ) => void;

  constructor(
    connection: Connection,
    wallet: Wallet | WalletAdapter,
    opts: ConfirmOptions,
    onTransaction: (tx: TransactionSignature | undefined, err?: Error) => void
  ) {
    super(connection, wallet, opts);
    this.onTransaction = onTransaction;
  }

  async send(
    tx: Transaction,
    signers?: Array<Signer | undefined>,
    opts?: ConfirmOptions
  ): Promise<TransactionSignature> {
    try {
      const txSig = await super.send(tx, signers, opts);
      this.onTransaction(txSig);
      return txSig;
    } catch (err) {
      this.onTransaction(undefined, err);
      return "";
    }
  }

  async sendAll(
    txs: Array<{ tx: Transaction; signers: Array<Signer | undefined> }>,
    opts?: ConfirmOptions
  ): Promise<Array<TransactionSignature>> {
    try {
      const txSigs = await super.sendAll(txs, opts);
      txSigs.forEach((sig) => {
        this.onTransaction(sig);
      });
      return txSigs;
    } catch (err) {
      this.onTransaction(undefined, err);
      return [];
    }
  }
}
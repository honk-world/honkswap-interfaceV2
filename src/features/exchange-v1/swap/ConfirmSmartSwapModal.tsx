import { ChainId, Currency, CurrencyAmount, SmartBCH, Percent, TradeSmart } from '@tangoswapcash/sdk'
import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../../../modals/TransactionConfirmationModal'

import SmartSwapModalFooter from './SmartSwapModalFooter'
import SmartSwapModalHeader from './SmartSwapModalHeader'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param args either a pair of V2 trades or a pair of V3 trades
 */
function tradeMeaningfullyDiffers(
  ...args: [TradeSmart<Currency, Currency>, TradeSmart<Currency, Currency>]
): boolean {
  const [tradeA, tradeB] = args
  return (
    !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  )
}

export default function ConfirmSmartSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  feePercent,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  minerBribe,
}: {
  isOpen: boolean
  trade: TradeSmart<Currency, Currency> | undefined
  originalTrade: TradeSmart<Currency, Currency> | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: Percent
  feePercent: Percent
  minerBribe?: string
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
}) {
  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )

  const modalHeader = useCallback(() => {
    return trade ? (
      <SmartSwapModalHeader
        trade={trade}
        allowedSlippage={allowedSlippage}
        feePercent={feePercent}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
        minerBribe={minerBribe}
      />
    ) : null
  }, [allowedSlippage, feePercent, onAcceptChanges, recipient, showAcceptChanges, trade])

  const modalBottom = useCallback(() => {
    return trade ? (
      <SmartSwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
      />
    ) : null
  }, [onConfirm, showAcceptChanges, swapErrorMessage, trade])

  // text to show while loading
  const pendingText = `Swapping ${trade?.inputAmount?.toSignificant(6)} ${
    trade?.inputAmount?.currency?.symbol
  } for ${trade?.outputAmount?.toSignificant(6)} ${trade?.outputAmount?.currency?.symbol}`

  const pendingText2 = minerBribe
    ? trade?.outputAmount.currency.isNative
      ? `Minus ${CurrencyAmount.fromRawAmount(SmartBCH.onChain(ChainId.SMARTBCH), minerBribe).toSignificant(
          6
        )} BCH Miner Tip`
      : `Plus ${CurrencyAmount.fromRawAmount(SmartBCH.onChain(ChainId.SMARTBCH), minerBribe).toSignificant(
          6
        )} BCH Miner Tip`
    : undefined

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title="Confirm Swap"
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      pendingText2={pendingText2}
      currencyToAdd={trade?.outputAmount.currency}
    />
  )
}
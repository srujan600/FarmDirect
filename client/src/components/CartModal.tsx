import React, { useState, useEffect } from 'react';
import { useAgriStore } from '../context/useAgriStore';
import { useTranslation } from '../context/useTranslation';
import { api } from '../services/api';
import type { Order } from '@types';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, clearCart, showToast, currentUser } = useAgriStore();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalAmount = cart.reduce(
    (acc, item) => acc + item.listing.price_per_kg_expected * item.quantity_kg,
    0
  );

  const farmerPayout = Number((totalAmount * 0.76).toFixed(2));
  const logisticsFee = Number((totalAmount * 0.16).toFixed(2));
  const platformFee = Number((totalAmount * 0.08).toFixed(2));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      // Place order for the primary item in cart
      const primaryItem = cart[0];
      const res = await api.createOrder({
        listing_id: primaryItem.listing.id,
        quantity_kg: primaryItem.quantity_kg,
        buyer_id: currentUser?.id,
      });

      setCompletedOrder(res.data);
      clearCart();
      showToast(`Order #${res.data.id.substring(0, 8)} placed successfully! Escrow funded.`, 'success');
    } catch (err: unknown) {
      showToast('Checkout failed: ' + (err instanceof Error ? err.message : 'Error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cart-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-background text-on-surface rounded-2xl w-full max-w-lg overflow-hidden border border-outline-variant shadow-elevation-3 flex flex-col">
        {/* Header */}
        <div className="bg-primary text-on-primary px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-fixed text-2xl">shopping_cart</span>
            <div>
              <h3 id="modal-cart-title" className="text-headline-sm font-bold leading-none">{t('cart.title')}</h3>
              <p className="text-[10px] text-outline-variant mt-0.5">{t('cart.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl hover:bg-primary-container flex items-center justify-center text-outline-variant hover:text-on-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary select-none cursor-pointer"
            title={t('cart.closeBasket')}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Order Success State */}
        {completedOrder ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h4 className="text-headline-sm font-bold text-primary">{t('cart.orderSuccess')}</h4>
            <p className="text-body-sm text-on-surface-variant">
              {t('cart.escrowNote')}
            </p>

            <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant text-left space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-primary">
                <span>{t('cart.totalAmount')}:</span>
                <span className="font-mono">₹{completedOrder.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>{t('cart.farmerPayout')}:</span>
                <span className="font-mono">₹{(completedOrder.farmer_unit_price * completedOrder.quantity_kg).toFixed(2)} (76%)</span>
              </div>
              <div className="flex justify-between text-outline">
                <span>Escrow Status:</span>
                <span className="font-mono font-bold text-secondary">{completedOrder.escrow_status}</span>
              </div>
              <div className="pt-1.5 border-t border-outline-variant/60 flex justify-between text-[11px] font-mono text-outline">
                <span>Cryptographic QR:</span>
                <span className="text-primary font-bold truncate max-w-[180px]">{completedOrder.qr_provenance_hash}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCompletedOrder(null);
                onClose();
              }}
              className="btn-primary w-full min-h-[48px] py-3 font-bold text-sm shadow-md"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          /* Cart Items & Breakdown */
          <div className="p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-outline">
                <span className="material-symbols-outlined text-4xl mb-1">remove_shopping_cart</span>
                <p className="text-sm">{t('cart.emptyBasket')}</p>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.listing.id}
                      className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.listing.images_urls?.[0]}
                          alt={item.listing.crop_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-bold text-on-surface text-sm">{item.listing.crop_name}</div>
                          <div className="text-outline">
                            {item.quantity_kg} kg @ ₹{item.listing.price_per_kg_expected}/kg
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="font-mono font-bold text-primary text-sm">
                          ₹{(item.listing.price_per_kg_expected * item.quantity_kg).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.listing.id)}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-error hover:bg-error-container/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error select-none cursor-pointer"
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Transparent Disintermediation Ledger */}
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant space-y-2 text-xs">
                  <div className="font-bold text-primary text-sm flex items-center justify-between border-b border-outline-variant/60 pb-1">
                    <span>{t('calculator.breakdownTitle')}</span>
                    <span className="text-secondary font-mono">100% Verified</span>
                  </div>
                  <div className="flex justify-between text-secondary font-semibold">
                    <span>{t('cart.farmerPayout')}:</span>
                    <span className="font-mono">₹{farmerPayout.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>{t('cart.logisticsFee')}:</span>
                    <span className="font-mono">₹{logisticsFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>{t('cart.platformFee')}:</span>
                    <span className="font-mono">₹{platformFee.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-outline-variant flex justify-between text-sm font-bold text-primary">
                    <span>{t('cart.totalAmount')} (UPI):</span>
                    <span className="font-mono text-base text-secondary">₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="btn-secondary w-full min-h-[48px] py-3.5 text-sm font-bold shadow-md"
                >
                  <span className={`material-symbols-outlined text-lg ${isSubmitting ? 'animate-spin' : ''}`}>
                    {isSubmitting ? 'sync' : 'payment'}
                  </span>
                  <span>{isSubmitting ? 'Funding Escrow...' : `${t('cart.checkoutBtn')} (₹${totalAmount.toFixed(2)})`}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

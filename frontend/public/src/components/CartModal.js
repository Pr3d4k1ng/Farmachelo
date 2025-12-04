import React from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : 'http://localhost:8000/api';

const CartModal = ({ isOpen, onClose, cart, onUpdateCart, token }) => {
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(productId);
      return;
    }

    if (!token) {
      try {
        const raw = localStorage.getItem('cart');
        const local = raw ? JSON.parse(raw) : { items: [] };
        const itemIndex = local.items.findIndex(it => (it.product_id || it.id) === productId);
        if (itemIndex > -1) {
          local.items[itemIndex].quantity = newQuantity;
        }
        local.total = local.items.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 0)), 0);
        local.updated_at = new Date().toISOString();
        localStorage.setItem('cart', JSON.stringify(local));
        onUpdateCart({ id: null, user_id: null, items: local.items, updated_at: local.updated_at });
      } catch (e) {
        console.error('Error updating quantity in local cart:', e);
      }
      return;
    }

    // If authenticated, proceed with API call
      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }


      try {
        const response = await axios.delete(`${API}/cart/items/${productId}`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onUpdateCart(response.data);
      } catch (error) {
        console.error('Error removing item:', error);
      }

  };

  const removeItem = async (productId) => {
    if (!token) {
      try {
        const raw = localStorage.getItem('cart');
        const local = raw ? JSON.parse(raw) : { items: [] };
        const newItems = local.items.filter(it => (it.product_id || it.id) !== productId);
        local.items = newItems;
        local.total = local.items.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 0)), 0);
        local.updated_at = new Date().toISOString();
        localStorage.setItem('cart', JSON.stringify(local));
        onUpdateCart({ id: null, user_id: null, items: local.items, updated_at: local.updated_at });
      } catch (e) {
        console.error('Error removing item from local cart:', e);
      }
      return;
    }

    try {
      const response = await axios.delete(`${API}/cart/items/${productId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdateCart(response.data);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };


  const formatPrice = (price) => {
    const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericPrice);
  };

  const getTotalPrice = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🛒 Carrito de Compras</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="cart-content">
          {!cart || !cart.items || cart.items.length === 0 ? (
            <div className="empty-cart">
              <p>Tu carrito está vacío</p>
              <button onClick={onClose} className="continue-shopping-btn">
                Continuar comprando
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.items.map((item) => (
                  <div key={item.product_id || item.id} className="cart-item">
                    <div className="item-image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name || 'Producto'} />
                      ) : (
                        <div className="item-placeholder">🏥</div>
                      )}
                    </div>
                    
                    <div className="item-details">
                      <h4>{item.name || 'Producto'}</h4>
                      <p className="item-price">{formatPrice(item.price || 0)}</p>
                      {item.requires_prescription && (
                        <span className="prescription-note">💊 Requiere receta</span>
                      )}
                    </div>
                    
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button 
                          onClick={() => updateQuantity(item.product_id || item.id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product_id || item.id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.product_id || item.id)}
                        className="remove-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="total-section">
                  <h3>Total: {formatPrice(getTotalPrice())}</h3>
                </div>
                
                <div className="cart-actions">
                  <button onClick={onClose} className="continue-btn">
                    Continuar comprando
                  </button>
                  <button
                    className="checkout-btn"
                    onClick={() => {
                      onClose();
                      // Guardar el carrito actual en localStorage con el total
                      const cartData = {
                        items: cart.items,
                        total: getTotalPrice()
                      };
                      localStorage.setItem('cart', JSON.stringify(cartData));
                      window.location.href = "/payment.html";
                    }}
                  >
                    Proceder al pago
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

console.log('CartModal cart:', cart);

export default CartModal;
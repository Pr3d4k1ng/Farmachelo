import React from 'react';

const ProductCard = ({ product, onAddToCart, user }) => {
  const handleAddToCart = () => {
    if (!user) {
      alert('Debes iniciar sesión para agregar productos al carrito');
      return;
    }
    onAddToCart(product);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-placeholder">
            <span>🏥</span>
          </div>
        )}
        {product.requires_prescription && (
          <div className="prescription-badge">💊 Con receta</div>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-category">
          {product.category === 'prescription' ? '💊 Con receta' : '🟢 Sin receta'}
        </div>
        <div className="product-stock">
          Stock: {product.stock} unidades
        </div>
      </div>
      
      <div className="product-footer">
        <div className="product-price">${product.price.toLocaleString('es-CO')}</div>
        <button 
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

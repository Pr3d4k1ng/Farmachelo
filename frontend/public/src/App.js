import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import ProductCatalog from './components/ProductCatalog';
import CartModal from './components/CartModal';
import AdminAccess from './components/AdminAccess';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : 'http://localhost:8000/api';

// Componentes (mantén tus componentes existentes como Toast, Header, HeroSection, etc.)
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">×</button>
    </div>
  );
};

const Header = ({ user, onLogout, cartItemsCount, onShowAuth, onShowCart, onShowAdmin }) => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <span className="logo-text">🏥 Farmachelo</span>
          </div>
          
          <nav className="nav">
            <button onClick={() => scrollToSection('productos')} className="nav-link">
              Productos
            </button>
            <button onClick={() => scrollToSection('categorias')} className="nav-link">
              Categorías
            </button>
            <button onClick={() => scrollToSection('contacto')} className="nav-link">
              Contacto
            </button>
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <button onClick={onShowCart} className="cart-button">
                  🛒 Carrito ({cartItemsCount})
                </button>
                <span className="user-greeting">Hola, {user.name}</span>
                <button onClick={onLogout} className="logout-button">Cerrar Sesión</button>
              </>
            ) : (
              <div className="auth-buttons">
                <button onClick={() => onShowAuth('login')} className="login-button">
                  Iniciar Sesión
                </button>
                <button onClick={() => onShowAuth('register')} className="register-button">
                  Registrarse
                </button>
              </div>
            )}
            
            {/* Botón de acceso a administración (solo admin) */}
            {user?.is_admin && (
              <button 
                onClick={onShowAdmin} 
                className="admin-access-btn"
                title="Acceso a Panel de Administración"
              >
                ⚙️ Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const HeroSection = () => {
  const scrollToProducts = () => {
    const element = document.getElementById('productos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">Tu Farmacia Online de Confianza</h1>
          <p className="hero-subtitle">
            Medicamentos con y sin receta, entrega rápida y segura. 
            Más de 1000 productos farmacéuticos al mejor precio.
          </p>
          <div className="hero-buttons">
            <button onClick={scrollToProducts} className="cta-primary">Ver Productos</button>
            <button onClick={() => scrollToSection('sobre-nosotros')} className="cta-secondary">Conoce Más</button>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">
            <span>🏥</span>
            <p>Farmacia Moderna</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ... (mantén tus otros componentes como ProductCard, ProductCatalog, etc.)

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  // El acceso de admin se basa en user.is_admin y el JWT normal

useEffect(() => {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  if (savedToken && savedUser) {
    setToken(savedToken);
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);
  }
  setLoading(false);
}, []);
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error cargando productos:', error);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (user && token) {
      loadCart();
    }
  }, [user, token]);

  // Sincronizar carrito con localStorage para payment.html (siempre, aunque no haya usuario logueado)
  useEffect(() => {
    if (cart && cart.items) {
      const cartData = {
        items: cart.items.map(item => ({
          id: item.product_id || item.id,
          name: item.name,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1
        })),
        total: cart.items.reduce((sum, item) => 
          sum + (Number(item.price || 0) * (item.quantity || 1)), 0
        )
      };
      localStorage.setItem('cart', JSON.stringify(cartData));
    } else {
      localStorage.removeItem('cart');
    }
  }, [cart]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const loadCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Asegurar que los items del carrito tengan la estructura correcta
      const cartData = {
        ...response.data,
        items: response.data.items ? response.data.items.map(item => ({
          ...item,
          name: item.name || 'Producto',
          price: item.price || 0,
          image_url: item.image_url || null,
          requires_prescription: item.requires_prescription || false
        })) : []
      };
      
      setCart(cartData);
    } catch (error) {
      console.error('Error cargando carrito:', error);
    }
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    if (!userData?.is_admin) {
      addToast(`¡Bienvenido ${userData.name}!`, 'success');
    } else {
      setShowAdmin(true);
    }
  };

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('cart'); // Limpiar carrito también
      setUser(null);
      setToken(null);
      setCart(null);
      setShowAdmin(false);
      addToast('Sesión cerrada correctamente', 'info');
    };
  const handleShowAuth = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

const handleAddToCart = async (product) => {
  // VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO
  if (!user || !token) {
    addToast('Por favor inicia sesión para agregar productos al carrito', 'warning');
    setShowAuth(true); // Abrir modal de autenticación
    return;
  }

  // SOLO usuarios autenticados pueden agregar al carrito
  try {
    const response = await axios.post(`${API}/cart/items`, {
      product_id: product.id,
      quantity: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const updatedCart = {
      ...response.data,
      items: response.data.items.map(item => ({
        ...item,
        name: item.name || product.name,
        price: item.price || product.price,
        image_url: item.image_url || product.image_url,
        requires_prescription: item.requires_prescription || product.requires_prescription
      }))
    };

    setCart(updatedCart);
    addToast(`${product.name} agregado al carrito`, 'success'); // Mensaje limpio
  } catch (error) {
    console.error('Error adding to cart:', error);
    addToast('Error al agregar producto al carrito', 'error');
  }
};
  const cartItemsCount = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Cargando Farmachelo...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App">
        {/* Notificaciones Toast */}
        <div className="toast-container">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>

        {showAdmin ? (
          <AdminPanel onBack={() => setShowAdmin(false)} />
        ) : (
          <>
            <Header 
              user={user} 
              onLogout={handleLogout} 
              cartItemsCount={cartItemsCount}
              onShowAuth={handleShowAuth}
              onShowCart={() => setShowCart(true)}
              onShowAdmin={() => {
                if (user?.is_admin) setShowAdmin(true);
                else addToast('Acceso solo para administradores', 'warning');
              }}
            />
            
            <HeroSection />
            
            {/* Catálogo de productos */}
            <ProductCatalog 
              products={products} 
              onAddToCart={handleAddToCart}
              user={user}
            />

            {/* Sección de categorías */}
            <section id="categorias" className="categories-section">
              <div className="container">
                <h2 className="section-title">Categorías</h2>
                <div className="categories-grid">
                  <div className="category-card">
                    <div className="category-icon">💊</div>
                    <h3>Con Receta</h3>
                    <p>Medicamentos que requieren prescripción médica</p>
                  </div>
                  <div className="category-card">
                    <div className="category-icon">🟢</div>
                    <h3>Sin Receta</h3>
                    <p>Medicamentos de venta libre y productos de salud</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Sección de contacto */}
            <section id="contacto" className="contact-section">
              <div className="container">
                <h2 className="section-title">Contacto</h2>
                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <div>
                      <h4>Teléfono</h4>
                      <p>+57 300 123 4567</p>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <div>
                      <h4>Email</h4>
                      <p>info@farmachelo.com</p>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📍</span>
                    <div>
                      <h4>Dirección</h4>
                      <p>Calle 123 #45-67, Bogotá, Colombia</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Modales */}
            <AuthModal
              isOpen={showAuth}
              onClose={() => setShowAuth(false)}
              onLogin={handleLogin}
              mode={authMode}
              onModeChange={setAuthMode}
            />

            <CartModal
              isOpen={showCart}
              onClose={() => setShowCart(false)}
              cart={cart}
              onUpdateCart={setCart}
              token={token}
            />
          </>
        )}
      </div>
    </BrowserRouter>
  );
};

console.log('Cart sync:', cart);
export default App;
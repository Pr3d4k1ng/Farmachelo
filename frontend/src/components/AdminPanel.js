import React, { useState, useEffect } from 'react';

const AdminPanel = ({ onBack }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(!token);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // Tab state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image_url: '',
    requires_prescription: false,
    active: true
  });

  const API_BASE = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : 'http://localhost:8000/api';

  // Función para formatear precios
  const formatPrice = (price) => {
    const numericPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericPrice);
  };

  // Estilos en línea
  const styles = {
    adminLoginContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    },
    adminLoginForm: {
      background: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      width: '100%',
      maxWidth: '400px'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '600',
      color: '#333'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem'
    },
    submitButton: {
      width: '100%',
      padding: '0.75rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer'
    },
    backButton: {
      width: '100%',
      marginTop: '1rem',
      padding: '0.75rem',
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    }
  };

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  useEffect(() => {
    if (admin) {
      loadProducts();
    }
  }, [admin]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Verificar si es admin
        if (userData.is_admin) {
          setAdmin(userData);
          setShowLogin(false);
        } else {
          throw new Error('No admin privileges');
        }
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      setShowLogin(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        // Debe venir user con is_admin=true
        if (!data.user?.is_admin) {
          alert('No tienes privilegios de administrador');
          return;
        }
        setAdmin(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setShowLogin(false);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error al iniciar sesión');
      }
    } catch (error) {
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleLogout = () => {
    // Intentar hacer logout en el backend
    fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).catch(console.error);

    // Limpiar frontend
    localStorage.removeItem('token');
    setAdmin(null);
    setToken(null);
    setShowLogin(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        requires_prescription: !!formData.requires_prescription,
        active: !!formData.active
      };

      // Si es edición, incluye el id en el body
      if (editingProduct) {
        productData.id = editingProduct.id;
      }

      const url = editingProduct
        ? `${API_BASE}/admin/products/${editingProduct.id}`
        : `${API_BASE}/admin/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        alert(editingProduct ? '✅ Producto actualizado' : '✅ Producto creado');
        setShowProductModal(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          category: '',
          stock: '',
          image_url: '',
          requires_prescription: false,
          active: true
        });
        loadProducts();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error guardando producto');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Producto eliminado');
        loadProducts();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error eliminando producto');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      // category eliminado - fix crítico
      stock: product.stock.toString(),
      image_url: product.image_url || '',
      requires_prescription: product.requires_prescription,
      active: product.active
    });
    setShowProductModal(true);
  };

  // === COMPONENTE DE PEDIDOS ===
  const OrdersTab = () => {
    const [orderStats, setOrderStats] = useState({});
    const [allOrders, setAllOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    useEffect(() => {
      loadOrderData();
    }, []);

    useEffect(() => {
      filterOrders();
    }, [allOrders, statusFilter, searchTerm]);

    const loadOrderData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE}/admin/orders/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setOrderStats(statsData);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setAllOrders(ordersData);
        }
      } catch (error) {
        console.error('Error loading order data:', error);
      }
    };

    const filterOrders = () => {
      let filtered = [...allOrders];

      if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
      }

      if (searchTerm) {
        filtered = filtered.filter(order =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user_info?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user_info?.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredOrders(filtered);
    };

    const handleViewOrderDetails = async (orderId) => {
      try {
        const response = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const orderDetails = await response.json();
          setSelectedOrder(orderDetails);
          setShowOrderModal(true);
        }
      } catch (error) {
        console.error('Error loading order details:', error);
      }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
      try {
        const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          alert('Estado del pedido actualizado exitosamente');
          loadOrderData();
        } else {
          alert('Error al actualizar el estado del pedido');
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        alert('Error al actualizar el estado del pedido');
      }
    };

    const getStatusBadgeStyle = (status) => {
      const statusStyles = {
        'pending': { background: '#fef3c7', color: '#92400e' },
        'paid': { background: '#dbeafe', color: '#1e40af' },
        'processing': { background: '#fed7aa', color: '#c2410c' },
        'shipped': { background: '#e9d5ff', color: '#7c3aed' },
        'delivered': { background: '#d1fae5', color: '#065f46' },
        'cancelled': { background: '#fee2e2', color: '#991b1b' }
      };
      return statusStyles[status] || statusStyles['pending'];
    };

    const getStatusLabel = (status) => {
      const labels = {
        'pending': 'Pendiente',
        'paid': 'Pagado',
        'processing': 'Procesando',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
      };
      return labels[status] || status;
    };

    return (
      <div>
        {/* Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>Total Pedidos</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1a1a1a' }}>{orderStats.total_orders || 0}</p>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>Pendientes</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1a1a1a' }}>{orderStats.pending_orders || 0}</p>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>Completados</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#1a1a1a' }}>{orderStats.delivered_orders || 0}</p>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>Ingresos Totales</h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a' }}>{formatPrice(orderStats.total_revenue || 0)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por ID, cliente o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 15px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '14px'
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 15px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="processing">Procesando</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Tabla de pedidos */}
        {filteredOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No hay pedidos que coincidan con los filtros
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID Pedido</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Cliente</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Productos</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Fecha</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Factura</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      <strong>#{order.id.slice(0, 8)}</strong>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      <div>
                        <strong>{order.user_info?.name || 'N/A'}</strong>
                        <br />
                        <small style={{ color: '#6b7280' }}>{order.user_info?.email || ''}</small>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      {order.items_details?.length || 0} producto(s)
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      <strong>{formatPrice(order.total_amount)}</strong>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      {new Date(order.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        style={{
                          ...getStatusBadgeStyle(order.status),
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagado</option>
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      {order.invoice_info ? (
                        <button
                          onClick={() => window.open(`/invoice.html?invoice_id=${order.invoice_info.invoice_id}`, '_blank')}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85em'
                          }}
                        >
                          📄 {order.invoice_info.invoice_number}
                        </button>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Sin factura</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                      <button
                        onClick={() => handleViewOrderDetails(order.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de detalles */}
        {showOrderModal && selectedOrder && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }} onClick={() => setShowOrderModal(false)}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 25px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{ margin: 0 }}>Detalles del Pedido #{selectedOrder.id.slice(0, 8)}</h3>
                <button onClick={() => setShowOrderModal(false)} style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}>×</button>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Información del cliente */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#374151' }}>Información del Cliente</h4>
                  <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                    <p><strong>Nombre:</strong> {selectedOrder.user_info?.name}</p>
                    <p><strong>Email:</strong> {selectedOrder.user_info?.email}</p>
                    <p><strong>Teléfono:</strong> {selectedOrder.user_info?.phone || 'No proporcionado'}</p>
                    <p><strong>Dirección:</strong> {selectedOrder.user_info?.address || 'No proporcionada'}</p>
                  </div>
                </div>

                {/* Productos */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#374151' }}>Productos</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Producto</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Cantidad</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Precio Unit.</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items_details?.map((item, index) => (
                          <tr key={index}>
                            <td style={{ padding: '0.5rem' }}>
                              <strong>{item.name}</strong>
                              {item.requires_prescription && (
                                <span style={{ color: '#ef4444', fontSize: '0.85em', marginLeft: '5px' }}>
                                  📋 Receta
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.5rem' }}>{item.quantity}</td>
                            <td style={{ padding: '0.5rem' }}>{formatPrice(item.unit_price)}</td>
                            <td style={{ padding: '0.5rem' }}><strong>{formatPrice(item.total_price)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Información de pago y factura */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '10px', color: '#374151' }}>Información de Pago</h4>
                    <p><strong>Total:</strong> {formatPrice(selectedOrder.total_amount)}</p>
                    <p><strong>Estado:</strong> <span style={{
                      ...getStatusBadgeStyle(selectedOrder.status),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {getStatusLabel(selectedOrder.status)}
                    </span></p>
                  </div>

                  {selectedOrder.invoice_info && (
                    <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '10px', color: '#374151' }}>Factura</h4>
                      <p><strong>Número:</strong> {selectedOrder.invoice_info.invoice_number}</p>
                      <p><strong>Fecha:</strong> {new Date(selectedOrder.invoice_info.issue_date).toLocaleDateString('es-CO')}</p>
                      <button
                        onClick={() => window.open(`/invoice.html?invoice_id=${selectedOrder.invoice_info.id}`, '_blank')}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          marginTop: '10px'
                        }}
                      >
                        📄 Ver Factura
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                padding: '15px 25px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button onClick={() => setShowOrderModal(false)} style={{
                  padding: '10px 20px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  // === FIN COMPONENTE DE PEDIDOS ===

  if (showLogin) {
    return (
      <div style={styles.adminLoginContainer}>
        <div style={styles.adminLoginForm}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
            🏥 Panel de Administración
          </h2>

          <form onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email:</label>
              <input
                type="email"
                name="email"
                required
                style={styles.input}
                placeholder="admin@farmachelo.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contraseña:</label>
              <input
                type="password"
                name="password"
                required
                style={styles.input}
                placeholder="admin123"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.submitButton, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
            </button>
          </form>
          <button
            onClick={onBack}
            style={styles.backButton}
          >
            ↩️ Volver al Sitio Principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e5e7eb',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ color: '#333', margin: 0 }}>
          🏥 Panel de Administración - Farmachelo
        </h1>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', color: '#4b5563' }}>
            👋 Bienvenido, {admin?.name}
          </span>

          {activeTab === 'products' && (
            <button
              onClick={() => setShowProductModal(true)}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ➕ Nuevo Producto
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🚪 Cerrar Sesión
          </button>

          <button
            onClick={onBack}
            style={{
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ↩️ Volver al Sitio
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'products' ? '3px solid #667eea' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            color: activeTab === 'products' ? '#667eea' : '#333',
            transition: 'all 0.3s ease'
          }}
        >
          💊 Productos
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '3px solid #667eea' : '3px solid transparent',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            color: activeTab === 'orders' ? '#667eea' : '#333',
            transition: 'all 0.3s ease'
          }}
        >
          📦 Pedidos
        </button>
      </div>

      {/* Contenido de Tabs */}
      {activeTab === 'products' ? (
        // Products Section
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#333', margin: 0 }}>
              📦 Productos ({products.length})
            </h2>
          </div>

          {products.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              No hay productos cargados en el sistema.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Imagen</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nombre</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Precio</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Stock</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Categoría</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        ) : (
                          <div style={{
                            width: '50px',
                            height: '50px',
                            background: '#f3f4f6',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9ca3af'
                          }}>
                            🏥
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>{product.name}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>${product.price}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>{product.stock}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        {product.category === 'prescription' ? '💊 Con receta' : '🟢 Sin receta'}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: product.active ? '#dcfce7' : '#fee2e2',
                          color: product.active ? '#166534' : '#991b1b'
                        }}>
                          {product.active ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <button
                          onClick={() => openEditModal(product)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '0.5rem'
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <OrdersTab />
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>
              {editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
            </h2>

            <form onSubmit={handleSubmitProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={styles.label}>Nombre:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Precio:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={styles.label}>Descripción:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  style={{ ...styles.input, minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={styles.label}>Categoría:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    style={styles.input}
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="prescription">Con receta</option>
                    <option value="over_counter">Sin receta</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Stock:</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={styles.label}>URL de la imagen:</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={styles.input}
                  placeholder="Opcional"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.requires_prescription}
                    onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
                  />
                  Requiere receta
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Producto activo
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      description: '',
                      price: '',
                      category: '',
                      stock: '',
                      image_url: '',
                      requires_prescription: false,
                      active: true
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? '⏳ Guardando...' : (editingProduct ? '💾 Actualizar' : '✨ Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
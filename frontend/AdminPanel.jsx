import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : 'http://localhost:8000/api';

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

const AdminPanel = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'over_counter',
    stock: '',
    requires_prescription: false
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'products':
        loadProducts();
        break;
      case 'users':
        loadUsers();
        break;
      case 'orders':
        loadOrders();
        break;
      case 'invoices':
        loadInvoices();
        loadInvoiceStats();
        break;
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const [productsRes, invoicesStatsRes] = await Promise.all([
        fetch(`${API}/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/admin/invoices/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (invoicesStatsRes.ok) {
        const statsData = await invoicesStatsRes.json();
        setStats(statsData);
      }

      setUsers([]);
      setOrders([]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Endpoint /admin/users no disponible');
      setUsers([]);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setOrders(await response.json());
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const invoicesData = await response.json();
        setInvoices(invoicesData);
      } else {
        console.log('No se pudieron cargar las facturas');
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setProducts(await response.json());
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadInvoiceStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/invoices/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error('Error loading invoice stats:', error);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock)
        })
      });

      if (response.ok) {
        setNewProduct({
          name: '',
          description: '',
          price: '',
          category: 'over_counter',
          stock: '',
          requires_prescription: false
        });
        loadProducts();
        alert('Producto creado exitosamente');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error al crear producto');
    }
  };

  const exportToCSV = () => {
    const headers = ['Número', 'Cliente', 'Fecha', 'Subtotal', 'IVA', 'Total', 'Estado'];
    const csvData = invoices.map(invoice => [
      invoice.invoice_number,
      invoice.customer_info.name,
      new Date(invoice.issue_date).toLocaleDateString(),
      invoice.subtotal,
      invoice.tax_amount,
      invoice.total_amount,
      invoice.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturas-farmachelo-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const DashboardTab = () => (
    <div className="dashboard">
      <h2>Dashboard de Administración</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Productos</h3>
          <p className="stat-number">{products.length}</p>
        </div>
        <div className="stat-card">
          <h3>Usuarios Registrados</h3>
          <p className="stat-number">{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pedidos Totales</h3>
          <p className="stat-number">{orders.length}</p>
        </div>
        <div className="stat-card">
          <h3>Ingresos Totales</h3>
          <p className="stat-number">{formatPrice(stats.total_revenue || 0)}</p>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Actividad Reciente</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span>📦</span>
            <div>
              <p>Nuevos pedidos pendientes</p>
              <small>Hace 5 minutos</small>
            </div>
          </div>
          <div className="activity-item">
            <span>💳</span>
            <div>
              <p>Pago procesado exitosamente</p>
              <small>Hace 15 minutos</small>
            </div>
          </div>
          <div className="activity-item">
            <span>👤</span>
            <div>
              <p>Nuevo usuario registrado</p>
              <small>Hace 1 hora</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductsTab = () => (
    <div className="products-management">
      <div className="admin-header">
        <h2>Gestión de Productos</h2>
        <button
          className="btn btn-primary"
          onClick={() => document.getElementById('productForm').showModal()}
        >
          ➕ Nuevo Producto
        </button>
      </div>

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <div className="product-placeholder">💊</div>
              )}
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="product-meta">
                <span className="price">{formatPrice(product.price)}</span>
                <span className={`stock ${product.stock < 10 ? 'low' : ''}`}>
                  Stock: {product.stock}
                </span>
                <span className={`category ${product.category}`}>
                  {product.category === 'prescription' ? 'Con Receta' : 'Sin Receta'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para crear producto */}
      <dialog id="productForm" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Crear Nuevo Producto</h3>
            <button onClick={() => document.getElementById('productForm').close()} className="close">
              ×
            </button>
          </div>
          <form onSubmit={handleCreateProduct} className="modal-form">
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Precio (COP)</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  <option value="over_counter">Sin Receta</option>
                  <option value="prescription">Con Receta</option>
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newProduct.requires_prescription}
                    onChange={(e) => setNewProduct({ ...newProduct, requires_prescription: e.target.checked })}
                  />
                  Requiere receta médica
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => document.getElementById('productForm').close()}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Crear Producto
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );

  const InvoicesTab = () => (
    <div className="invoices-management">
      <div className="admin-header">
        <h2>Gestión de Facturas</h2>
        <button onClick={exportToCSV} className="btn btn-primary">
          📊 Exportar CSV
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Facturas</h3>
          <p className="stat-number">{stats.total_invoices || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Facturas del Mes</h3>
          <p className="stat-number">{stats.monthly_invoices || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Ingresos Totales</h3>
          <p className="stat-number">{formatPrice(stats.total_revenue || 0)}</p>
        </div>
        <div className="stat-card">
          <h3>Ingresos del Mes</h3>
          <p className="stat-number">{formatPrice(stats.monthly_revenue || 0)}</p>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="invoices-list">
        <h3>Facturas Recientes</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoice_number}</td>
                <td>{invoice.customer_info.name}</td>
                <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
                <td>{formatPrice(invoice.total_amount)}</td>
                <td>
                  <span className={`status-badge status-${invoice.status}`}>
                    {invoice.status === 'paid' ? 'Pagado' : invoice.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => window.open(`/invoice.html?invoice_id=${invoice.id}`, '_blank')}
                    className="btn btn-sm"
                  >
                    👁️ Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="users-management">
      <h2>Gestión de Usuarios</h2>
      <div className="info-message">
        <p>📊 La gestión de usuarios estará disponible en una futura actualización.</p>
        <p><small>Actualmente puedes gestionar usuarios directamente desde la base de datos.</small></p>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <p>No hay usuarios cargados en el sistema</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Registro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || 'No proporcionado'}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${user.is_verified ? 'status-verified' : 'status-pending'}`}>
                    {user.is_verified ? 'Verificado' : 'Pendiente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

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
        const token = localStorage.getItem('token');

        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${API}/admin/orders/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API}/admin/orders`, {
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
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/orders/${orderId}`, {
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
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/orders/${orderId}/status`, {
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

    const getStatusBadgeClass = (status) => {
      const statusClasses = {
        'pending': 'status-pending',
        'paid': 'status-paid',
        'processing': 'status-processing',
        'shipped': 'status-shipped',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
      };
      return statusClasses[status] || 'status-pending';
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
      <div className="orders-management">
        <div className="admin-header">
          <h2>Gestión de Pedidos</h2>
        </div>

        {/* Estadísticas de pedidos */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Pedidos</h3>
            <p className="stat-number">{orderStats.total_orders || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Pedidos Pendientes</h3>
            <p className="stat-number">{orderStats.pending_orders || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Pedidos Completados</h3>
            <p className="stat-number">{orderStats.delivered_orders || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Pedidos del Mes</h3>
            <p className="stat-number">{orderStats.monthly_orders || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Ingresos Totales</h3>
            <p className="stat-number">{formatPrice(orderStats.total_revenue || 0)}</p>
          </div>
          <div className="stat-card">
            <h3>Ingresos del Mes</h3>
            <p className="stat-number">{formatPrice(orderStats.monthly_revenue || 0)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-section" style={{
          display: 'flex',
          gap: '15px',
          marginTop: '30px',
          marginBottom: '20px',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Buscar por ID, cliente o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 15px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>
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
          <div className="empty-state">
            <p>No hay pedidos que coincidan con los filtros</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Factura</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.id.slice(0, 8)}</strong>
                  </td>
                  <td>
                    <div>
                      <strong>{order.user_info?.name || 'N/A'}</strong>
                      <br />
                      <small style={{ color: '#6b7280' }}>{order.user_info?.email || ''}</small>
                    </div>
                  </td>
                  <td>
                    {order.items_details?.length || 0} producto(s)
                  </td>
                  <td>
                    <strong>{formatPrice(order.total_amount)}</strong>
                  </td>
                  <td>
                    {new Date(order.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      className={`status-badge ${getStatusBadgeClass(order.status)}`}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85em'
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
                  <td>
                    {order.invoice_info ? (
                      <button
                        onClick={() => window.open(`/invoice.html?invoice_id=${order.invoice_info.invoice_id}`, '_blank')}
                        className="btn btn-sm"
                        style={{ fontSize: '0.85em' }}
                      >
                        📄 {order.invoice_info.invoice_number}
                      </button>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Sin factura</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewOrderDetails(order.id)}
                      className="btn btn-sm"
                    >
                      👁️ Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal de detalles del pedido */}
        {showOrderModal && selectedOrder && (
          <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <div className="modal-header">
                <h3>Detalles del Pedido #{selectedOrder.id.slice(0, 8)}</h3>
                <button onClick={() => setShowOrderModal(false)} className="close">×</button>
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
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items_details?.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{item.name}</strong>
                            {item.requires_prescription && (
                              <span style={{ color: '#ef4444', fontSize: '0.85em', marginLeft: '5px' }}>
                                📋 Receta
                              </span>
                            )}
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.unit_price)}</td>
                          <td><strong>{formatPrice(item.total_price)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Información de pago y factura */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '10px', color: '#374151' }}>Información de Pago</h4>
                    <p><strong>Total:</strong> {formatPrice(selectedOrder.total_amount)}</p>
                    <p><strong>Estado:</strong> <span className={`status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span></p>
                    {selectedOrder.payment_transaction && (
                      <p><strong>ID Transacción:</strong> <br /><small>{selectedOrder.payment_transaction.transaction_id}</small></p>
                    )}
                  </div>

                  {selectedOrder.invoice_info && (
                    <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                      <h4 style={{ marginBottom: '10px', color: '#374151' }}>Factura</h4>
                      <p><strong>Número:</strong> {selectedOrder.invoice_info.invoice_number}</p>
                      <p><strong>Fecha:</strong> {new Date(selectedOrder.invoice_info.issue_date).toLocaleDateString('es-CO')}</p>
                      <button
                        onClick={() => window.open(`/invoice.html?invoice_id=${selectedOrder.invoice_info.id}`, '_blank')}
                        className="btn btn-primary"
                        style={{ marginTop: '10px' }}
                      >
                        📄 Ver Factura
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowOrderModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>🏥 Farmachelo</h2>
          <p>Panel de Administración</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            💊 Productos
          </button>
          <button
            className={activeTab === 'invoices' ? 'active' : ''}
            onClick={() => setActiveTab('invoices')}
          >
            🧾 Facturas
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            📦 Pedidos
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuarios
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={onBack} className="btn btn-secondary">
            ← Volver a la Tienda
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'products' && 'Gestión de Productos'}
            {activeTab === 'invoices' && 'Gestión de Facturas'}
            {activeTab === 'orders' && 'Gestión de Pedidos'}
            {activeTab === 'users' && 'Gestión de Usuarios'}
          </h1>
          <div className="user-info">
            <span>👤 Administrador</span>
          </div>
        </div>

        <div className="admin-main">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'products' && <ProductsTab />}
              {activeTab === 'invoices' && <InvoicesTab />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'users' && <UsersTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
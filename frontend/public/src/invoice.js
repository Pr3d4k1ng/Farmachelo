function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// Función para formatear fecha
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Función para mostrar advertencia
function showDataWarning() {
  const warningDiv = document.createElement('div');
  warningDiv.className = 'data-warning';
  warningDiv.innerHTML = `
    <div style="
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: center;
      font-weight: 500;
    ">
      ⚠️ Mostrando datos de demostración. Si acabas de realizar un pago, 
      <a href="payment.html" style="color: #856404; text-decoration: underline;">
        vuelve a la página de pago
      </a>
    </div>
  `;
  
  const invoiceHeader = document.querySelector('.invoice-header');
  if (invoiceHeader) {
    invoiceHeader.parentNode.insertBefore(warningDiv, invoiceHeader.nextSibling);
  }
}

// Función para datos de demostración
function getDemoInvoiceData() {
  return {
    invoice: {
      invoice_number: `FAC-DEMO-${Date.now()}`,
      issue_date: new Date().toISOString(),
      status: 'paid',
      payment_method: 'Tarjeta de crédito',
      items: [
        {
          id: 'prod_1',
          name: 'Paracetamol 500mg',
          quantity: 2,
          unit_price: 15000,
          total_price: 30000,
          requires_prescription: false
        },
        {
          id: 'prod_2',
          name: 'Ibuprofeno 400mg',
          quantity: 1,
          unit_price: 12000,
          total_price: 12000,
          requires_prescription: false
        }
      ],
      subtotal: 42000,
      tax_amount: 7980,
      discount_amount: 0,
      total_amount: 49980,
      customer_info: {
        name: 'Cliente Demo',
        email: 'cliente@demo.com',
        phone: '+57 300 123 4567',
        address: 'Calle 123, Bogotá'
      }
    },
    customer: {
      name: 'Cliente Demo',
      email: 'cliente@demo.com'
    }
  };
}

// Mostrar datos de la factura
function displayInvoice(data) {
  const { invoice, customer } = data;

  // Información general
  document.getElementById('invoiceNumber').textContent = invoice.invoice_number;
  document.getElementById('issueDate').textContent = formatDate(invoice.issue_date);
  document.getElementById('paymentMethod').textContent = invoice.payment_method || 'Tarjeta de crédito';
  
  // Estado con badge
  const statusElement = document.getElementById('invoiceStatus');
  statusElement.textContent = invoice.status === 'paid' ? 'Pagado' : invoice.status;
  if (invoice.status === 'paid') {
    statusElement.innerHTML += '<span class="status-badge status-paid">✓ Pagado</span>';
  }

  // Información del cliente
  const customerDetails = document.getElementById('customerDetails');
  customerDetails.innerHTML = `
    <div class="info-item">
      <span class="info-label">Nombre:</span>
      <span>${invoice.customer_info.name}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Email:</span>
      <span>${invoice.customer_info.email}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Teléfono:</span>
      <span>${invoice.customer_info.phone || 'No proporcionado'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Dirección:</span>
      <span>${invoice.customer_info.address || 'No proporcionada'}</span>
    </div>
  `;

  // Items de la factura
  const itemsContainer = document.getElementById('invoiceItems');
  itemsContainer.innerHTML = invoice.items.map(item => `
    <tr>
      <td>
        <strong>${item.name}</strong>
        ${item.requires_prescription ? '<br><small style="color: #ef4444;">✓ Con receta médica</small>' : ''}
      </td>
      <td>${item.quantity}</td>
      <td>${formatPrice(item.unit_price)}</td>
      <td><strong>${formatPrice(item.total_price)}</strong></td>
    </tr>
  `).join('');

  // Totales
  document.getElementById('subtotal').textContent = formatPrice(invoice.subtotal);
  document.getElementById('taxAmount').textContent = formatPrice(invoice.tax_amount);
  document.getElementById('discountAmount').textContent = formatPrice(invoice.discount_amount);
  document.getElementById('totalAmount').textContent = formatPrice(invoice.total_amount);
}

// Cargar datos de la factura
async function loadInvoice() {
  console.log('🔄 Cargando factura...');
  
  let invoiceData = null;
  
  // ESTRATEGIA DE CARGA POR ORDEN DE PRIORIDAD:
  
  // 1. Intentar desde URL parameters (si viene de pago exitoso)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('status') === 'success') {
    console.log('📱 Detectado parámetro de éxito en URL');
  }
  
  // 2. Buscar en window object (datos inmediatos)
  if (window.lastInvoiceData) {
    console.log('💾 Datos encontrados en window object');
    invoiceData = window.lastInvoiceData;
  }
  // 3. Buscar en localStorage (datos persistentes)
  else if (localStorage.getItem('last_invoice_data')) {
    console.log('💾 Datos encontrados en localStorage');
    try {
      invoiceData = JSON.parse(localStorage.getItem('last_invoice_data'));
    } catch (e) {
      console.error('Error parseando localStorage:', e);
    }
  }
  // 4. Buscar en sessionStorage (datos de sesión)
  else if (sessionStorage.getItem('current_invoice')) {
    console.log('💾 Datos encontrados en sessionStorage');
    try {
      invoiceData = JSON.parse(sessionStorage.getItem('current_invoice'));
    } catch (e) {
      console.error('Error parseando sessionStorage:', e);
    }
  }
  
  // 5. Si no hay datos de pago reales, mostrar demo PERO con advertencia
  if (!invoiceData) {
    console.warn('⚠️ No se encontraron datos de pago, mostrando demostración');
    showDataWarning();
    invoiceData = getDemoInvoiceData();
  } else {
    console.log('✅ Datos reales de factura cargados correctamente');
  }
  
  displayInvoice(invoiceData);
}

// Cargar la factura al iniciar
document.addEventListener('DOMContentLoaded', loadInvoice);
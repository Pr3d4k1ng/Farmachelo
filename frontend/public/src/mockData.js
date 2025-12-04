const mockInvoiceData = {
  invoice: {
    id: "inv_001",
    invoice_number: "FAC-2023-001",
    issue_date: new Date().toISOString(),
    status: "paid",
    payment_method: "Tarjeta de crédito",
    subtotal: 85000,
    tax_amount: 16150,
    discount_amount: 0,
    total_amount: 101150,
    customer_info: {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
      phone: "+57 300 123 4567",
      address: "Carrera 45 #26-85, Bogotá"
    },
    items: [
      {
        id: "prod_001",
        name: "Paracetamol 500mg",
        quantity: 2,
        unit_price: 15000,
        total_price: 30000,
        requires_prescription: false
      },
      {
        id: "prod_002",
        name: "Amoxicilina 250mg",
        quantity: 1,
        unit_price: 25000,
        total_price: 25000,
        requires_prescription: true
      },
      {
        id: "prod_003",
        name: "Vitamina C 1000mg",
        quantity: 1,
        unit_price: 30000,
        total_price: 30000,
        requires_prescription: false
      }
    ]
  },
  customer: {
    id: "cust_001",
    name: "Juan Pérez",
    email: "juan.perez@example.com",
    phone: "+57 300 123 4567",
    address: "Carrera 45 #26-85, Bogotá"
  }
};
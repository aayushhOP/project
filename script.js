document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const categoryContents = document.querySelectorAll('.category-content');
  const addBtns = document.querySelectorAll('.add-btn');
  const orderItemsList = document.getElementById('order-items-list');
  const subtotalElement = document.getElementById('subtotal');
  const discountInput = document.getElementById('discount');
  const discountAmountElement = document.getElementById('discount-amount');
  const gstElement = document.getElementById('gst');
  const totalElement = document.getElementById('total');
  const clearOrderBtn = document.getElementById('clear-order');
  const printBillBtn = document.getElementById('print-bill');
  const tableNumberSelect = document.getElementById('table-number');
  const customerNameInput = document.getElementById('customer-name');
  
  // Bill Template Elements
  const billTemplate = document.getElementById('bill-template');
  const billNumberElement = document.getElementById('bill-number');
  const billDateElement = document.getElementById('bill-date');
  const billTimeElement = document.getElementById('bill-time');
  const billTableElement = document.getElementById('bill-table');
  const billCustomerElement = document.getElementById('bill-customer');
  const billItemsList = document.getElementById('bill-items-list');
  const billSubtotalElement = document.getElementById('bill-subtotal');
  const billDiscountElement = document.getElementById('bill-discount');
  const billGstElement = document.getElementById('bill-gst');
  const billTotalElement = document.getElementById('bill-total');
  
  // Order Data
  let orderItems = [];
  let billCounter = localStorage.getItem('billCounter') || 1;
  
  // Initialize the app
  init();
  
  function init() {
      // Set up tab switching
      tabBtns.forEach(btn => {
          btn.addEventListener('click', () => {
              const category = btn.getAttribute('data-category');
              
              // Update active tab
              tabBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              
              // Show corresponding content
              categoryContents.forEach(content => {
                  content.classList.remove('active');
                  if (content.id === category) {
                      content.classList.add('active');
                  }
              });
          });
      });
      
      // Set up add to order buttons
      addBtns.forEach(btn => {
          btn.addEventListener('click', function() {
              const menuItem = this.closest('.menu-item');
              const itemId = menuItem.getAttribute('data-id');
              const itemName = menuItem.getAttribute('data-name');
              const itemPrice = parseFloat(menuItem.getAttribute('data-price'));
              
              addToOrder(itemId, itemName, itemPrice);
          });
      });
      
      // Set up discount input
      discountInput.addEventListener('input', calculateTotals);
      
      // Set up clear order button
      clearOrderBtn.addEventListener('click', clearOrder);
      
      // Set up print bill button
      printBillBtn.addEventListener('click', generateBill);
      
      // Load any existing order from localStorage
      loadOrder();
  }
  
  function addToOrder(id, name, price) {
      // Check if item already exists in order
      const existingItem = orderItems.find(item => item.id === id);
      
      if (existingItem) {
          // Increment quantity if item exists
          existingItem.quantity += 1;
      } else {
          // Add new item to order
          orderItems.push({
              id,
              name,
              price,
              quantity: 1
          });
      }
      
      // Update order display and save to localStorage
      updateOrderDisplay();
      saveOrder();
      calculateTotals();
  }
  
  function updateOrderDisplay() {
      // Clear current order display
      orderItemsList.innerHTML = '';
      
      if (orderItems.length === 0) {
          orderItemsList.innerHTML = '<tr><td colspan="5" style="text-align: center;">No items added yet</td></tr>';
          return;
      }
      
      // Add each item to the order list
      orderItems.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${item.name}</td>
              <td>
                  <div class="quantity-controls">
                      <button class="quantity-btn minus" data-id="${item.id}">-</button>
                      <span>${item.quantity}</span>
                      <button class="quantity-btn plus" data-id="${item.id}">+</button>
                  </div>
              </td>
              <td>₹${item.price.toFixed(2)}</td>
              <td>₹${(item.price * item.quantity).toFixed(2)}</td>
              <td><i class="fas fa-times remove-btn" data-id="${item.id}"></i></td>
          `;
          orderItemsList.appendChild(row);
      });
      
      // Add event listeners to quantity controls and remove buttons
      document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
          btn.addEventListener('click', function() {
              const itemId = this.getAttribute('data-id');
              adjustQuantity(itemId, -1);
          });
      });
      
      document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
          btn.addEventListener('click', function() {
              const itemId = this.getAttribute('data-id');
              adjustQuantity(itemId, 1);
          });
      });
      
      document.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', function() {
              const itemId = this.getAttribute('data-id');
              removeItem(itemId);
          });
      });
  }
  
  function adjustQuantity(itemId, change) {
      const itemIndex = orderItems.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
          orderItems[itemIndex].quantity += change;
          
          // Remove item if quantity reaches 0
          if (orderItems[itemIndex].quantity <= 0) {
              orderItems.splice(itemIndex, 1);
          }
          
          // Update display and save
          updateOrderDisplay();
          saveOrder();
          calculateTotals();
      }
  }
  
  function removeItem(itemId) {
      orderItems = orderItems.filter(item => item.id !== itemId);
      updateOrderDisplay();
      saveOrder();
      calculateTotals();
  }
  
  function calculateTotals() {
      // Calculate subtotal
      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculate discount
      const discountPercentage = parseInt(discountInput.value) || 0;
      const discountAmount = subtotal * (discountPercentage / 100);
      
      // Calculate GST (5%)
      const gst = (subtotal - discountAmount) * 0.05;
      
      // Calculate total
      const total = subtotal - discountAmount + gst;
      
      // Update UI
      subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
      discountAmountElement.textContent = `₹${discountAmount.toFixed(2)}`;
      gstElement.textContent = `₹${gst.toFixed(2)}`;
      totalElement.textContent = `₹${total.toFixed(2)}`;
  }
  
  function clearOrder() {
      if (orderItems.length === 0 || confirm('Are you sure you want to clear the current order?')) {
          orderItems = [];
          discountInput.value = 0;
          updateOrderDisplay();
          calculateTotals();
          saveOrder();
      }
  }
  
  function saveOrder() {
      localStorage.setItem('currentOrder', JSON.stringify(orderItems));
  }
  
  function loadOrder() {
      const savedOrder = localStorage.getItem('currentOrder');
      if (savedOrder) {
          orderItems = JSON.parse(savedOrder);
          updateOrderDisplay();
          calculateTotals();
      }
  }
  
  function generateBill() {
      if (orderItems.length === 0) {
          alert('Please add items to the order before generating a bill.');
          return;
      }
      
      // Calculate totals
      const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountPercentage = parseInt(discountInput.value) || 0;
      const discountAmount = subtotal * (discountPercentage / 100);
      const gst = (subtotal - discountAmount) * 0.05;
      const total = subtotal - discountAmount + gst;
      
      // Generate bill number (simple increment)
      const billNumber = String(billCounter).padStart(3, '0');
      billCounter++;
      localStorage.setItem('billCounter', billCounter);
      
      // Get current date and time
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      
      // Get table and customer info
      const table = tableNumberSelect.value;
      const customer = customerNameInput.value || 'Walk-in Customer';
      
      // Update bill template
      billNumberElement.textContent = billNumber;
      billDateElement.textContent = dateStr;
      billTimeElement.textContent = timeStr;
      billTableElement.textContent = table === 'takeaway' ? 'Takeaway' : 
                                    table === 'delivery' ? 'Delivery' : `Table ${table}`;
      billCustomerElement.textContent = customer;
      
      // Clear and populate bill items
      billItemsList.innerHTML = '';
      orderItems.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>₹${item.price.toFixed(2)}</td>
              <td>₹${(item.price * item.quantity).toFixed(2)}</td>
          `;
          billItemsList.appendChild(row);
      });
      
      // Update totals in bill
      billSubtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
      billDiscountElement.textContent = `₹${discountAmount.toFixed(2)}`;
      billGstElement.textContent = `₹${gst.toFixed(2)}`;
      billTotalElement.textContent = `₹${total.toFixed(2)}`;
      
      // Show the bill template (for printing)
      const printWindow = window.open('', '', 'width=600,height=800');
      printWindow.document.write(`
          <html>
              <head>
                  <title>अन्न आश्रय भारत| - Bill #${billNumber}</title>
                  <style>
                      body {
                          font-family: Arial, sans-serif;
                          margin: 0;
                          padding: 20px;
                      }
                      .bill-header {
                          text-align: center;
                          margin-bottom: 20px;
                          padding-bottom: 10px;
                          border-bottom: 1px dashed #ccc;
                      }
                      .bill-header h1 {
                          font-size: 1.5rem;
                          color: #ff6b6b;
                          margin-bottom: 5px;
                      }
                      .bill-details {
                          margin-bottom: 15px;
                          font-size: 0.9rem;
                      }
                      .bill-items table {
                          width: 100%;
                          border-collapse: collapse;
                          margin-bottom: 15px;
                      }
                      .bill-items th, .bill-items td {
                          padding: 5px;
                          text-align: left;
                          border-bottom: 1px solid #eee;
                          font-size: 0.9rem;
                      }
                      .bill-items th {
                          font-weight: bold;
                      }
                      .bill-totals {
                          text-align: right;
                          margin-top: 10px;
                          font-size: 0.9rem;
                      }
                      .bill-totals p {
                          margin-bottom: 5px;
                      }
                      .grand-total {
                          font-size: 1.2rem;
                          font-weight: bold;
                          color: #ff6b6b;
                          margin-top: 10px;
                          padding-top: 10px;
                          border-top: 1px dashed #ccc;
                      }
                      .bill-footer {
                          text-align: center;
                          margin-top: 20px;
                          padding-top: 10px;
                          border-top: 1px dashed #ccc;
                          font-size: 0.9rem;
                      }
                  </style>
              </head>
              <body>
                  ${billTemplate.innerHTML}
                  <script>
                      window.onload = function() {
                          window.print();
                          setTimeout(function() {
                              window.close();
                          }, 1000);
                      };
                  </script>
              </body>
          </html>
      `);
      printWindow.document.close();
      
      // Clear the order after printing
      clearOrder();
  }
});
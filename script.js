// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyCfjv99aMtQsXs0DQhQPw6eebBQeL65UsY",
    authDomain: "ticket-b593e.firebaseapp.com",
    projectId: "ticket-b593e",
    storageBucket: "ticket-b593e.firebasestorage.app",
    messagingSenderId: "591348153786",
    appId: "1:591348153786:web:d2131cabfaca5280dbb183",
    measurementId: "G-Z3EWKN2PJM"
};

// Initialize Firebase
let db;
let firebaseInitialized = false;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    
    // Enable offline persistence
    db.enablePersistence()
      .catch((err) => {
          console.warn("Offline persistence not enabled:", err);
      });
    
    firebaseInitialized = true;
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    firebaseInitialized = false;
}

// ============================================
// APPLICATION STATE
// ============================================
let cart = JSON.parse(localStorage.getItem('straightOuttaUniCart')) || [];
let checkoutData = {
    customer: {},
    paymentMethod: 'card',
    ticketIds: [],
    purchasedItems: []
};
let currentStep = 1;

// ============================================
// DOM ELEMENTS
// ============================================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');
const cartButton = document.getElementById('cartButton');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartTotalItems = document.getElementById('cartTotalItems');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartServiceFee = document.getElementById('cartServiceFee');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const modalOverlay = document.getElementById('modalOverlay');
const checkoutModal = document.getElementById('checkoutModal');
const closeModal = document.getElementById('closeModal');
const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');

// Form elements
const steps = document.querySelectorAll('.step');
const formSteps = document.querySelectorAll('.form-step');
const paymentMethods = document.querySelectorAll('.payment-method');

// Navigation buttons
const nextToStep2Btn = document.getElementById('nextToStep2');
const backToStep1Btn = document.getElementById('backToStep1');
const nextToStep3Btn = document.getElementById('nextToStep3');
const backToStep2Btn = document.getElementById('backToStep2');
const processPaymentBtn = document.getElementById('processPaymentBtn');
const finishBtn = document.getElementById('finishBtn');

// Input fields
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const orderSummaryBox = document.getElementById('orderSummaryBox');
const paymentDetails = document.getElementById('paymentDetails');

// ============================================
// INITIALIZATION
// ============================================
function init() {
    updateCartDisplay();
    setupEventListeners();
    console.log("✅ Application initialized");
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupEventListeners() {
    // Mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('#navMenu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Cart button
    cartButton.addEventListener('click', () => {
        document.getElementById('cart').scrollIntoView({ behavior: 'smooth' });
    });

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target.closest('.add-to-cart');
            const name = target.getAttribute('data-name');
            const price = parseInt(target.getAttribute('data-price'));
            const type = target.getAttribute('data-type') || 'ticket';
            addToCart(name, price, type);
        });
    });

    // Checkout button
    checkoutBtn.addEventListener('click', openCheckoutModal);

    // Close modal buttons
    closeModal.addEventListener('click', closeCheckoutModal);
    closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    modalOverlay.addEventListener('click', closeCheckoutModal);

    // Form navigation
    nextToStep2Btn.addEventListener('click', goToStep2);
    backToStep1Btn.addEventListener('click', () => goToStep(1));
    nextToStep3Btn.addEventListener('click', goToStep3);
    backToStep2Btn.addEventListener('click', () => goToStep(2));
    
    // Payment method selection
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            checkoutData.paymentMethod = method.getAttribute('data-method');
        });
    });

    // Process payment
    processPaymentBtn.addEventListener('click', processPayment);
    
    // Finish button
    finishBtn.addEventListener('click', closeCheckoutModal);

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// CART FUNCTIONS
// ============================================
function addToCart(name, price, type = 'ticket') {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1, type });
    }
    
    saveCart();
    updateCartDisplay();
    showNotification(`${name} added to cart!`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    showNotification('Item removed from cart');
}

function updateQuantity(index, change) {
    const newQuantity = cart[index].quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(index);
    } else {
        cart[index].quantity = newQuantity;
        saveCart();
        updateCartDisplay();
    }
}

function saveCart() {
    localStorage.setItem('straightOuttaUniCart', JSON.stringify(cart));
}

function updateCartDisplay() {
    // Update cart count
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartTotalItems.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
    
    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;
    
    cartSubtotal.textContent = `₦${subtotal.toLocaleString()}`;
    cartServiceFee.textContent = `₦${serviceFee.toLocaleString()}`;
    cartTotal.textContent = `₦${total.toLocaleString()}`;
    
    // Enable/disable checkout button
    checkoutBtn.disabled = cart.length === 0;
    
    // Update cart items display
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        cartItems.appendChild(cartEmpty);
    } else {
        cartEmpty.remove();
        
        let cartHTML = '';
        cart.forEach((item, index) => {
            cartHTML += `
                <div class="cart-item">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">₦${(item.price * item.quantity).toLocaleString()}</div>
                    <div class="item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                    <button class="item-remove" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            `;
        });
        
        cartItems.innerHTML = cartHTML;
    }
}

// ============================================
// CHECKOUT MODAL FUNCTIONS
// ============================================
function openCheckoutModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    if (!firebaseInitialized) {
        showNotification('Payment system is not available. Please refresh the page.');
        return;
    }

    // Reset form
    fullNameInput.value = '';
    emailInput.value = '';
    phoneInput.value = '';
    document.getElementById('specialInstructions').value = '';
    paymentMethods.forEach(m => m.classList.remove('selected'));
    document.querySelector('.payment-method[data-method="card"]').classList.add('selected');
    checkoutData.paymentMethod = 'card';
    
    modalOverlay.style.display = 'block';
    checkoutModal.style.display = 'block';
    
    setTimeout(() => {
        modalOverlay.classList.add('active');
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 10);
    
    goToStep(1);
}

function closeCheckoutModal() {
    modalOverlay.classList.remove('active');
    checkoutModal.classList.remove('active');
    
    setTimeout(() => {
        modalOverlay.style.display = 'none';
        checkoutModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

function goToStep(stepNumber) {
    // Update steps
    steps.forEach(step => step.classList.remove('active', 'completed'));
    
    for (let i = 1; i <= stepNumber; i++) {
        const step = document.getElementById(`step${i}`);
        if (i < stepNumber) {
            step.classList.add('completed');
        } else {
            step.classList.add('active');
        }
    }
    
    // Show form step
    formSteps.forEach(form => form.classList.remove('active'));
    document.getElementById(`step${stepNumber}Form`).classList.add('active');
    
    currentStep = stepNumber;
    
    // Scroll to top of modal
    checkoutModal.scrollTop = 0;
}

function goToStep2() {
    // Validate step 1
    if (!fullNameInput.value.trim()) {
        showNotification('Please enter your full name');
        fullNameInput.focus();
        return;
    }
    
    if (!emailInput.value.trim()) {
        showNotification('Please enter your email address');
        emailInput.focus();
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
        showNotification('Please enter a valid email address');
        emailInput.focus();
        return;
    }
    
    if (!phoneInput.value.trim()) {
        showNotification('Please enter your phone number');
        phoneInput.focus();
        return;
    }
    
    // Save customer data
    checkoutData.customer = {
        name: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        timestamp: new Date().toISOString()
    };
    
    // Update order summary
    updateOrderSummary();
    
    goToStep(2);
}

function goToStep3() {
    updateOrderSummary();
    goToStep(3);
}

function updateOrderSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;
    
    let summaryHTML = '';
    
    cart.forEach(item => {
        const itemType = item.type === 'table' ? 'Table' : 'Ticket';
        summaryHTML += `
            <div class="order-item">
                <div>
                    <strong>${item.name}</strong>
                    <div style="font-size: 12px; color: var(--text-light);">${itemType} × ${item.quantity}</div>
                </div>
                <span>₦${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        `;
    });
    
    summaryHTML += `
        <div class="order-item" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border);">
            <span>Subtotal</span>
            <span>₦${subtotal.toLocaleString()}</span>
        </div>
        <div class="order-item">
            <span>Service Fee (5%)</span>
            <span>₦${serviceFee.toLocaleString()}</span>
        </div>
        <div class="order-item order-total">
            <span>Total Amount</span>
            <span>₦${total.toLocaleString()}</span>
        </div>
    `;
    
    orderSummaryBox.innerHTML = summaryHTML;
}

// ============================================
// FIREBASE FUNCTIONS
// ============================================
async function saveCustomerToFirestore(customerData, orderData, paymentReference) {
    try {
        console.log("🔄 Starting to save to Firestore...");

        const ticketDetails = []; // array of { id, name, type, price }
        const purchasedItems = [];

        // Process each item in the cart
        for (const item of cart) {
            // Generate a unique ticket ID for each quantity
            for (let i = 0; i < item.quantity; i++) {
                const ticketId = `SOU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                ticketDetails.push({
                    id: ticketId,
                    name: item.name,
                    type: item.type,
                    price: item.price
                });

                // Create individual ticket purchase record
                const ticketPurchase = {
                    ticketId: ticketId,
                    customerName: customerData.name,
                    customerEmail: customerData.email,
                    customerPhone: customerData.phone,
                    ticketType: item.name,
                    ticketPrice: item.price,
                    purchaseDate: firebase.firestore.FieldValue.serverTimestamp(),
                    paymentReference: paymentReference,
                    status: 'valid',
                    eventDate: '2026-12-15',
                    eventTime: '19:00',
                    eventLocation: 'Grand Arena, Lagos',
                    itemType: item.type,
                    quantity: 1,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                purchasedItems.push(ticketPurchase);
            }
        }

        // Save each ticket purchase individually
        const ticketPromises = purchasedItems.map(ticket => {
            return db.collection('ticketPurchases').add(ticket)
                .then(docRef => {
                    console.log('Ticket purchase saved with ID:', docRef.id);
                    return docRef.id;
                })
                .catch(error => {
                    console.error('Error saving ticket purchase:', error);
                    throw error;
                });
        });

        // Wait for all ticket purchases to be saved
        await Promise.all(ticketPromises);

        // Save the main order document
        const orderDocument = {
            customer: customerData,
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                type: item.type
            })),
            orderTotal: orderData.total,
            subtotal: orderData.subtotal,
            serviceFee: orderData.serviceFee,
            paymentReference: paymentReference,
            paymentMethod: checkoutData.paymentMethod,
            ticketIds: ticketDetails.map(t => t.id),
            ticketDetails: ticketDetails, // include details
            orderDate: firebase.firestore.FieldValue.serverTimestamp(),
            specialInstructions: document.getElementById('specialInstructions').value.trim() || '',
            status: 'completed',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("Saving order document:", orderDocument);

        // Save to Firestore
        const docRef = await db.collection('orders').add(orderDocument);

        console.log('✅ Order saved to Firestore with ID:', docRef.id);

        return {
            orderId: docRef.id,
            ticketDetails: ticketDetails
        };

    } catch (error) {
        console.error('❌ Error saving to Firestore:', error);
        throw error;
    }
}






// ============================================
// SEND EMAIL FUNCTION
// ============================================
async function sendConfirmationEmail(customerData, orderData, paymentReference, firestoreResult) {
    try {
        // Prepare email content with ticket type details
        const emailContent = {
            to: customerData.email,
            message: {
                subject: `🎫 Straight Outta Uni - Order Confirmation #${paymentReference}`,
                html: generateEmailHTML(customerData, orderData, paymentReference, firestoreResult),
                text: generateEmailText(customerData, orderData, paymentReference, firestoreResult)
            }
        };
        
        // Save email to Firestore for backend processing
        await db.collection('emailQueue').add({
            ...emailContent,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            customerName: customerData.name,
            orderId: firestoreResult.orderId
        });
        
        console.log('✅ Email queued for sending');
        
    } catch (error) {
        console.error('❌ Error queuing email:', error);
        // Don't throw error - email sending shouldn't block payment
    }
}

function generateEmailHTML(customerData, orderData, paymentReference, firestoreResult) {
    const subtotal = orderData.subtotal;
    const serviceFee = orderData.serviceFee;
    const total = orderData.total;
    
    let itemsHTML = '';
    firestoreResult.purchasedItems.forEach(item => {
        const itemType = item.type === 'table' ? 'Table Reservation' : 'Ticket';
        itemsHTML += `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong>${item.name}</strong><br>
                    <small>${itemType} × ${item.quantity}</small>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    ₦${(item.price * item.quantity).toLocaleString()}
                </td>
            </tr>
        `;
    });
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
                .ticket-id { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 14px; }
                .total-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #22c55e; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">🎓 Straight Outta Uni</h1>
                    <p style="opacity: 0.9; margin: 10px 0 0;">Order Confirmation</p>
                </div>
                
                <div class="content">
                    <h2>Thank You for Your Purchase, ${customerData.name}!</h2>
                    <p>Your order has been confirmed and your tickets have been reserved.</p>
                    
                    <h3>📋 Order Details</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        ${itemsHTML}
                    </table>
                    
                    <div class="total-box">
                        <h4 style="margin: 0 0 10px 0; color: #166534;">Order Summary</h4>
                        <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₦${subtotal.toLocaleString()}</p>
                        <p style="margin: 5px 0;"><strong>Service Fee (5%):</strong> ₦${serviceFee.toLocaleString()}</p>
                        <p style="margin: 10px 0; font-size: 18px; font-weight: bold; color: #166534;">Total: ₦${total.toLocaleString()}</p>
                    </div>
                    
                    <h3>🎫 Your Ticket Information</h3>
                    <p>Your ticket IDs have been generated and are ready for use:</p>
                    ${firestoreResult.ticketIds.slice(0, 3).map(id => `
                        <div class="ticket-id">${id}</div>
                    `).join('')}
                    ${firestoreResult.ticketIds.length > 3 ? `<p>+ ${firestoreResult.ticketIds.length - 3} more tickets</p>` : ''}
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
                        <h4 style="margin: 0 0 10px 0; color: #92400e;">⚠️ Important Information</h4>
                        <p style="margin: 5px 0;"><strong>Event Date:</strong> December 15, 2026</p>
                        <p style="margin: 5px 0;"><strong>Event Time:</strong> 7:00 PM - 2:00 AM</p>
                        <p style="margin: 5px 0;"><strong>Location:</strong> Grand Arena, Lagos</p>
                        <p style="margin: 10px 0 0; font-weight: bold;">Please bring a valid ID and this confirmation email for entry.</p>
                    </div>
                    
                    <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                        <h4 style="margin: 0 0 10px 0; color: #1e40af;">Order Reference</h4>
                        <p style="margin: 0;"><strong>Payment Reference:</strong> ${paymentReference}</p>
                        <p style="margin: 5px 0 0;"><strong>Order ID:</strong> ${firestoreResult.orderId}</p>
                    </div>
                    
                    <p style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                        Need help? Contact us at support@straightouttauni.com
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function generateEmailText(customerData, orderData, paymentReference, firestoreResult) {
    return `
        STRAIGHT OUTTA UNI - ORDER CONFIRMATION
        ========================================
        
        Thank you for your purchase, ${customerData.name}!
        
        ORDER DETAILS:
        -------------
        ${firestoreResult.purchasedItems.map(item => 
            `${item.name} (${item.type === 'table' ? 'Table' : 'Ticket'} × ${item.quantity}) - ₦${(item.price * item.quantity).toLocaleString()}`
        ).join('\n')}
        
        Order Summary:
        -------------
        Subtotal: ₦${orderData.subtotal.toLocaleString()}
        Service Fee (5%): ₦${orderData.serviceFee.toLocaleString()}
        Total: ₦${orderData.total.toLocaleString()}
        
        YOUR TICKET IDs:
        ---------------
        ${firestoreResult.ticketIds.slice(0, 5).join('\n')}
        ${firestoreResult.ticketIds.length > 5 ? `+ ${firestoreResult.ticketIds.length - 5} more tickets` : ''}
        
        EVENT INFORMATION:
        -----------------
        Date: December 15, 2026
        Time: 7:00 PM - 2:00 AM
        Location: Grand Arena, Lagos
        
        ORDER REFERENCE:
        ---------------
        Payment Reference: ${paymentReference}
        Order ID: ${firestoreResult.orderId}
        
        IMPORTANT:
        ----------
        • Please bring a valid ID and this confirmation for entry
        • Save your ticket IDs for quick check-in
        • For assistance, contact: support@straightouttauni.com
        
        See you at the event! 🎉
    `;
}

// ============================================
// PAYMENT PROCESSING - FIXED VERSION
// ============================================
function processPayment() {
    console.log("🔄 Starting payment process...");
    
    // Basic validation
    if (!checkoutData.paymentMethod) {
        showNotification('Please select a payment method');
        return;
    }
    
    // Calculate total
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;
    
    // Validate customer data is available
    if (!checkoutData.customer || !checkoutData.customer.email) {
        showNotification('Please fill in your personal information first');
        goToStep(1);
        return;
    }
    
    // Show processing notification
    showNotification('Processing payment...');
    
    // ✅ TEST Paystack Key (Public Key)
    const paystackPublicKey = 'pk_test_9919223f9c2ce89545b15367cdb79e64dab0f96d';
    
    // Generate a unique reference
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    const reference = `SOU-${timestamp}-${random}`;
    
    console.log("Payment Details:", {
        customerEmail: checkoutData.customer.email,
        amount: total,
        amountInKobo: total * 100,
        reference: reference
    });
    
    // ✅ FIX: Define callback functions BEFORE using them
    const paymentCallback = function(response) {
        console.log("✅ Payment successful! Response:", response);
        
        // Process payment success
        handlePaymentSuccess(response.reference, total, response);
    };
    
    const paymentOnClose = function() {
        console.log("Payment modal was closed");
        showNotification('Payment was cancelled');
    };
    
    try {
        // Check if Paystack is available
        if (typeof PaystackPop === 'undefined') {
            throw new Error('Paystack payment system is not loaded. Please refresh the page.');
        }
        
        if (typeof PaystackPop.setup !== 'function') {
            throw new Error('Paystack setup function is not available.');
        }
        
        console.log("Creating Paystack handler...");
        
        // Create Paystack handler
        const handler = PaystackPop.setup({
            key: paystackPublicKey,
            email: checkoutData.customer.email,
            amount: total * 100, // Convert to kobo
            currency: 'NGN',
            ref: reference,
            metadata: {
                custom_fields: [
                    {
                        display_name: "Customer Name",
                        variable_name: "customer_name",
                        value: checkoutData.customer.name
                    },
                    {
                        display_name: "Phone Number",
                        variable_name: "phone_number",
                        value: checkoutData.customer.phone
                    },
                    {
                        display_name: "Order Items",
                        variable_name: "order_items",
                        value: cart.map(item => `${item.name} (x${item.quantity})`).join(', ')
                    }
                ]
            },
            callback: paymentCallback,  // ✅ Correctly defined function
            onClose: paymentOnClose     // ✅ Correctly defined function
        });
        
        console.log("Opening Paystack iframe...");
        
        // Open the Paystack payment modal
        handler.openIframe();
        
    } catch (error) {
        console.error("❌ Paystack error:", error);
        showNotification('Payment system error: ' + error.message);
    }
}

// ============================================
// HANDLE PAYMENT SUCCESS
// ============================================
async function handlePaymentSuccess(paymentReference, totalAmount, paystackResponse) {
    console.log("🔄 Processing successful payment...");

    try {
        // Prepare order data
        const orderData = {
            subtotal: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
            serviceFee: Math.round(cart.reduce((total, item) => total + (item.price * item.quantity), 0) * 0.05),
            total: totalAmount
        };

        console.log("Order data:", orderData);

        // Save to Firestore
        console.log("Saving to Firestore...");
        const firestoreResult = await saveCustomerToFirestore(
            checkoutData.customer,
            orderData,
            paymentReference
        );

        console.log("Firestore save result:", firestoreResult);

        // Send confirmation email
        console.log("Sending confirmation email...");
        await sendConfirmationEmail(
            checkoutData.customer,
            orderData,
            paymentReference,
            firestoreResult
        );

        // Update checkout data with ticket IDs
        checkoutData.ticketIds = firestoreResult.ticketDetails.map(t => t.id);

        // Show success message WITH TICKET DETAILS
        showPaymentSuccess(paymentReference, firestoreResult, paystackResponse);

        // Clear cart
        cart = [];
        saveCart();
        updateCartDisplay();

        console.log("✅ Payment processing completed successfully");

    } catch (error) {
        console.error('❌ Error in payment processing:', error);
        // showNotification('Payment successful but there was an error saving your order. Please contact support with reference: ' + paymentReference);
    }
}





// ============================================
// SHOW PAYMENT SUCCESS
// ============================================
function showPaymentSuccess(reference, firestoreResult, paystackResponse = null) {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;

    // Clear previous content
    paymentDetails.innerHTML = '';

    // Create container for ticket cards
    const ticketsContainer = document.createElement('div');
    ticketsContainer.className = 'ticket-cards-container';
    ticketsContainer.id = 'ticketCardsContainer';

    // Generate a ticket card for each ticket
    firestoreResult.ticketDetails.forEach((ticket, index) => {
        const ticketCard = document.createElement('div');
        ticketCard.className = 'ticket-card';
        ticketCard.id = `ticket-${ticket.id}`;
        ticketCard.setAttribute('data-ticket-index', index);

        // Ticket data for QR code
        const qrData = JSON.stringify({
            ticketId: ticket.id,
            ticketType: ticket.name,
            event: "Straight Outta Uni",
            date: "2026-12-15",
            time: "19:00",
            location: "Grand Arena, Lagos",
            customer: checkoutData.customer.name,
            purchaseDate: new Date().toISOString(),
            price: ticket.price,
            type: ticket.type
        });

        ticketCard.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-info">
                    <h4>${ticket.name}</h4>
                    <span class="ticket-type">${ticket.type === 'table' ? 'Table Reservation' : 'Ticket'}</span>
                </div>
                <div class="ticket-price">₦${ticket.price.toLocaleString()}</div>
            </div>
            <div class="ticket-id">ID: ${ticket.id}</div>
            <div class="ticket-body">
                <div class="ticket-qrcode" id="qrcode-${ticket.id}">
                    <div style="padding: 20px; text-align: center; color: #666;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <div>Generating QR Code...</div>
                    </div>
                </div>
                <div class="ticket-details">
                    <div class="ticket-detail-row">
                        <span>Event:</span>
                        <span>Straight Outta Uni</span>
                    </div>
                    <div class="ticket-detail-row">
                        <span>Date:</span>
                        <span>Dec 15, 2026</span>
                    </div>
                    <div class="ticket-detail-row">
                        <span>Time:</span>
                        <span>7:00 PM - 2:00 AM</span>
                    </div>
                    <div class="ticket-detail-row">
                        <span>Location:</span>
                        <span>Grand Arena, Lagos</span>
                    </div>
                    <div class="ticket-detail-row">
                        <span>Customer:</span>
                        <span>${checkoutData.customer.name}</span>
                    </div>
                </div>
            </div>
            <div class="ticket-actions">
                <button class="btn btn-primary download-ticket-btn" data-ticket-id="${ticket.id}" data-ticket-index="${index}">
                    <i class="fas fa-download"></i> Download Ticket
                </button>
                <button class="btn btn-outline share-ticket-btn" data-ticket-id="${ticket.id}">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        `;

        ticketsContainer.appendChild(ticketCard);

        // Generate QR code for this ticket
        setTimeout(() => generateQRCodeForTicket(ticket.id, qrData), 100);
    });

    // Add event listeners to download buttons
    setTimeout(() => {
        document.querySelectorAll('.download-ticket-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const ticketId = this.getAttribute('data-ticket-id');
                const index = this.getAttribute('data-ticket-index');
                downloadTicket(ticketId, index);
            });
        });

        document.querySelectorAll('.share-ticket-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const ticketId = this.getAttribute('data-ticket-id');
                shareTicket(ticketId);
            });
        });
    }, 500);

    // Add ticket cards container to payment details
    paymentDetails.appendChild(ticketsContainer);

    // Add order summary section
    const orderSummary = document.createElement('div');
    orderSummary.style.marginTop = '30px';
    orderSummary.innerHTML = `
        <div style="background: #FEF2F2; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid rgba(220, 38, 38, 0.1);">
            <h4 style="color: var(--primary); margin-bottom: 15px;">Order Summary</h4>
            <p><strong>Payment Reference:</strong> ${reference}</p>
            <p><strong>Customer Name:</strong> ${checkoutData.customer.name}</p>
            <p><strong>Email:</strong> ${checkoutData.customer.email}</p>
            <p><strong>Total Paid:</strong> ₦${total.toLocaleString()}</p>
            <p><strong>Number of Tickets:</strong> ${firestoreResult.ticketDetails.length}</p>
            ${paystackResponse ? `<p><strong>Transaction ID:</strong> ${paystackResponse.transaction || 'N/A'}</p>` : ''}
        </div>
        <div style="background: rgba(34, 197, 94, 0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: var(--success); margin: 0;">
                <i class="fas fa-check-circle"></i> Confirmation email sent to ${checkoutData.customer.email}
            </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <button class="btn btn-outline" onclick="closeCheckoutModal()" style="padding: 12px 24px;">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;

    paymentDetails.appendChild(orderSummary);

    // Show success screen
    document.getElementById('step3Form').classList.remove('active');
    document.getElementById('paymentSuccess').classList.add('active');
}




// ============================================
        // QR CODE GENERATION FUNCTION
        // ============================================
        function generateQRCodeForTicket(ticketId, qrData) {
            const qrContainer = document.getElementById(`qrcode-${ticketId}`);
            if (!qrContainer) {
                console.error(`QR container not found: qrcode-${ticketId}`);
                return;
            }

            // Clear any existing content
            qrContainer.innerHTML = '';

            try {
                // Check if QRious is available
                if (typeof QRious === 'undefined') {
                    throw new Error('QRious library not loaded');
                }

                // Create a canvas element
                const canvas = document.createElement('canvas');
                canvas.id = `qr-canvas-${ticketId}`;
                canvas.width = 180;
                canvas.height = 180;
                
                // Generate QR code using QRious
                const qr = new QRious({
                    element: canvas,
                    value: qrData,
                    size: 180,
                    level: 'H', // Error correction level: L, M, Q, H
                    background: 'white',
                    backgroundAlpha: 1,
                    foreground: 'black',
                    foregroundAlpha: 1
                });

                // Add canvas to container
                qrContainer.appendChild(canvas);
                console.log(`✅ QR code generated for ticket: ${ticketId}`);
                
            } catch (error) {
                console.error('Error generating QR code:', error);
                // Fallback: Show ticket ID if QR code fails
                qrContainer.innerHTML = `
                    <div style="color: var(--primary); text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🎫</div>
                        <div style="font-weight: bold; margin-bottom: 5px;">Ticket ID</div>
                        <div style="font-family: monospace; font-size: 12px; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            ${ticketId}
                        </div>
                    </div>
                `;
            }
        }




        // ============================================
        // DOWNLOAD TICKET FUNCTION
        // ============================================
        async function downloadTicket(ticketId, index) {
            const ticketElement = document.getElementById(`ticket-${ticketId}`);
            if (!ticketElement) {
                showNotification('Ticket not found');
                return;
            }

            // Hide the action buttons before capturing
            const buttonsContainer = ticketElement.querySelector('.ticket-actions');
            const originalDisplay = buttonsContainer.style.display;
            buttonsContainer.style.display = 'none';

            // Add a download notice temporarily
            const downloadNotice = document.createElement('div');
            downloadNotice.innerHTML = '<div style="background: rgba(220, 38, 38, 0.1); padding: 10px; border-radius: 6px; margin: 10px 0; text-align: center; font-weight: 600; color: #DC2626;"><i class="fas fa-download"></i> Downloading Ticket...</div>';
            ticketElement.insertBefore(downloadNotice, buttonsContainer);

            try {
                // Use html2canvas to capture the ticket (without buttons)
                const canvas = await html2canvas(ticketElement, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    removeContainer: true
                });

                // Convert canvas to data URL
                const dataUrl = canvas.toDataURL('image/png', 1.0);

                // Create download link
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `Straight_Outta_Uni_Ticket_${index + 1}_${ticketId.substring(0, 8)}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showNotification('Ticket downloaded successfully!');
            } catch (error) {
                console.error('Error downloading ticket:', error);
                showNotification('Failed to download ticket. Please try again.');
            } finally {
                // Remove download notice
                downloadNotice.remove();
                
                // Restore the buttons container
                buttonsContainer.style.display = originalDisplay;
            }
        }


        // ============================================
        // SHARE TICKET FUNCTION (optional)
        // ============================================
        function shareTicket(ticketId) {
            const ticketElement = document.getElementById(`ticket-${ticketId}`);
            if (!ticketElement) return;

            // For now, just copy ticket ID to clipboard
            navigator.clipboard.writeText(ticketId)
                .then(() => {
                    showNotification('Ticket ID copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = ticketId;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        showNotification('Ticket ID copied!');
                    } catch (e) {
                        showNotification('Failed to copy ticket ID.');
                    }
                    document.body.removeChild(textArea);
                });
        }


// ============================================
// UTILITY FUNCTIONS
// ============================================
function showNotification(message) {
    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        font-weight: 600;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function scrollToTickets() {
    document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// PAYSTACK VERIFICATION
// ============================================
function verifyPaystack() {
    console.log("=== PAYSTACK VERIFICATION ===");
    console.log("PaystackPop is defined:", typeof PaystackPop !== 'undefined');
    console.log("PaystackPop.setup is function:", typeof PaystackPop?.setup === 'function');
    console.log("Paystack version:", PaystackPop?.VERSION);
    console.log("============================");
}

// ============================================
// INITIALIZE APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // Check if QRious library is loaded
    if (typeof QRious === 'undefined') {
        console.error("QRious library not loaded!");
        // Try to load it dynamically if not loaded
        loadQRiousLibrary();
    } else {
        console.log("✅ QRious library loaded successfully");
    }
    
    init();
});

// Dynamic library loading as fallback
function loadQRiousLibrary() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
    script.onload = function() {
        console.log("✅ QRious library loaded dynamically");
    };
    script.onerror = function() {
        console.error("Failed to load QRious library");
    };
    document.head.appendChild(script);
}

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.scrollToTickets = scrollToTickets;
window.downloadTicket = downloadTicket;
window.shareTicket = shareTicket;
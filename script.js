// Cart data
let cart = JSON.parse(localStorage.getItem('straightOuttaUniCart')) || [];
let checkoutData = {
    customer: {},
    paymentMethod: 'card'
};
let currentStep = 1;

// DOM Elements
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

// Initialize
function init() {
    updateCartDisplay();
    setupEventListeners();
}

// Setup event listeners
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
            const name = e.target.getAttribute('data-name') || e.target.closest('.add-to-cart').getAttribute('data-name');
            const price = parseInt(e.target.getAttribute('data-price') || e.target.closest('.add-to-cart').getAttribute('data-price'));
            addToCart(name, price);
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

// Cart functions
function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
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

// Checkout modal functions
function openCheckoutModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty');
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
        phone: phoneInput.value.trim()
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
        summaryHTML += `
            <div class="order-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>₦${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        `;
    });
    
    summaryHTML += `
        <div class="order-item">
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

function processPayment() {
    if (!checkoutData.paymentMethod) {
        showNotification('Please select a payment method');
        return;
    }
    
    // Calculate total
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;
    
    // Show processing notification
    showNotification('Processing payment...');
    
    // In production, replace with your actual Paystack public key
    const paystackPublicKey = 'pk_live_322c5190247dd9f132100d38c74eac8a55ef1b42';
    
    // Create Paystack handler
    const handler = PaystackPop.setup({
        key: paystackPublicKey,
        email: checkoutData.customer.email,
        amount: total * 100, // Convert to kobo
        currency: 'NGN',
        ref: 'SOU-' + Date.now(),
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
                }
            ]
        },
        callback: function(response) {
            // Payment successful
            showPaymentSuccess(response.reference);
            
            // Clear cart
            cart = [];
            saveCart();
            updateCartDisplay();
        },
        onClose: function() {
            showNotification('Payment was cancelled');
        }
    });
    
    handler.openIframe();
}

function showPaymentSuccess(reference) {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;
    
    // Update payment details
    paymentDetails.innerHTML = `
        <p><strong>Order Reference:</strong> ${reference}</p>
        <p><strong>Customer Name:</strong> ${checkoutData.customer.name}</p>
        <p><strong>Email:</strong> ${checkoutData.customer.email}</p>
        <p><strong>Phone:</strong> ${checkoutData.customer.phone}</p>
        <p><strong>Total Paid:</strong> ₦${total.toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${checkoutData.paymentMethod.charAt(0).toUpperCase() + checkoutData.paymentMethod.slice(1)}</p>
        <p><strong>Confirmation:</strong> A confirmation email has been sent to ${checkoutData.customer.email}</p>
    `;
    
    // Show success screen
    goToStep(4);
}

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
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        font-weight: 700;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
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

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.scrollToTickets = scrollToTickets;

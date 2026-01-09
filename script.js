
// Cart data and state
let cart = [];
const cartKey = 'straightOuttaUniCart';

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
const checkoutModal = document.getElementById('checkoutModal');
const closeModal = document.getElementById('closeModal');
const checkoutForm = document.getElementById('checkoutForm');
const orderItemsSelect = document.getElementById('orderItems');
const confirmTotal = document.getElementById('confirmTotal');
const addToCartButtons = document.querySelectorAll('.add-to-cart');

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartDisplay();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

// Add item to cart
function addToCart(name, price) {
    // Check if item already exists in cart
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartDisplay();
    
    // Show notification
    showNotification(`${name} added to cart!`);
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    
    showNotification('Item removed from cart');
}

// Update item quantity
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

// Update cart display
function updateCartDisplay() {
    // Update cart count in header
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
    confirmTotal.textContent = `₦${total.toLocaleString()}`;
    
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
        
        // Update order items select in modal
        updateOrderItemsSelect();
    }
}

// Update order items select in modal
function updateOrderItemsSelect() {
    orderItemsSelect.innerHTML = '';
    
    cart.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = `${item.name} (${item.quantity} × ₦${item.price.toLocaleString()})`;
        orderItemsSelect.appendChild(option);
    });
    
    if (cart.length > 0) {
        orderItemsSelect.disabled = false;
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 16px 24px;
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        font-weight: 600;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    notification.textContent = message;
    
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

// Scroll to tickets section
function scrollToTickets() {
    document.getElementById('tickets').scrollIntoView({
        behavior: 'smooth'
    });
}

// Event Listeners
mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

cartButton.addEventListener('click', () => {
    document.getElementById('cart').scrollIntoView({
        behavior: 'smooth'
    });
});

addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
        const name = button.getAttribute('data-name');
        const price = parseInt(button.getAttribute('data-price'));
        addToCart(name, price);
    });
});

checkoutBtn.addEventListener('click', () => {
    if (cart.length > 0) {
        checkoutModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
});

closeModal.addEventListener('click', () => {
    checkoutModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
        checkoutModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('customerName').value;
    const email = document.getElementById('customerEmail').value;
    const phone = document.getElementById('customerPhone').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // In a real application, you would send this data to a server
    // For this demo, we'll just show a confirmation
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;
    
    alert(`Thank you for your purchase, ${name}!\n\nA confirmation email has been sent to ${email}.\nYour order total is ₦${total.toLocaleString()}.\n\nPlease complete your payment via ${paymentMethod} to secure your tickets.`);
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartDisplay();
    
    // Reset form
    checkoutForm.reset();
    
    // Close modal
    checkoutModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Smooth scrolling for anchor links
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
            
            // Close mobile menu if open
            navMenu.classList.remove('active');
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.padding = '8px 0';
        header.style.boxShadow = 'var(--shadow-lg)';
    } else {
        header.style.padding = '12px 0';
        header.style.boxShadow = 'var(--shadow)';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});

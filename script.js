// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');
const body = document.body;

// Check for saved theme preference or default to light
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    body.classList.add('dark-theme');
    themeIcon.innerHTML = '<i class="fas fa-sun"></i>';
    themeText.textContent = 'Light Mode';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
        themeIcon.innerHTML = '<i class="fas fa-sun"></i>';
        themeText.textContent = 'Light Mode';
    } else {
        localStorage.setItem('theme', 'light');
        themeIcon.innerHTML = '<i class="fas fa-moon"></i>';
        themeText.textContent = 'Dark Mode';
    }
});

// Calculator functionality
const damageButtons = document.querySelectorAll('.damage-btn');
const quantityButtons = document.querySelectorAll('.quantity-btn');
const quantityDisplays = document.querySelectorAll('.quantity-display');
const towServiceCheckbox = document.getElementById('towService');
const totalAmountElement = document.getElementById('totalAmount');
const copyReceiptButton = document.getElementById('copyReceipt');
const clearCalculatorButton = document.getElementById('clearCalculator');
const notification = document.getElementById('notification');

let selectedDamageLevel = null;
let totalAmount = 0;

// Initialize quantities
let quantities = {
    doors: 0,
    windows: 0,
    tyres: 0,
    motorOil: 0,
    repairKit: 0
};

// Set up damage level buttons
damageButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove selected class from all buttons
        damageButtons.forEach(btn => btn.classList.remove('selected'));
        // Add selected class to clicked button
        button.classList.add('selected');
        
        // Update selected damage level
        selectedDamageLevel = button.getAttribute('data-level');
        
        // Recalculate total
        calculateTotal();
    });
});

// Set up quantity buttons
quantityButtons.forEach(button => {
    button.addEventListener('click', () => {
        const item = button.getAttribute('data-item');
        const action = button.getAttribute('data-action');
        
        if (action === 'increase') {
            quantities[item]++;
        } else if (action === 'decrease' && quantities[item] > 0) {
            quantities[item]--;
        }
        
        // Update display
        updateQuantityDisplay(item);
        
        // Update button states
        updateButtonStates(item);
        
        // Recalculate total
        calculateTotal();
    });
});

// Set up tow service checkbox
towServiceCheckbox.addEventListener('change', calculateTotal);

// Update quantity display
function updateQuantityDisplay(item) {
    const display = document.querySelector(`.quantity-display[data-item="${item}"]`);
    if (display) {
        display.textContent = quantities[item];
    }
}

// Update button states (enable/disable)
function updateButtonStates(item) {
    const decreaseButton = document.querySelector(`.quantity-btn[data-item="${item}"][data-action="decrease"]`);
    if (decreaseButton) {
        decreaseButton.disabled = quantities[item] === 0;
    }
}

// Calculate total function
function calculateTotal() {
    totalAmount = 0;
    
    // Add damage level cost
    if (selectedDamageLevel) {
        totalAmount += CONFIG.damageCosts[selectedDamageLevel];
    }
    
    // Add tow service cost if selected
    if (towServiceCheckbox.checked) {
        totalAmount += CONFIG.towServiceCost;
    }
    
    // Add item costs
    for (const item in quantities) {
        totalAmount += quantities[item] * CONFIG.itemCosts[item];
    }
    
    // Update total amount display
    totalAmountElement.textContent = `$${totalAmount}`;
}

// Format date and time in 12-hour format
function getFormattedDateTime() {
    const now = new Date();
    
    // Format date as MM/DD/YYYY
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    
    // Format time in 12-hour format with AM/PM
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    const formattedTime = `${hours}:${minutes} ${ampm}`;
    
    return `${formattedDate}, ${formattedTime}`;
}

// Copy receipt to clipboard
copyReceiptButton.addEventListener('click', async () => {
    // Check if there's anything to create a receipt for
    const hasItems = Object.values(quantities).some(qty => qty > 0);
    const hasServices = selectedDamageLevel || towServiceCheckbox.checked;
    
    if (!hasItems && !hasServices) {
        showNotification('Please add at least one item or service to generate a receipt!', 'warning');
        return;
    }

    // Show loading state
    const originalText = copyReceiptButton.innerHTML;
    copyReceiptButton.innerHTML = '<i class="fas fa-spinner"></i> Copying...';
    copyReceiptButton.disabled = true;

    try {
        let receipt = "HAYES REPAIR SHOP\n";
        receipt += "=== RECEIPT ===\n";
        receipt += "------------------------------\n";
        receipt += `Intern Macanic : Jolil Mia\n`;
        receipt += `Date: ${getFormattedDateTime()}\n`;
        receipt += "------------------------------\n";
        receipt += "SERVICES & ITEMS:\n";
        
        if (selectedDamageLevel) {
            const damageName = selectedDamageLevel.charAt(0).toUpperCase() + selectedDamageLevel.slice(1);
            receipt += `• Damage Repair (${damageName}) - $${CONFIG.damageCosts[selectedDamageLevel]}\n`;
        }
        
        // Add tow service
        if (towServiceCheckbox.checked) {
            receipt += "• Tow Service - $100\n";
        }
        
        // Add items with quantities
        for (const item in quantities) {
            if (quantities[item] > 0) {
                const itemName = getItemDisplayName(item);
                const itemCost = CONFIG.itemCosts[item];
                const itemTotal = quantities[item] * itemCost;
                receipt += `• ${itemName} (x${quantities[item]}) - $${itemTotal}\n`;
            }
        }
        
        receipt += "------------------------------\n";
        receipt += `TOTAL: $${totalAmount}\n`;
        receipt += "------------------------------\n";
        receipt += "Thank you for choosing Hayes Repair Shop!";
        
        await navigator.clipboard.writeText(receipt);
        showNotification('Receipt copied to clipboard!');
        
    } catch (err) {
        console.error('Failed to copy receipt: ', err);
        showNotification('Failed to copy receipt. Please try again.', 'error');
    } finally {
        // Restore button state
        copyReceiptButton.innerHTML = '<i class="fas fa-receipt"></i> Copy Receipt';
        copyReceiptButton.disabled = false;
    }
});

// Clear calculator
clearCalculatorButton.addEventListener('click', () => {
    // Reset damage level
    damageButtons.forEach(btn => btn.classList.remove('selected'));
    selectedDamageLevel = null;
    
    // Reset tow service
    towServiceCheckbox.checked = false;
    
    // Reset quantities
    for (const item in quantities) {
        quantities[item] = 0;
        updateQuantityDisplay(item);
        updateButtonStates(item);
    }
    
    // Reset total
    totalAmount = 0;
    totalAmountElement.textContent = `$${totalAmount}`;
    
    showNotification('Calculator cleared!');
});

// Get display name for items
function getItemDisplayName(item) {
    const names = {
        doors: 'Doors',
        windows: 'Windows',
        tyres: 'Tyres',
        motorOil: 'Motor Oil',
        repairKit: 'Repair Kit'
    };
    return names[item] || item;
}

// Show notification function
function showNotification(message, type = 'success') {
    const icon = notification.querySelector('i');
    notification.querySelector('span').textContent = message;
    
    // Set color based on type
    if (type === 'warning') {
        icon.className = 'fas fa-exclamation-triangle';
        notification.classList.add('warning');
        notification.classList.remove('error');
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        notification.classList.add('error');
        notification.classList.remove('warning');
    } else {
        icon.className = 'fas fa-check-circle';
        notification.classList.remove('warning', 'error');
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize button states
for (const item in quantities) {
    updateButtonStates(item);
}

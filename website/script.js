/**
 * Fact-It Website JavaScript
 * Handles: Browser detection, Stripe checkout, license activation
 */

// Detect browser and show appropriate install button
function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  const installButtons = document.querySelectorAll('.install-btn');

  installButtons.forEach((button) => {
    const store = button.getAttribute('data-store');

    if (userAgent.includes('firefox') && store === 'firefox') {
      button.style.display = 'inline-block';
      button.href = 'https://addons.mozilla.org/firefox/addon/fact-it/'; // TODO: Replace with actual Firefox link
    } else if ((userAgent.includes('chrome') || userAgent.includes('edg')) && store === 'chrome') {
      button.style.display = 'inline-block';
      button.href = 'https://chrome.google.com/webstore/detail/fact-it/'; // TODO: Replace with actual Chrome link
    }
  });
}

/**
 * ✅ STORE COMPLIANT: Handle subscription checkout
 * Opens Stripe checkout on external website (not in extension)
 */
async function handleCheckout(tier) {
  // Show loading state
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = 'Loading...';
  button.disabled = true;

  try {
    // TODO: Replace with your actual backend API endpoint
    const response = await fetch('https://your-backend.com/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier: tier,
        successUrl: `${window.location.origin}/success.html`,
        cancelUrl: `${window.location.origin}/pricing`,
      }),
    });

    const data = await response.json();

    if (data.url) {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } else {
      alert('Error creating checkout session. Please try again or contact support.');
      button.textContent = originalText;
      button.disabled = false;
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Network error. Please check your connection and try again.');
    button.textContent = originalText;
    button.disabled = false;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  detectBrowser();
});

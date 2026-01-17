import './styles.css';

class PaymentGateway {
    constructor(options) {
        if (!options.key) throw new Error('PaymentGateway: "key" is required');
        if (!options.orderId) throw new Error('PaymentGateway: "orderId" is required');

        this.options = {
            key: options.key,
            orderId: options.orderId,
            onSuccess: options.onSuccess || (() => { }),
            onFailure: options.onFailure || (() => { }),
            onClose: options.onClose || (() => { }),
            baseUrl: options.baseUrl || 'http://localhost:3001' // Default to local checkout page
        };

        this.isOpen = false;
        this.handleMessage = this.handleMessage.bind(this);
        this.close = this.close.bind(this);
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        // Create container
        this.modal = document.createElement('div');
        this.modal.id = 'payment-gateway-modal';
        this.modal.setAttribute('data-test-id', 'payment-modal');

        // Inner HTML structure
        this.modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <button class="close-button" data-test-id="close-modal-button">×</button>
          <iframe 
            data-test-id="payment-iframe"
            src="${this.options.baseUrl}/checkout?order_id=${this.options.orderId}&embedded=true&key=${this.options.key}"
            allow="payment"
          ></iframe>
        </div>
      </div>
    `;

        // Append to body
        document.body.appendChild(this.modal);

        // Event Listeners
        this.modal.querySelector('.close-button').addEventListener('click', this.close);
        window.addEventListener('message', this.handleMessage);

        // Close on overlay click
        this.modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.close();
            }
        });
    }

    handleMessage(event) {
        // In production, validate event.origin against allowed domains
        // if (event.origin !== this.options.baseUrl) return; 

        // Look for data.type
        const { type, data } = event.data;

        if (type === 'payment_success') {
            this.options.onSuccess(data);
            this.close();
        } else if (type === 'payment_failed') {
            this.options.onFailure(data);
            // Don't auto-close on failure, let user retry or close manually?
            // Or close? Usually keep open for retry or show error in iframe.
            // But if iframe sends 'payment_failed', it usually means final failure or it handles error internally.
            // If it passed up, maybe we should just log it.
        } else if (type === 'close_modal') {
            this.close();
        }
    }

    close() {
        if (!this.isOpen) return;

        // Remove listeners
        window.removeEventListener('message', this.handleMessage);

        // Remove from DOM
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }

        this.isOpen = false;
        this.options.onClose();
    }
}

// Global Export
window.PaymentGateway = PaymentGateway;

export default PaymentGateway;

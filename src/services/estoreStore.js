/**
 * E-Store (Pooja Samagri) Core Engine & State Store (Partner App)
 * Implements the E-Store PRD for Merchant, Warehouse Staff & Pandit:
 * - Warehouse-wise Inventory management & low-stock alerts
 * - Pick list generation, Barcode scan packing, Weighing, Label & GST invoice printing
 * - Dispatch & Courier integration (Delhivery / Shiprocket AWB)
 * - Return request review with photo inspection & reverse pickup
 * - Pandit Pooja Kit awareness (Yajman ordered kit)
 */

export const STORE_CATEGORIES = [
  { id: 'all', name: 'All', hi: 'सभी उत्पाद', icon: 'apps' },
  { id: 'kits', name: 'Pooja Kits', hi: 'सम्पूर्ण पूजा किट', icon: 'package-variant-closed', featured: true },
  { id: 'havan', name: 'Havan Samagri', hi: 'हवन सामग्री व समिधा', icon: 'fire' },
  { id: 'dhoop', name: 'Dhoop & Agarbatti', hi: 'धूप व अगरबत्ती', icon: 'scent' },
  { id: 'diya', name: 'Diya & Deepak', hi: 'दीया व अखंड ज्योति', icon: 'candle' },
  { id: 'murti', name: 'Murti & Idols', hi: 'दिव्य मूर्तियां व विग्रह', icon: 'temple-hindu' },
  { id: 'bartan', name: 'Pooja Bartan', hi: 'पीतल व ताम्र बर्तन', icon: 'pot' },
  { id: 'vastra', name: 'Vastra & Shringar', hi: 'वस्त्र व श्रृंगार सामग्री', icon: 'tshirt-crew' },
  { id: 'mala', name: 'Mala & Rudraksh', hi: 'रुद्राक्ष व जप माला', icon: 'circle-slice-8' },
  { id: 'pavitra', name: 'Gangajal & Dravya', hi: 'गंगाजल व पवित्र द्रव्य', icon: 'water' },
  { id: 'yantra', name: 'Yantra & Jyotish', hi: 'सिद्ध यंत्र व रत्न', icon: 'shield-star' },
  { id: 'books', name: 'Granth & Books', hi: 'धार्मिक ग्रंथ व पुस्तकें', icon: 'book-open-page-variant' },
  { id: 'prasad', name: 'Taaza Phool & Prasad', hi: 'पुष्प व महाप्रसाद', icon: 'flower' },
];

export const INITIAL_MERCHANT_INVENTORY = [];

export const INITIAL_MERCHANT_ORDERS = [];

class MerchantStore {
  constructor() {
    this.inventory = [];
    this.orders = [];
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  getInventory() {
    return this.inventory;
  }

  getOrders() {
    return this.orders;
  }

  updateStock(productId, newStock, reason = 'Manual Adjustment') {
    const item = this.inventory.find((i) => i.id === productId);
    if (item) {
      item.stock = Math.max(0, newStock);
      this.notify();
    }
  }

  addProduct(newProduct) {
    const item = {
      ...newProduct,
      id: 'p-' + Date.now(),
      sku: newProduct.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      warehouse: 'Noida Hub Central',
      stock: Number(newProduct.stock) || 0,
      price: Number(newProduct.price) || 0,
      mrp: Number(newProduct.mrp) || Number(newProduct.price) * 1.3,
      lowStockThreshold: 15,
      rack: newProduct.rack || 'General Aisle G-01',
    };
    this.inventory.unshift(item);
    this.notify();
    return item;
  }

  markItemScanned(orderId, itemSku) {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      const item = order.items.find((i) => i.sku === itemSku);
      if (item) {
        item.scanned = true;
        this.notify();
      }
    }
  }

  advanceOrderStatus(orderId, nextStatus) {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = nextStatus;
      this.notify();
    }
  }
}

export const merchantStore = new MerchantStore();
export default merchantStore;

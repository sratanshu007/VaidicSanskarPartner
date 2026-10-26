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

export const INITIAL_MERCHANT_INVENTORY = [
  {
    id: 'k1',
    name: 'Satyanarayan Pooja Complete Kit',
    nameHi: 'श्री सत्यनारायण कथा सम्पूर्ण पूजा किट',
    category: 'kits',
    sku: 'KIT-SN-STD',
    price: 1199,
    mrp: 1599,
    stock: 45,
    lowStockThreshold: 15,
    rack: 'Aisle 2, Rack B-04',
    warehouse: 'Noida Hub Central',
    isKit: true,
    poojaType: 'Satyanarayan Katha',
    weight: '1.2 kg',
    hsn: '33074100',
    gstPercent: 12,
    isFragile: false,
    isLiquid: true,
  },
  {
    id: 'k2',
    name: 'Maha Rudrabhishek Samagri Kit',
    nameHi: 'महाकाल रुद्राभिषेक सम्पूर्ण अभिषेक किट',
    category: 'kits',
    sku: 'KIT-RB-STD',
    price: 1399,
    mrp: 1799,
    stock: 12, // Low stock alert!
    lowStockThreshold: 15,
    rack: 'Aisle 2, Rack B-07',
    warehouse: 'Noida Hub Central',
    isKit: true,
    poojaType: 'Rudrabhishek Pooja',
    weight: '1.8 kg',
    hsn: '33074100',
    gstPercent: 12,
    isFragile: true,
    isLiquid: true,
  },
  {
    id: 'h1',
    name: 'Vedic Havan Samagri (1 Kg Pack)',
    nameHi: 'वैदिक नवग्रह हवन सामग्री (1 किग्रा)',
    category: 'havan',
    sku: 'HVN-1KG',
    price: 449,
    mrp: 599,
    stock: 120,
    lowStockThreshold: 20,
    rack: 'Aisle 1, Rack A-12',
    warehouse: 'Noida Hub Central',
    weight: '1.0 kg',
    hsn: '33074100',
    gstPercent: 5,
    isFragile: false,
    isLiquid: false,
  },
  {
    id: 'h2',
    name: 'Desi Gir Cow A2 Vedic Bilona Ghee (1 Ltr)',
    nameHi: 'शुद्ध देशी गिर गाय A2 वैदिक बिलोना घी (1 ली)',
    category: 'havan',
    sku: 'GHEE-1000',
    price: 1699,
    mrp: 2100,
    stock: 8, // Low stock alert!
    lowStockThreshold: 10,
    rack: 'Aisle 4, Cold/Dark Rack C-01',
    warehouse: 'Noida Hub Central',
    weight: '1.5 kg',
    hsn: '04059020',
    gstPercent: 12,
    isFragile: true,
    isLiquid: true,
  },
  {
    id: 'b1',
    name: 'Pure Brass Pooja Thali Set (10 Inch)',
    nameHi: 'हस्तनिर्मित शुद्ध पीतल पूजा थाली सेट (8 वस्तुएं)',
    category: 'bartan',
    sku: 'THL-10BRS',
    price: 1249,
    mrp: 1699,
    stock: 28,
    lowStockThreshold: 10,
    rack: 'Aisle 3, Rack D-02',
    warehouse: 'Noida Hub Central',
    weight: '1.4 kg',
    hsn: '74181022',
    gstPercent: 18,
    isFragile: false,
    isLiquid: false,
  },
  {
    id: 'm1',
    name: 'Original 5 Mukhi Indonesian Rudraksha Mala',
    nameHi: 'प्रामाणिक 5 मुखी रुद्राक्ष जप माला',
    category: 'mala',
    sku: 'RUD-8MM',
    price: 599,
    mrp: 999,
    stock: 85,
    lowStockThreshold: 15,
    rack: 'Locker Safe L-05',
    warehouse: 'Noida Hub Central',
    weight: '0.2 kg',
    hsn: '71179090',
    gstPercent: 3,
    isFragile: false,
    isLiquid: false,
  },
];

export const INITIAL_MERCHANT_ORDERS = [
  {
    id: 'OD-78210',
    orderNumber: '#PB1234',
    customerName: 'Devotee Customer',
    customerPhone: '+91 ••••• •••••',
    address: 'Sector 120, Noida, UP - 201301',
    status: 'TO_PACK', // NEW, TO_PACK, PACKED, SHIPPED, DELIVERED, RETURN_REQUESTED
    placedAt: '10 Oct 2026, 10:30 AM',
    expectedDelivery: '13 Oct 2026',
    courier: 'Delhivery Surface',
    awb: 'DLHV9821498124',
    packagingNotes: 'Bubble wrap bottle + Sealed pouch for Ganga Jal & Kumkum + Fragile Sticker',
    items: [
      {
        name: 'Satyanarayan Pooja Complete Kit (Standard)',
        sku: 'KIT-SN-STD',
        rack: 'Aisle 2, Rack B-04',
        qty: 1,
        price: 1199,
        scanned: true,
      },
      {
        name: 'Vedic Havan Samagri (500g)',
        sku: 'HVN-500G',
        rack: 'Aisle 1, Rack A-12',
        qty: 1,
        price: 249,
        scanned: false,
      },
    ],
    verifiedWeight: '1.45 kg',
    total: 1304,
    paymentMethod: 'Prepaid (UPI)',
    gstInvoiceUrl: 'https://vaidicsanskar.in/invoice/PB1234.pdf',
  },
  {
    id: 'OD-78211',
    orderNumber: '#PB1235',
    customerName: 'Amit Trivedi',
    customerPhone: '+91 98111 22334',
    address: 'B-14, Sector 62, Noida, UP - 201309',
    status: 'NEW',
    placedAt: '10 Oct 2026, 11:15 AM',
    expectedDelivery: '14 Oct 2026',
    courier: 'Shiprocket / BlueDart',
    awb: 'BLDT4489210982',
    packagingNotes: 'Standard Cardboard Box + Thank You Card',
    items: [
      {
        name: 'Pure Brass Pooja Thali Set (10 Inch)',
        sku: 'THL-10BRS',
        rack: 'Aisle 3, Rack D-02',
        qty: 1,
        price: 1249,
        scanned: false,
      },
    ],
    verifiedWeight: '1.40 kg',
    total: 1249,
    paymentMethod: 'Prepaid (Card)',
  },
  {
    id: 'OD-78209',
    orderNumber: '#PB1230',
    customerName: 'Meenakshi Iyer',
    customerPhone: '+91 97234 56789',
    address: 'Flat 901, Cleo County, Sector 121, Noida, UP - 201301',
    status: 'SHIPPED',
    placedAt: '09 Oct 2026, 04:20 PM',
    expectedDelivery: '12 Oct 2026',
    courier: 'Delhivery Express',
    awb: 'DLHV8839210912',
    items: [
      {
        name: 'Original 5 Mukhi Indonesian Rudraksha Mala',
        sku: 'RUD-8MM',
        rack: 'Locker Safe L-05',
        qty: 2,
        price: 599,
        scanned: true,
      },
    ],
    verifiedWeight: '0.45 kg',
    total: 1198,
    paymentMethod: 'Prepaid (UPI)',
  },
];

class MerchantStore {
  constructor() {
    this.inventory = [...INITIAL_MERCHANT_INVENTORY];
    this.orders = [...INITIAL_MERCHANT_ORDERS];
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

const path = require("path");
const { readJson, writeJson, nextId } = require("./dataStore");

const ORDERS_PATH = path.join(__dirname, "data", "orders.json");

function getAllOrders() {
  return readJson(ORDERS_PATH, []);
}

function saveAllOrders(orders) {
  writeJson(ORDERS_PATH, orders);
}

function createOrder(customerName) {
  const trimmed = String(customerName ?? "").trim();
  if (!trimmed) throw new Error("Customer name is required.");

  const orders = getAllOrders();
  const newOrder = {
    id: nextId(orders),
    customerName: trimmed,
    orderItems: [], // array
  };

  orders.push(newOrder);
  saveAllOrders(orders);
  return newOrder;
}

/**
 * Adds an item to an order.
 * Stores order item as: { itemId, name, price, qty, lineTotal }
 * Returns true if order exists and operation succeeds, otherwise false.
 */
function addItemToOrder(orderId, item, qty) {
  const qtyNum = Number(qty);
  if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
    throw new Error("Quantity must be a number greater than 0.");
  }

  const orders = getAllOrders();
  const order = orders.find((o) => Number(o.id) === Number(orderId));
  if (!order) return false;

  const itemId = Number(item.id);
  const price = Number(item.price);
  const existing = order.orderItems.find((x) => Number(x.itemId) === itemId);

  if (existing) {
    existing.qty += qtyNum;
    existing.lineTotal = Number((existing.price * existing.qty).toFixed(2));
  } else {
    order.orderItems.push({
      itemId,
      name: String(item.name),
      price,
      qty: qtyNum,
      lineTotal: Number((price * qtyNum).toFixed(2)),
    });
  }

  saveAllOrders(orders);
  return true;
}

function getOrderById(orderId) {
  const orders = getAllOrders();
  return orders.find((o) => Number(o.id) === Number(orderId));
}

function getOrderTotal(order) {
  if (!order?.orderItems?.length) return 0;
  return order.orderItems.reduce((sum, x) => sum + Number(x.lineTotal || 0), 0);
}

function printInvoice(order) {
  if (!order) {
    console.log("Order not found.");
    return;
  }
  console.log("\n================= INVOICE =================");
  console.log(`Order ID: ${order.id}`);
  console.log(`Customer: ${order.customerName}`);
  console.log("-------------------------------------------");
  if (!order.orderItems.length) {
    console.log("(No items in this order)");
  } else {
    for (const x of order.orderItems) {
      console.log(`${x.name} | ${x.price} x ${x.qty} = ${x.lineTotal}`);
    }
  }
  console.log("-------------------------------------------");
  console.log(`TOTAL: ${Number(getOrderTotal(order).toFixed(2))}`);
  console.log("===========================================\n");
}

/**
 * Undo helper (not in the original requirements):
 * Reverts the last "add" action by decrementing qty for the given itemId.
 * Returns true if successfully undone, false if order or item line doesn't exist.
 */
function undoAddItem(orderId, itemId, qty) {
  const qtyNum = Number(qty);
  if (!Number.isFinite(qtyNum) || qtyNum <= 0) return false;

  const orders = getAllOrders();
  const order = orders.find((o) => Number(o.id) === Number(orderId));
  if (!order) return false;

  const line = order.orderItems.find((x) => Number(x.itemId) === Number(itemId));
  if (!line) return false;

  line.qty -= qtyNum;
  if (line.qty <= 0) {
    order.orderItems = order.orderItems.filter((x) => Number(x.itemId) !== Number(itemId));
  } else {
    line.lineTotal = Number((line.price * line.qty).toFixed(2));
  }

  saveAllOrders(orders);
  return true;
}

module.exports = {
  getAllOrders,
  createOrder,
  addItemToOrder,
  getOrderById,
  getOrderTotal,
  printInvoice,
  undoAddItem, // extra
};

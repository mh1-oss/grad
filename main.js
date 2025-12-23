
const readline = require("readline");
const { listCategories, addCategory, findCategoryById } = require("./categories");
const { listItems, addItem, listItemsByCategory, findItemById } = require("./items");
const { createOrder, addItemToOrder, getOrderById, printInvoice, undoAddItem } = require("./orders");

const rl = readline.createInterface({ 
  input: process.stdin,
  output: process.stdout });

function ask(q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));
}

function toInt(x) {
  const n = Number(String(x).trim());
  return Number.isFinite(n) ? n : NaN;
}

// In-session undo stack per order: { [orderId]: [{type:'add', itemId, qty}] }
const undoStack = new Map();
let activeOrderId = null;

function pushUndo(orderId, action) {
  const key = Number(orderId);
  const stack = undoStack.get(key) ?? [];
  stack.push(action);
  undoStack.set(key, stack);
}

function popUndo(orderId) {
  const key = Number(orderId);
  const stack = undoStack.get(key) ?? [];
  const last = stack.pop();
  undoStack.set(key, stack);
  return last;
}

async function categoriesMenu() {
  while (true) {
    console.log("\n--- Categories Menu ---");
    console.log("1) List categories");
    console.log("2) Add category");
    console.log("3) Find category by ID");
    console.log("0) Back");
    const choice = (await ask("Choose: ")).trim();

    if (choice === "0") return;

    if (choice === "1") {
      listCategories();
    } else if (choice === "2") {
      const name = await ask("Enter category name: ");
      try {
        const c = addCategory(name);
        console.log(`Added category: #${c.id} - ${c.name}`);
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    } else if (choice === "3") {
      const id = await ask("Enter category ID: ");
      const c = findCategoryById(id);
      if (!c) console.log("Category not found.");
      else console.log(`Found: #${c.id} - ${c.name}`);
    } else {
      console.log("Invalid option.");
    }
  }
}

async function itemsMenu() {
  while (true) {
    console.log("\n--- Items Menu ---");
    console.log("1) List items");
    console.log("2) Add item");
    console.log("3) List items by category");
    console.log("4) Find item by ID");
    console.log("0) Back");
    const choice = (await ask("Choose: ")).trim();

    if (choice === "0") return;

    if (choice === "1") {
      listItems();
    } else if (choice === "2") {
      const name = await ask("Enter item name: ");
      const price = await ask("Enter price (> 0): ");
      const catId = await ask("Enter category ID: ");
      try {
        const it = addItem(name, price, catId);
        console.log(`Added item: #${it.id} - ${it.name} (Price: ${it.price}) in Category #${it.categoryId}`);
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    } else if (choice === "3") {
      const catId = await ask("Enter category ID: ");
      listItemsByCategory(catId);
    } else if (choice === "4") {
      const id = await ask("Enter item ID: ");
      const it = findItemById(id);
      if (!it) console.log("Item not found.");
      else console.log(`Found: #${it.id} - ${it.name} (Price: ${it.price}) [CategoryId: ${it.categoryId}]`);
    } else {
      console.log("Invalid option.");
    }
  }
}

async function ordersMenu() {
  while (true) {
    console.log("\n--- Orders Menu ---");
    console.log("1) Create new order");
    console.log("2) Add item to an order (with Undo)");
    console.log("3) View order by ID");
    console.log("4) Print invoice");
    console.log("5) Undo last selection (active order)");
    console.log("0) Back");
    const choice = (await ask("Choose: ")).trim();

    if (choice === "0") return;

    if (choice === "1") {
      const customer = await ask("Customer name: ");
      try {
        const order = createOrder(customer);
        activeOrderId = Number(order.id);
        console.log(`Created order #${order.id} for ${order.customerName}. (Active order set)`);
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    } else if (choice === "2") {
      const orderIdRaw = await ask(`Order ID (press Enter for active order ${activeOrderId ?? "N/A"}): `);
      const orderId = orderIdRaw.trim() ? toInt(orderIdRaw) : activeOrderId;
      if (!Number.isFinite(orderId)) {
        console.log("Please provide a valid order ID.");
        continue;
      }
      const order = getOrderById(orderId);
      if (!order) {
        console.log("Order not found.");
        continue;
      }
      activeOrderId = Number(orderId);

      console.log("\nSelect a category first (or type 0 to cancel).");
      listCategories();
      const catId = await ask("Category ID: ");
      if (catId.trim() === "0") continue;
      listItemsByCategory(catId);

      const itemId = await ask("Item ID: ");
      const item = findItemById(itemId);
      if (!item) {
        console.log("Item not found.");
        continue;
      }
      const qty = await ask("Quantity (> 0): ");

      try {
        const ok = addItemToOrder(orderId, item, qty);
        if (!ok) {
          console.log("Failed: Order not found.");
          continue;
        }
        pushUndo(orderId, { type: "add", itemId: Number(item.id), qty: Number(qty) });

        const undoNow = (await ask("Added. Type 'undo' to undo this addition, or press Enter to continue: ")).trim().toLowerCase();
        if (undoNow === "undo" || undoNow === "u") {
          const last = popUndo(orderId);
          if (last && last.type === "add") {
            const undone = undoAddItem(orderId, last.itemId, last.qty);
            console.log(undone ? "Undone successfully." : "Nothing to undo.");
          } else {
            console.log("Nothing to undo.");
          }
        }
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    } else if (choice === "3") {
      const orderId = await ask("Enter order ID: ");
      const order = getOrderById(orderId);
      if (!order) console.log("Order not found.");
      else console.log(JSON.stringify(order, null, 2));
    } else if (choice === "4") {
      const orderIdRaw = await ask(`Order ID (press Enter for active order ${activeOrderId ?? "N/A"}): `);
      const orderId = orderIdRaw.trim() ? toInt(orderIdRaw) : activeOrderId;
      const order = Number.isFinite(orderId) ? getOrderById(orderId) : undefined;
      printInvoice(order);
    } else if (choice === "5") {
      if (!Number.isFinite(activeOrderId)) {
        console.log("No active order. Create/select an order first.");
        continue;
      }
      const last = popUndo(activeOrderId);
      if (!last) {
        console.log("Nothing to undo.");
        continue;
      }
      if (last.type === "add") {
        const undone = undoAddItem(activeOrderId, last.itemId, last.qty);
        console.log(undone ? "Undone successfully." : "Nothing to undo.");
      } else {
        console.log("Nothing to undo.");
      }
    } else {
      console.log("Invalid option.");
    }
  }
}

async function main() {
  console.log("Simple Restaurant Menu & Orders");
  console.log("================================");
  console.log("All prompts/messages are in English (per your request).");
  console.log("Tip: In Orders, you can undo your last selection.\n");

  while (true) {
    console.log("\n=== Main Menu ===");
    console.log("1) Categories");
    console.log("2) Items");
    console.log("3) Orders");
    console.log("0) Exit");
    const choice = (await ask("Choose: ")).trim();

    if (choice === "0") break;
    if (choice === "1") await categoriesMenu();
    else if (choice === "2") await itemsMenu();
    else if (choice === "3") await ordersMenu();
    else console.log("Invalid option.");
  }

  rl.close();
  console.log("Goodbye!");
}

main();

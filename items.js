const path = require("path");
const { readJson, writeJson, nextId } = require("./dataStore");
const { findCategoryById } = require("./categories");

const ITEMS_PATH = path.join(__dirname, "data", "items.json");

function getAllItems() {
  return readJson(ITEMS_PATH, []);
}

function addItem(name, price, categoryId) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new Error("Item name is required.");

  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    throw new Error("Price must be a number greater than 0.");
  }

  const cat = findCategoryById(categoryId);
  if (!cat) throw new Error("Category not found. Please add the category first.");

  const items = getAllItems();
  const newItem = {
    id: nextId(items),
    name: trimmed,
    price: priceNum,
    categoryId: Number(cat.id),
  };

  items.push(newItem);
  writeJson(ITEMS_PATH, items);
  return newItem;
}

function listItems() {
  const items = getAllItems();
  if (!items.length) {
    console.log("No items found.");
    return;
  }
  console.log("\n=== Items ===");
  for (const it of items) {
    console.log(`#${it.id} - ${it.name} (Price: ${it.price}) [CategoryId: ${it.categoryId}]`);
  }
}

function listItemsByCategory(categoryId) {
  const items = getAllItems().filter((it) => Number(it.categoryId) === Number(categoryId));
  if (!items.length) {
    console.log("No items found for this category.");
    return;
  }
  console.log(`\n=== Items in Category #${Number(categoryId)} ===`);
  for (const it of items) {
    console.log(`#${it.id} - ${it.name} (Price: ${it.price})`);
  }
}

function findItemById(id) {
  const items = getAllItems();
  const idNum = Number(id);
  return items.find((x) => Number(x.id) === idNum);
}

module.exports = {
  getAllItems,
  addItem,
  listItems,
  listItemsByCategory,
  findItemById,
};

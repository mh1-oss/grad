const path = require("path");
const { readJson, writeJson, nextId } = require("./dataStore");

const CATEGORIES_PATH = path.join(__dirname, "data", "categories.json");

function getAllCategories() {
  return readJson(CATEGORIES_PATH, []);
}

function addCategory(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new Error("Category name is required.");

  const categories = getAllCategories();
  const newCategory = { id: nextId(categories), name: trimmed };
  categories.push(newCategory);
  writeJson(CATEGORIES_PATH, categories);
  return newCategory;
}

function listCategories() {
  const categories = getAllCategories();
  if (!categories.length) {
    console.log("No categories found.");
    return;
  }
  console.log("\n=== Categories ===");
  for (const c of categories) {
    console.log(`#${c.id} - ${c.name}`);
  }
}

function findCategoryById(id) {
  const categories = getAllCategories();
  const idNum = Number(id);
  return categories.find((c) => Number(c.id) === idNum);
}

module.exports = {
  getAllCategories,
  addCategory,
  listCategories,
  findCategoryById,
};

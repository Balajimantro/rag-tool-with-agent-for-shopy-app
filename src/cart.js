import fs from "fs";
import ExcelJS from "exceljs";
import { config } from "./config.js";

const FILE = config.paths.cart;
const SHEET = "Cart";

// Simple queue so two requests never write the file at the same time
let queue = Promise.resolve();
const serial = (fn) => (queue = queue.then(fn, fn));

async function loadWorkbook() {
  const wb = new ExcelJS.Workbook();
  if (fs.existsSync(FILE)) {
    await wb.xlsx.readFile(FILE);
  }
  let ws = wb.getWorksheet(SHEET);
  if (!ws) {
    ws = wb.addWorksheet(SHEET);
    ws.columns = [
      { header: "Product", key: "product", width: 32 },
      { header: "Qty", key: "qty", width: 8 },
      { header: "Price", key: "price", width: 12 },
      { header: "AddedAt", key: "addedAt", width: 24 },
    ];
  }
  return { wb, ws };
}

function readRows(ws) {
  const items = [];
  ws.eachRow((row, n) => {
    if (n === 1) return; // header
    items.push({
      product: row.getCell(1).value,
      qty: Number(row.getCell(2).value) || 0,
      price: Number(row.getCell(3).value) || 0,
      addedAt: row.getCell(4).value,
    });
  });
  return items;
}

export function getCart() {
  return serial(async () => {
    const { ws } = await loadWorkbook();
    const items = readRows(ws);
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    return { items, total, count: items.length };
  });
}

export function addToCart({ product, qty = 1, price = 0 }) {
  return serial(async () => {
    const { wb, ws } = await loadWorkbook();
    let found = false;
    ws.eachRow((row, n) => {
      if (n === 1) return;
      if (String(row.getCell(1).value).toLowerCase() === product.toLowerCase()) {
        row.getCell(2).value = (Number(row.getCell(2).value) || 0) + qty;
        found = true;
      }
    });
    if (!found) ws.addRow({ product, qty, price, addedAt: new Date().toISOString() });
    await wb.xlsx.writeFile(FILE);
    const items = readRows(ws);
    return { status: "added", product, qty, cart_items: items.length };
  });
}

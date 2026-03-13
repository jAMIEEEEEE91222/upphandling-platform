import * as xlsx from "xlsx";
import * as fs from "fs";
import * as path from "path";

const data = [
  { "Artikelnummer": "1001", "Benämning": "A4-papper", "Enhet": "förp", "Pris exkl moms": 45 },
  { "Artikelnummer": "1002", "Benämning": "Pennor blå", "Enhet": "st", "Pris exkl moms": 12 },
  { "Artikelnummer": "1003", "Benämning": "Gem", "Enhet": "ask", "Pris exkl moms": 5 },
  { "Artikelnummer": "1004", "Benämning": "Häftmaskin", "Enhet": "st", "Pris exkl moms": 85 },
  { "Artikelnummer": "1005", "Benämning": "Hålslag", "Enhet": "st", "Pris exkl moms": 0 },
  { "Artikelnummer": "1006", "Benämning": "Tejp", "Enhet": "rulle", "Pris exkl moms": 15 },
  { "Artikelnummer": "1007", "Benämning": "Post-it", "Enhet": "block", "Pris exkl moms": "" },
  { "Artikelnummer": "1008", "Benämning": "Whiteboardpennor", "Enhet": "förp", "Pris exkl moms": 120 },
  { "Artikelnummer": "1009", "Benämning": "Suddgummi", "Enhet": "st", "Pris exkl moms": 8 },
  { "Artikelnummer": "1010", "Benämning": "Block A4", "Enhet": "st", "Pris exkl moms": 25 },
  { "Artikelnummer": "1011", "Benämning": "Sax", "Enhet": "st", "Pris exkl moms": 45 },
  { "Artikelnummer": "1012", "Benämning": "Lim", "Enhet": "st", "Pris exkl moms": 22 },
  { "Artikelnummer": "1013", "Benämning": "Pärm", "Enhet": "st", "Pris exkl moms": 35 },
  { "Artikelnummer": "1014", "Benämning": "Register", "Enhet": "st", "Pris exkl moms": 15 },
  { "Artikelnummer": "1015", "Benämning": "Plastfickor", "Enhet": "förp", "Pris exkl moms": 65 },
];

const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Prisbilaga");

const dir = path.join(process.cwd(), "prisma", "test-data");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
const filePath = path.join(dir, "exempel-prisbilaga.xlsx");
xlsx.writeFile(wb, filePath);
console.log("Skapade testfil:", filePath);

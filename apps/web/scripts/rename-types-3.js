const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../src");

const replacements = [
  // Notification schema changes
  { from: /\borderId(?=:)/g, to: "referenceId" },
  { from: /\btaskId(?=:)/g, to: "referenceId" },
  { from: /NEW_TASK/g, to: "NEW_ORDER" },
  
  // Relations
  { from: /\bresponses\b/g, to: "proposals" },
  { from: /\bmasterCategory\b/g, to: "providerCategory" },

  // Unfinished file renames or bad import matches
  { from: /verify-master/g, to: "verify-provider" }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else {
      if (
        fullPath.endsWith(".ts") ||
        fullPath.endsWith(".tsx") ||
        fullPath.endsWith(".json")
      ) {
        let content = fs.readFileSync(fullPath, "utf8");
        let initial = content;

        for (const { from, to } of replacements) {
          content = content.replace(from, to);
        }

        if (content !== initial) {
          fs.writeFileSync(fullPath, content, "utf8");
          console.log("Updated III: " + fullPath);
        }
      }
    }
  }
}

processDirectory(ROOT);
console.log("Global refactor stage 3 complete.");

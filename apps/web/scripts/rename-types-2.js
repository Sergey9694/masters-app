const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../src");

const replacements = [
  // Prisma attributes and JSON attributes (camelCase versions)
  { from: /\btaskRequest\b/g, to: "order" },
  { from: /\bmasterProfile\b/g, to: "providerProfile" },
  { from: /\btaskResponse\b/g, to: "proposal" },
  { from: /\bmasterCategory\b/g, to: "providerCategory" },

  // Fixing imports and new file names
  { from: /load-tasks/g, to: "load-orders" },
  { from: /create-task-action/g, to: "create-order-action" },
  { from: /get-all-tasks/g, to: "get-all-orders" },
  { from: /get-pending-masters/g, to: "get-pending-providers" },
  { from: /moderate-task/g, to: "moderate-order" },
  { from: /admin-task-filters/g, to: "admin-order-filters" },
  { from: /master-moderation-actions/g, to: "provider-moderation-actions" },
  { from: /task-moderation-actions/g, to: "order-moderation-actions" },
  { from: /TaskImageGallery/g, to: "OrderImageGallery" },
  { from: /TaskStatusButtons/g, to: "OrderStatusButtons" },
  { from: /MasterRegistrationForm/g, to: "ProviderRegistrationForm" },

  // Any remaining capitalization
  { from: /\bMasterCategory\b/g, to: "ProviderCategory" },
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
          console.log("Updated II: " + fullPath);
        }
      }
    }
  }
}

processDirectory(ROOT);
console.log("Global refactor stage 2 complete.");

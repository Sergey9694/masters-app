const fs = require("fs");
const path = require("path");

const filesToFix = [
  "apps/web/src/features/proposal/api/actions.ts",
  "apps/web/src/features/proposal/ui/OrderStatusButtons.tsx",
  "apps/web/src/features/proposal/ui/RespondForm.tsx",
  "apps/web/src/features/review/api/actions.ts",
];

const ROOTDir = path.join(__dirname, "../../../");

filesToFix.forEach(relPath => {
  const fullPath = path.join(ROOTDir, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, "utf8");
    
    // Specifically for React props destructured or referenced:
    content = content.replace(/\{ orderId \}: Props/g, "{ referenceId }: Props");
    content = content.replace(/orderId,/g, "referenceId,");
    content = content.replace(/\{ orderId,/g, "{ referenceId,");
    content = content.replace(/vals\.orderId/g, "vals.referenceId");
    content = content.replace(/data\.orderId/g, "data.referenceId");
    content = content.replace(/orderId:/g, "referenceId:");
    content = content.replace(/orderId\b/g, "referenceId");

    fs.writeFileSync(fullPath, content, "utf8");
    console.log("Fixed: " + fullPath);
  }
});

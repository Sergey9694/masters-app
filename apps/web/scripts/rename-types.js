const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../src");

const replacements = [
  // Database Types
  { from: /\bMasterProfile\b/g, to: "ProviderProfile" },
  { from: /\bMasterCategory\b/g, to: "ProviderCategory" },
  { from: /\bTaskRequest\b/g, to: "Order" },
  { from: /\bTaskResponse\b/g, to: "Proposal" },
  { from: /\bTaskStatus\b/g, to: "OrderStatus" },
  { from: /\bUser\.masterProfile\b/g, to: "User.providerProfile" },

  // Enums
  { from: /\bRole\.MASTER\b/g, to: "Role.PROVIDER" },
  { from: /\bMASTER\b/g, to: "PROVIDER" }, // Care with uppercase

  // Variables & Props
  { from: /\btaskId\b/g, to: "orderId" },
  { from: /\btask\.customerId\b/g, to: "order.clientId" },
  { from: /\btask\b/g, to: "order" },
  { from: /\btasks\b/g, to: "orders" },
  { from: /\bTask\b/g, to: "Order" },
  { from: /\bTasks\b/g, to: "Orders" },

  { from: /\bassignedMasterId\b/g, to: "assignedProviderId" },
  { from: /\bassignedMaster\b/g, to: "assignedProvider" },

  { from: /\bmasterId\b/g, to: "providerId" },
  { from: /\bcustomerId\b/g, to: "clientId" },
  { from: /\bcustomer\b/g, to: "client" },

  { from: /\bmaster\b/g, to: "provider" },
  { from: /\bmasters\b/g, to: "providers" },
  { from: /\bMaster\b/g, to: "Provider" },
  { from: /\bMasters\b/g, to: "Providers" },

  { from: /\bTaskCardData\b/g, to: "OrderCardData" },
  { from: /\bMasterStats\b/g, to: "ProviderStats" },

  // Paths
  { from: /\/masters\//g, to: "/provider/" },
  { from: /\/task\//g, to: "/order/" },
  { from: /create-task/g, to: "create-order" },
  { from: /my-tasks/g, to: "my-orders" },
  { from: /my-responses/g, to: "my-proposals" },
  { from: /master-applications/g, to: "provider-applications" },

  // Import patches (folders we renamed)
  { from: /entities\/task/g, to: "entities/order" },
  { from: /TaskCard/g, to: "OrderCard" },
  { from: /TaskListItem/g, to: "OrderListItem" },
  { from: /TaskFeed/g, to: "OrderFeed" },
  { from: /task-creation/g, to: "order-creation" },
  { from: /task-response/g, to: "proposal" },
  { from: /task-view/g, to: "order-view" },
  { from: /master-registration/g, to: "provider-registration" },
  
  // Custom functions
  { from: /saveMasterProfileAction/g, to: "saveProviderProfileAction" },
  { from: /respondToTaskAction/g, to: "submitProposalAction" },
  { from: /acceptResponseAction/g, to: "acceptProposalAction" },
  { from: /completeTaskAction/g, to: "completeOrderAction" },
  { from: /cancelTaskAction/g, to: "cancelOrderAction" },
  { from: /loadTasksAction/g, to: "loadOrdersAction" },
  { from: /notifyMastersInCategories/g, to: "notifyProvidersInCategories" }
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
          console.log("Updated: " + fullPath);
        }
      }
    }
  }
}

processDirectory(ROOT);
console.log("Global refactor complete.");

import fs from 'fs';
import path from 'path';

const filePath = path.resolve('frontend/src/pages/admin/AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. In Edit Service Modal: replace from '{/* Base Prices */}' down to before '{/* Dynamic Inclusions & Exclusions (Managed from Admin Panel) */}'
const editModalStartMarker = '{/* Base Prices */}';
const editModalEndMarker = '{/* Dynamic Inclusions & Exclusions (Managed from Admin Panel) */}';

const editStartIndex = content.indexOf(editModalStartMarker);
const editEndIndex = content.indexOf(editModalEndMarker, editStartIndex);

if (editStartIndex === -1 || editEndIndex === -1) {
  console.error('Could not find markers for Edit Service Modal!');
  process.exit(1);
}

const replacementEdit = `{/* Step 1 Service Type, Dynamic Unit Pricing & City Availability */}
              {renderServicePricingConfig(true)}

              `;

content = content.slice(0, editStartIndex) + replacementEdit + content.slice(editEndIndex);
console.log('Successfully replaced pricing section in Edit Service Modal');

// 2. In Create Service Modal: replace from '{/* Base Prices */}' down to before '{/* Dynamic Inclusions & Exclusions (Managed from Admin Panel) */}'
const createStartIndex = content.indexOf(editModalStartMarker, editStartIndex + replacementEdit.length);
const createEndIndex = content.indexOf(editModalEndMarker, createStartIndex);

if (createStartIndex === -1 || createEndIndex === -1) {
  console.error('Could not find markers for Create Service Modal!');
  process.exit(1);
}

const replacementCreate = `{/* Step 1 Service Type, Dynamic Unit Pricing & City Availability */}
              {renderServicePricingConfig(false)}

              `;

content = content.slice(0, createStartIndex) + replacementCreate + content.slice(createEndIndex);
console.log('Successfully replaced pricing section in Create Service Modal');

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminDashboard.jsx updated successfully.');

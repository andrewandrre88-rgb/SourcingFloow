import fs from 'fs';
let data = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

data.entities.Customer = {
  collection: "users/{userId}/customers",
  path: "/users/{userId}/customers/{customerId}",
  description: "Customer database for saving clients and potential customers",
  fields: {
    id: { type: "string", required: true },
    name: { type: "string", required: true },
    contactEmail: { type: "string", required: false },
    contactPhone: { type: "string", required: false },
    whatsapp: { type: "string", required: false },
    wechatId: { type: "string", required: false },
    country: { type: "string", required: false },
    type: { type: "string", required: true },
    notes: { type: "string", required: false },
    createdAt: { type: "string", required: true },
    updatedAt: { type: "string", required: true }
  }
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(data, null, 2));

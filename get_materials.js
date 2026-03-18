const fs = require('fs');
const fileBuffer = fs.readFileSync('public/assets/models/dress.glb');
const chunk0Length = fileBuffer.readUInt32LE(12);
const jsonString = fileBuffer.toString('utf8', 20, 20 + chunk0Length);
const gltf = JSON.parse(jsonString);

console.log("MATERIALS:");
(gltf.materials || []).forEach((m, i) => {
  const color = m.pbrMetallicRoughness?.baseColorFactor || 'no color';
  const texture = m.pbrMetallicRoughness?.baseColorTexture !== undefined ? 'has texture' : 'no texture';
  console.log(`  [${i}] name: ${m.name || 'unnamed'}, color: ${color}, texture: ${texture}`);
});

console.log("\nMESHES:");
(gltf.meshes || []).forEach((m, i) => {
  console.log(`  [${i}] name: ${m.name || 'unnamed'}`);
  (m.primitives || []).forEach((p, j) => {
    console.log(`    primitive ${j}: material index ${p.material}`);
  });
});

const fs = require('fs');

try {
  const fileBuffer = fs.readFileSync('public/assets/models/dress.glb');
  const magic = fileBuffer.readUInt32LE(0);
  const chunk0Length = fileBuffer.readUInt32LE(12);
  const chunk0Type = fileBuffer.readUInt32LE(16);

  if (magic === 0x46546C67 && chunk0Type === 0x4E4F534A) {
    const jsonString = fileBuffer.toString('utf8', 20, 20 + chunk0Length);
    const gltf = JSON.parse(jsonString);
    
    console.log("NODES:");
    (gltf.nodes || []).forEach((n, i) => {
      console.log(`  ${i}: ${n.name || 'unnamed'}`);
    });
    
    console.log("\nMATERIALS:");
    (gltf.materials || []).forEach((m, i) => {
      console.log(`  ${i}: ${m.name || 'unnamed'}`);
    });

    console.log("\nMESHES:");
    (gltf.meshes || []).forEach((m, i) => {
      console.log(`  ${i}: ${m.name || 'unnamed'}`);
    });
  } else {
    console.log("Not a valid GLB or missing JSON chunk.");
  }
} catch (e) {
  console.error(e);
}

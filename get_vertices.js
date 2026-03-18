const fs = require('fs');
const fileBuffer = fs.readFileSync('public/assets/models/dress.glb');
const chunk0Length = fileBuffer.readUInt32LE(12);
const jsonString = fileBuffer.toString('utf8', 20, 20 + chunk0Length);
const gltf = JSON.parse(jsonString);

console.log("ACCESSORS (Vertex counts):");
const accessors = gltf.accessors || [];
const meshes = gltf.meshes || [];

meshes.forEach((m, i) => {
  console.log(`Mesh [${i}] name: ${m.name}`);
  (m.primitives || []).forEach((p, j) => {
    const posAccessor = accessors[p.attributes.POSITION];
    console.log(`  Primitive ${j} vertex count: ${posAccessor ? posAccessor.count : 'unknown'}`);
  });
});

console.log("\nNODES Mapping meshes:");
(gltf.nodes || []).forEach((n, i) => {
  if (n.mesh !== undefined) {
    console.log(`  Node [${i}] uses Mesh [${n.mesh}]`);
  }
});

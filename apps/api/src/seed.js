import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Dispositivo } from './models/Dispositivo.js';
import { Geocerca } from './models/Geocerca.js';

async function seed() {
  await connectDB(process.env.MONGODB_URI);

  const adminEmail = 'admin@controlaccesos.mx';
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    admin = await User.create({
      nombre: 'Administrador',
      email: adminEmail,
      password: 'Admin123!',
      rol: 'admin',
    });
    console.log('Usuario admin creado:', adminEmail, '/ Admin123!');
  } else {
    console.log('Usuario admin ya existe');
  }

  // Geocerca ejemplo: zona alrededor del Zócalo CDMX
  await Geocerca.findOneAndUpdate(
    { nombre: 'Zona Centro CDMX' },
    {
      nombre: 'Zona Centro CDMX',
      descripcion: 'Geocerca de ejemplo alrededor del Zócalo',
      color: '#2dd4a8',
      tipo: 'polygon',
      activa: true,
      coordenadas: [
        [-99.1365, 19.4355],
        [-99.1305, 19.4355],
        [-99.1305, 19.4305],
        [-99.1365, 19.4305],
      ],
    },
    { upsert: true, new: true }
  );

  await Geocerca.findOneAndUpdate(
    { nombre: 'Oficinas (círculo)' },
    {
      nombre: 'Oficinas (círculo)',
      descripcion: 'Radio de 200 m cerca de Reforma',
      color: '#e6c07b',
      tipo: 'circle',
      activa: true,
      coordenadas: [[-99.1677, 19.426]],
      radioMetros: 200,
    },
    { upsert: true, new: true }
  );
  console.log('Geocercas de ejemplo listas');

  const dispositivos = [
    {
      nombre: 'Teléfono María',
      identificador: 'DEV-001',
      persona: 'María García',
      color: '#2dd4a8',
    },
    {
      nombre: 'Teléfono Carlos',
      identificador: 'DEV-002',
      persona: 'Carlos Hernández',
      color: '#61afef',
    },
    {
      nombre: 'Simulador web',
      identificador: 'SIM-WEB',
      persona: 'Simulador',
      color: '#c678dd',
    },
  ];

  for (const d of dispositivos) {
    await Dispositivo.findOneAndUpdate({ identificador: d.identificador }, d, {
      upsert: true,
      new: true,
    });
  }
  console.log('Dispositivos de ejemplo listos');

  console.log('Seed completado');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

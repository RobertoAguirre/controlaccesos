import mongoose from 'mongoose';

const ubicacionSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: null },
    heading: { type: Number, default: null },
    speed: { type: Number, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const dispositivoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    identificador: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    persona: { type: String, trim: true, default: '' },
    color: { type: String, default: '#2dd4a8' },
    activo: { type: Boolean, default: true },
    enLinea: { type: Boolean, default: false },
    ultimaUbicacion: { type: ubicacionSchema, default: null },
    geocercasActuales: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Geocerca' },
    ],
  },
  { timestamps: true }
);

dispositivoSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Dispositivo = mongoose.model('Dispositivo', dispositivoSchema);

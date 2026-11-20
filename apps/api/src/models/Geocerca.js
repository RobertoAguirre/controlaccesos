import mongoose from 'mongoose';

const geocercaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    color: { type: String, default: '#2dd4a8' },
    tipo: {
      type: String,
      enum: ['polygon', 'circle'],
      default: 'polygon',
    },
    // polygon: [[lng, lat], ...]  | circle: center [lng, lat]
    coordenadas: {
      type: [[Number]],
      required: true,
    },
    radioMetros: { type: Number, default: null },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

geocercaSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Geocerca = mongoose.model('Geocerca', geocercaSchema);

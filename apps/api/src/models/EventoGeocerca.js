import mongoose from 'mongoose';

const eventoGeocercaSchema = new mongoose.Schema(
  {
    dispositivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispositivo',
      required: true,
      index: true,
    },
    geocerca: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Geocerca',
      required: true,
      index: true,
    },
    tipo: {
      type: String,
      enum: ['entrada', 'salida'],
      required: true,
    },
    ubicacion: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    fechaHora: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

eventoGeocercaSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const EventoGeocerca = mongoose.model('EventoGeocerca', eventoGeocercaSchema);

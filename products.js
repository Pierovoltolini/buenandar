// ============================================================
//  BuenAndar.uy — products.js
//  Agregá o editá productos fácilmente en este array.
// ============================================================

const products = [
  {
    id: 1,
    name: "Adidas Adizero EVO SL",
    brand: "Adidas",
    price: 4400,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80"
    ],
    sizes: ["39", "40", "41", "42", "43", "44"],
    description: "La Adizero EVO SL combina tecnología Lightstrike Pro con una suela de carbono para máxima propulsión. Ideal para corredores exigentes que buscan velocidad y ligereza.",
    features: ["Suela de carbono", "Lightstrike Pro", "Peso ultraliviano 185g", "Upper de malla transpirable"],
    stockType: "Stock disponible",
    badge: "Más vendido"
  },
  {
    id: 2,
    name: "Nike Vaporfly 3",
    brand: "Nike",
    price: 5200,
    images: [
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80"
    ],
    sizes: ["40", "41", "42", "43"],
    description: "La zapatilla de competición más premiada de la historia. Con ZoomX y placa de carbono ZoomX Flyplate, te da el retorno de energía que necesitás para superar tus marcas.",
    features: ["Placa de carbono ZoomX Flyplate", "Espuma ZoomX", "Upper Vaporweave", "Drop 8mm"],
    stockType: "Por encargue",
    badge: "Exclusivo"
  },
  {
    id: 3,
    name: "New Balance FuelCell SC Elite v3",
    brand: "New Balance",
    price: 4900,
    images: [
      "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
    ],
    sizes: ["40", "41", "42", "43", "44", "45"],
    description: "Triple placa de carbono y espuma FuelCell para la máxima propulsión. Diseñada para romper récords, la SC Elite v3 es la apuesta más seria de New Balance en competición.",
    features: ["Triple placa de carbono", "FuelCell foam", "Upper de malla", "Peso 198g"],
    stockType: "Stock disponible",
    badge: null
  },
  {
    id: 4,
    name: "Asics MetaSpeed Sky+",
    brand: "oN Cloud",
    price: 5500,
    images: [
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
      "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80",
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80"
    ],
    sizes: ["41", "42", "43", "44"],
    description: "Para corredores de zancada amplia. La MetaSpeed Sky+ incorpora FF Blast Turbo y placa de carbono en un diseño aerodinámico pensado para maratones y competiciones de fondo.",
    features: ["FF Blast Turbo", "Placa de carbono", "Diseño aerodinámico", "Drop 9mm"],
    stockType: "Por encargue",
    badge: "Alta gama"
  },
  
];

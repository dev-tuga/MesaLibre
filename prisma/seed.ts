import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Demo data: a Chilean restaurant with a realistic menu in CLP.
 * The seed is idempotent — it wipes and recreates the demo restaurant,
 * keeping the table QR tokens stable so bookmarked URLs keep working.
 */
const RESTAURANT_SLUG = "la-picada-del-puerto";

const menu: {
  category: string;
  products: { name: string; description: string; priceClp: number }[];
}[] = [
  {
    category: "Para picar",
    products: [
      {
        name: "Empanadas de queso (3 un.)",
        description: "Empanaditas fritas rellenas de queso mantecoso.",
        priceClp: 4500,
      },
      {
        name: "Sopaipillas con pebre",
        description: "Seis sopaipillas caseras con pebre cuchareado.",
        priceClp: 3900,
      },
      {
        name: "Ceviche de reineta",
        description: "Reineta fresca marinada en limón de Pica, cilantro y cebolla morada.",
        priceClp: 8900,
      },
      {
        name: "Chorrillana para dos",
        description: "Papas fritas, carne salteada, cebolla caramelizada y dos huevos fritos.",
        priceClp: 12900,
      },
    ],
  },
  {
    category: "Platos de fondo",
    products: [
      {
        name: "Lomo a lo pobre",
        description: "Lomo de vacuno, papas fritas, cebolla frita y huevos a caballo.",
        priceClp: 14500,
      },
      {
        name: "Cazuela de vacuno",
        description: "Cazuela tradicional con choclo, zapallo y papa.",
        priceClp: 9800,
      },
      {
        name: "Pastel de choclo",
        description: "Pino de carne, pollo, huevo y aceituna, gratinado en greda.",
        priceClp: 10500,
      },
      {
        name: "Merluza frita con puré",
        description: "Filete de merluza austral apanado, puré rústico y ensalada chilena.",
        priceClp: 9200,
      },
      {
        name: "Costillar de chancho",
        description: "Costillar dorado al horno con papas cocidas y pebre.",
        priceClp: 13900,
      },
    ],
  },
  {
    category: "Sándwiches",
    products: [
      {
        name: "Churrasco italiano",
        description: "Churrasco de posta con palta, tomate y mayonesa casera en pan frica.",
        priceClp: 8500,
      },
      {
        name: "Barros Luco",
        description: "Churrasco y queso fundido en marraqueta tostada.",
        priceClp: 8900,
      },
      {
        name: "Ave palta",
        description: "Pechuga de pollo grillada con palta molida en pan amasado.",
        priceClp: 7800,
      },
    ],
  },
  {
    category: "Bebidas y bajativos",
    products: [
      {
        name: "Mote con huesillo",
        description: "El clásico refresco chileno, bien helado.",
        priceClp: 3500,
      },
      {
        name: "Jugo natural de frambuesa",
        description: "Frambuesas del sur, sin azúcar añadida.",
        priceClp: 4200,
      },
      {
        name: "Bebida en lata 350cc",
        description: "Coca-Cola, Fanta, Sprite o Pap.",
        priceClp: 2500,
      },
      {
        name: "Pisco sour",
        description: "Receta de la casa con pisco 35°, limón de Pica y goma.",
        priceClp: 5500,
      },
      {
        name: "Terremoto",
        description: "Pipeño, helado de piña y granadina. Con cuidado.",
        priceClp: 5900,
      },
    ],
  },
];

const TABLE_COUNT = 8;

const ADMIN_EMAIL = "admin@lapicada.cl";
const ADMIN_PASSWORD = "picada-demo-2026";

async function main() {
  await prisma.restaurant.deleteMany({ where: { slug: RESTAURANT_SLUG } });

  const restaurant = await prisma.restaurant.create({
    data: {
      slug: RESTAURANT_SLUG,
      name: "La Picada del Puerto",
      categories: {
        create: menu.map((category, categoryIndex) => ({
          name: category.category,
          position: categoryIndex,
          products: {
            create: category.products.map((product, productIndex) => ({
              ...product,
              position: productIndex,
            })),
          },
        })),
      },
      tables: {
        create: Array.from({ length: TABLE_COUNT }, (_, i) => ({
          number: i + 1,
          // Stable, non-guessable-enough for a demo. Real deployments
          // regenerate tokens from the admin panel.
          qrToken: `demo-mesa-${i + 1}-7f3k`,
        })),
      },
      admins: {
        create: {
          email: ADMIN_EMAIL,
          name: "Carla Fuentes",
          passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
        },
      },
    },
    include: {
      tables: { orderBy: { number: "asc" } },
      categories: { include: { products: true } },
    },
  });

  const productCount = restaurant.categories.reduce((sum, c) => sum + c.products.length, 0);

  console.log(`Seeded "${restaurant.name}" (${restaurant.slug})`);
  console.log(`  ${restaurant.categories.length} categories, ${productCount} products`);
  console.log(`  ${restaurant.tables.length} tables:`);
  for (const table of restaurant.tables) {
    console.log(`    Mesa ${table.number}: /r/${restaurant.slug}/${table.qrToken}`);
  }
  console.log(`  Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

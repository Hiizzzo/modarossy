export type SubCategory = { label: string; slug: string };
export type MegaCategory = {
  key: "mujer" | "hombre";
  label: string;
  groups: { title: string; items: SubCategory[] }[];
};

export const megaCategories: MegaCategory[] = [
  {
    key: "mujer",
    label: "Mujer",
    groups: [
      {
        title: "Prendas",
        items: [
          { label: "Remeras", slug: "remeras" },
          { label: "Buzos", slug: "buzos" },
          { label: "Camperas", slug: "camperas" },
          { label: "Camisas", slug: "camisas" },
          { label: "Vestidos", slug: "vestidos" },
        ],
      },
      {
        title: "Inferior",
        items: [
          { label: "Pantalones", slug: "pantalones" },
          { label: "Jeans", slug: "jeans" },
          { label: "Polleras", slug: "polleras" },
          { label: "Shorts", slug: "shorts" },
        ],
      },
      {
        title: "Calzado",
        items: [
          { label: "Zapatillas", slug: "zapatillas" },
          { label: "Botas", slug: "botas" },
          { label: "Sandalias", slug: "sandalias" },
        ],
      },
      {
        title: "Accesorios",
        items: [
          { label: "Gorros", slug: "gorros" },
          { label: "Medias", slug: "medias" },
          { label: "Bolsos", slug: "bolsos" },
          { label: "Cinturones", slug: "cinturones" },
        ],
      },
    ],
  },
  {
    key: "hombre",
    label: "Hombre",
    groups: [
      {
        title: "Prendas",
        items: [
          { label: "Remeras", slug: "remeras" },
          { label: "Buzos", slug: "buzos" },
          { label: "Camperas", slug: "camperas" },
          { label: "Camisas", slug: "camisas" },
          { label: "Sweaters", slug: "sweaters" },
        ],
      },
      {
        title: "Inferior",
        items: [
          { label: "Pantalones", slug: "pantalones" },
          { label: "Jeans", slug: "jeans" },
          { label: "Joggings", slug: "joggings" },
          { label: "Shorts", slug: "shorts" },
        ],
      },
      {
        title: "Calzado",
        items: [
          { label: "Zapatillas", slug: "zapatillas" },
          { label: "Botas", slug: "botas" },
          { label: "Náuticos", slug: "nauticos" },
        ],
      },
      {
        title: "Accesorios",
        items: [
          { label: "Gorros", slug: "gorros" },
          { label: "Medias", slug: "medias" },
          { label: "Riñoneras", slug: "rinoneras" },
          { label: "Cinturones", slug: "cinturones" },
        ],
      },
    ],
  },
];

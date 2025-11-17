import { useLocation } from "react-router";

const brands = [
  {
    name: "toronto",
    // url: "https://cdn.brandfetch.io/idnJghVvI8/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "lakers",
    url: "https://cdn.brandfetch.io/idn5SQijok/w/70/h/70/theme/light/logo.png?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "barcelona",
    url: "https://cdn.brandfetch.io/idUZjgming/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "yankees",
    // url: "https://cdn.brandfetch.io/idmJayzTkf/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "manchester",
    url: "https://cdn.brandfetch.io/id5lpOUZES/w/252/h/252/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "all-blacks",
    // url: "https://cdn.brandfetch.io/id2vGwzwTT/theme/dark/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "boca-jnrs",
    // url: "https://cdn.brandfetch.io/id_0dwKPKT/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    name: "shield",
    // url: "https://cdn.brandfetch.io/idyqQWKFVE/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
];
export default function FeaturedClubs() {
  const { pathname } = useLocation();

  return (
    <section
      className={`flex items-center justify-center ${
        pathname === "/about" ? "bg-gray-100" : "bg-slate-50"
      } py-8 md:py-12`}
    >
      <div className="w-full flex-col max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="flex flex-col text-zinc-900 items-center py-8 md:py-12 justify-center">
          <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-center">
            Featured Clubs
          </h3>
          <p className="text-sm md:text-base lg:text-lg max-w-lg text-center mt-2">
            Connecting with the world's leading clubs that foster excellence and
            resilience
          </p>
        </div>

        <ul className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:justify-between items-center justify-items-center gap-4 sm:gap-6 md:gap-8 py-8">
          {brands.map((brand) => (
            <li
              key={brand.name}
              className="flex items-center justify-center w-full max-w-[80px] sm:max-w-[100px] md:max-w-[120px] aspect-square hover:scale-105 transition-transform duration-300 mx-auto"
            >
              <img
                src={brand.url ? brand.url : `/assets/logos/${brand.name}.webp`}
                alt={`${brand.name} logo`}
                width={200}
                height={290}
                className="w-full h-auto object-contain"
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

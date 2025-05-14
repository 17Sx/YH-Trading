import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"], // Activation du mode sombre via une classe HTML
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Pour Aceternity UI, si les composants sont dans node_modules
    "./node_modules/aceternity-ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          accent: "#7e5bef", // Ta couleur d'accentuation violette
        },
        // Tu peux définir ici d'autres couleurs de base pour le thème sombre
        // Par exemple :
        // background: '#121212', // Un fond sombre typique
        // foreground: '#e0e0e0', // Texte clair pour le contraste
      },
      // Étendre d'autres aspects du thème si nécessaire (espacement, typographie, etc.)
    },
  },
  plugins: [
    // Ajouter ici les plugins Tailwind si tu en utilises, par exemple celui d'Aceternity UI si nécessaire
  ],
};

export default config; 
import type { MetadataRoute } from "next";

// Installable on a phone's home screen. Icons are the Mokshify M mark (assets/brand/, copied to public/icons/).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mokshify Desk",
    short_name: "Desk",
    description: "Every enquiry captured, answered and followed up.",
    id: "/today",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#E4E2DC",
    theme_color: "#2A0A12",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-180.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "Today", url: "/today" },
      { name: "Leads", url: "/leads" },
      { name: "Pipeline", url: "/pipeline" },
    ],
  };
}

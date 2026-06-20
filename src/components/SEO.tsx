import { Helmet, HelmetProvider } from "react-helmet-async";

interface SEOProps {
    title: string;
    description?: string;
}

export default function SEO({ title, description }: SEOProps) {
    const metaDescription =
        description ||
        "Al-Furqan - Your spiritual companion for Quran, Salah, and Reflection.";

    return (
        <HelmetProvider>
            <Helmet>
                <title>{title} | Al-Furqan</title>
                <meta name="description" content={metaDescription} />
            </Helmet>
        </HelmetProvider>
    );
}

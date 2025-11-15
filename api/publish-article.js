// api/publish-article.js

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    // 1) Instancier le client OpenAI avec la clé depuis Vercel
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 2) PROMPT AFFINÉ : style Juliette Arnaud, non factuel, 300–500 mots
    const prompt = `
Écris un article de 300 à 500 mots en français sur Rosas, en Espagne.

Ton style doit rappeler celui de Juliette Arnaud : vivant, oral, drôle, un peu décalé, avec de petites digressions tendres et des images précises. Utilise un ton complice, qui parle directement au lecteur, mais sans jamais inventer un fait précis ou vérifiable.

Contenu obligatoire :
- une activité touristique ou culturelle (décrite de manière générale, sans informations factuelles exactes)
- un élément de gastronomie locale (décrit sans prix, sans date, sans localisation précise)
- un détail lié à la culture catalane (général, non factuel)
- un lien avec le voyage en Espagne de manière plus générale (sensations, impressions, clichés doux)

Contraintes strictes :
- ne donne aucune date, aucun prix, aucun chiffre, aucun nom propre vérifiable
- ne cite aucune information factuelle ou historique précise
- ne présente aucune affirmation impossible à vérifier
- pas de lieux exacts, pas de noms de restaurants, pas de parties de ville nommées
- utilise uniquement des descriptions générales, des impressions subjectives et des éléments narratifs
- le texte doit rester entièrement fictionnel, impressionniste et non factuel

Style :
- phrases courtes à moyennes
- transitions fluides et naturelles
- ton chaleureux, accessible, un peu théâtral
- humour discret mais présent
- immersion sensorielle (odeurs, lumière, ambiance)
- aucun mot-clé SEO forcé
- pas d’introduction ni de conclusion formatées (pas de “Introduction”, “Conclusion”)

Objectif :
- créer un article narratif, sensible et vivant
- donner envie au lecteur de voyager à Rosas
- rester 100 % non factuel
    `.trim();

    // 3) Appel à l'API OpenAI
    const response = await client.responses.create({
      model: "gpt-4.1-mini", // tu peux changer en gpt-4.1 si tu veux plus "premium"
      input: prompt,
    });

    const articleContent = response.output_text?.trim();
    if (!articleContent) {
      return res.status(500).json({ error: "Aucun texte généré par OpenAI" });
    }

    // 4) Construire un titre à partir de la première phrase
    const firstLine = articleContent.split("\n").find((l) => l.trim().length > 0) || "";
    const words = firstLine.split(" ").slice(0, 10).join(" ");
    const title =
      words && words.length > 0
        ? words
        : "Article sur Rosas généré automatiquement";

    // 5) Préparer la requête vers WordPress
    const wpUser = process.env.WP_API_USER;
    const wpPassword = process.env.WP_API_PASSWORD;
    const wpUrl = process.env.WP_API_URL;

    const authString = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

    const wpResponse = await fetch(wpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        title,
        content: articleContent,
        status: "publish",
      }),
    });

    if (!wpResponse.ok) {
      const text = await wpResponse.text();
      console.error("Erreur WordPress:", text);
      return res
        .status(500)
        .json({ error: "Erreur côté WordPress", details: text });
    }

    const wpPost = await wpResponse.json();

    // 6) Réponse JSON propre
    return res.status(200).json({
      success: true,
      postId: wpPost.id,
      link: wpPost.link,
      title: wpPost.title?.rendered,
    });
  } catch (err) {
    console.error("Erreur API:", err);
    return res.status(500).json({ error: "Erreur serveur", details: String(err) });
  }
}
